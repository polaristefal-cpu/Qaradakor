import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-user-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabaseAdmin = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const supabaseAnon = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

const TMDB_BASE = "https://api.themoviedb.org/3";
const tmdbKey = () => Deno.env.get("TMDB_API_KEY")!;
const openaiKey = () => Deno.env.get("OPENAI_API_KEY")!;
const AVATAR_BUCKET = "make-59141208-avatars";

// Create avatar bucket on startup
(async () => {
  try {
    const supabase = supabaseAdmin();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === AVATAR_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(AVATAR_BUCKET, { public: false });
      console.log("[Storage] Avatar bucket created:", AVATAR_BUCKET);
    }
  } catch (e: any) {
    console.log("[Storage] Bucket init error:", e.message);
  }
})();

async function callOpenAI(messages: any[], temperature = 0.7, max_tokens = 1024) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      messages,
      temperature,
      max_tokens,
    }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
  return data.choices[0].message.content;
}

function tmdbFetch(path: string) {
  const apiKey = tmdbKey();
  const isJwt = apiKey?.startsWith("ey");
  const url = isJwt ? `${TMDB_BASE}${path}` : `${TMDB_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;
  const headers: Record<string, string> = {};
  if (isJwt) headers["Authorization"] = `Bearer ${apiKey}`;
  return fetch(url, { headers });
}

async function getUser(c: any): Promise<{ id: string; email: string } | null> {
  // Session token is passed via x-user-token header (Authorization is reserved for Supabase gateway)
  const token = c.req.header("x-user-token");
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log("getUser error:", error?.message);
    return null;
  }
  return { id: data.user.id, email: data.user.email || "" };
}

// Health
app.get("/make-server-59141208/health", (c) => c.json({ status: "ok" }));

// ---- AUTH ----
app.post("/make-server-59141208/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });
    if (error) return c.json({ error: `Signup error: ${error.message}` }, 400);
    // Save profile
    await kv.set(`user:${data.user.id}:profile`, { name, email });
    return c.json({ user: { id: data.user.id, email: data.user.email, name } });
  } catch (e: any) {
    return c.json({ error: `Signup exception: ${e.message}` }, 500);
  }
});

// ---- TMDB PROXY ----
app.get("/make-server-59141208/tmdb/*", async (c) => {
  try {
    const apiKey = tmdbKey();
    console.log("TMDB_API_KEY env check - present:", !!apiKey, "length:", apiKey?.length, "first4:", apiKey?.substring(0, 4));
    
    if (!apiKey) {
      return c.json({ error: "TMDB_API_KEY not configured" }, 500);
    }
    
    let path = c.req.path.replace("/make-server-59141208/tmdb", "");
    // Forward query params from client
    const reqUrl = new URL(c.req.url);
    const params = new URLSearchParams();
    reqUrl.searchParams.forEach((v, k) => params.set(k, v));
    const qs = params.toString();
    if (qs) path += (path.includes("?") ? "&" : "?") + qs;
    
    const resp = await tmdbFetch(path);
    const data = await resp.json();
    console.log("TMDB response status:", resp.status, "path:", path);
    if (!resp.ok) {
      console.log("TMDB error response:", JSON.stringify(data));
    }
    return c.json(data, resp.status as any);
  } catch (e: any) {
    console.log("TMDB proxy exception:", e.message);
    return c.json({ error: `TMDB proxy error: ${e.message}` }, 500);
  }
});

// ---- WATCHED MOVIES ----
app.get("/make-server-59141208/watched", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const watched = await kv.get(`user:${user.id}:watched`) || [];
  return c.json(watched);
});

app.post("/make-server-59141208/watched", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { movieId, rating, review } = await c.req.json();
  const watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
  const existing = watched.findIndex((w: any) => w.movieId === movieId);
  const entry = { movieId, rating, review, addedAt: new Date().toISOString() };
  if (existing >= 0) watched[existing] = entry;
  else watched.push(entry);
  await kv.set(`user:${user.id}:watched`, watched);
  return c.json({ ok: true });
});

app.delete("/make-server-59141208/watched/:movieId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const movieId = parseInt(c.req.param("movieId"));
  let watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
  watched = watched.filter((w: any) => w.movieId !== movieId);
  await kv.set(`user:${user.id}:watched`, watched);
  return c.json({ ok: true });
});

// ---- WATCHLIST ----
app.get("/make-server-59141208/watchlist", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const watchlist = await kv.get(`user:${user.id}:watchlist`) || [];
  return c.json(watchlist);
});

app.post("/make-server-59141208/watchlist", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { movieId, title, poster_path, release_date, vote_average } = await c.req.json();
    if (!movieId) return c.json({ error: "movieId required" }, 400);
    const watchlist: any[] = await kv.get(`user:${user.id}:watchlist`) || [];
    if (watchlist.some((w: any) => w.movieId === movieId)) {
      return c.json({ ok: true, alreadyExists: true });
    }
    watchlist.push({ movieId, title, poster_path, release_date, vote_average, addedAt: new Date().toISOString() });
    await kv.set(`user:${user.id}:watchlist`, watchlist);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Watchlist add error: ${e.message}` }, 500);
  }
});

app.delete("/make-server-59141208/watchlist/:movieId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const movieId = parseInt(c.req.param("movieId"));
  let watchlist: any[] = await kv.get(`user:${user.id}:watchlist`) || [];
  watchlist = watchlist.filter((w: any) => w.movieId !== movieId);
  await kv.set(`user:${user.id}:watchlist`, watchlist);
  return c.json({ ok: true });
});

// ---- FRIENDS ----
app.get("/make-server-59141208/friends", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  const profiles = [];
  for (const fid of friends) {
    const p = await kv.get(`user:${fid}:profile`);
    if (p) profiles.push({ id: fid, ...p });
  }
  return c.json(profiles);
});

app.post("/make-server-59141208/friends/request", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { targetEmail } = await c.req.json();
  // Find user by email
  const { data, error } = await supabaseAdmin().auth.admin.listUsers();
  if (error) return c.json({ error: `List users error: ${error.message}` }, 500);
  const target = data.users.find((u: any) => u.email === targetEmail);
  if (!target) return c.json({ error: "User not found" }, 404);
  if (target.id === user.id) return c.json({ error: "Cannot add yourself" }, 400);
  // Check if already friends
  const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  if (friends.includes(target.id)) return c.json({ error: "Already friends" }, 400);
  // Save request
  const requests: any[] = await kv.get(`user:${target.id}:friend_requests`) || [];
  if (requests.some((r: any) => r.fromId === user.id)) return c.json({ error: "Request already sent" }, 400);
  const profile = await kv.get(`user:${user.id}:profile`);
  requests.push({ fromId: user.id, fromName: profile?.name || "Unknown", fromEmail: profile?.email });
  await kv.set(`user:${target.id}:friend_requests`, requests);
  return c.json({ ok: true });
});

app.get("/make-server-59141208/friends/requests", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const requests = await kv.get(`user:${user.id}:friend_requests`) || [];
  return c.json(requests);
});

app.post("/make-server-59141208/friends/accept", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { fromId } = await c.req.json();
  // Add to both friends lists
  const myFriends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  const theirFriends: string[] = await kv.get(`user:${fromId}:friends`) || [];
  if (!myFriends.includes(fromId)) myFriends.push(fromId);
  if (!theirFriends.includes(user.id)) theirFriends.push(user.id);
  await kv.set(`user:${user.id}:friends`, myFriends);
  await kv.set(`user:${fromId}:friends`, theirFriends);
  // Remove request
  let requests: any[] = await kv.get(`user:${user.id}:friend_requests`) || [];
  requests = requests.filter((r: any) => r.fromId !== fromId);
  await kv.set(`user:${user.id}:friend_requests`, requests);
  return c.json({ ok: true });
});

app.post("/make-server-59141208/friends/reject", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { fromId } = await c.req.json();
  let requests: any[] = await kv.get(`user:${user.id}:friend_requests`) || [];
  requests = requests.filter((r: any) => r.fromId !== fromId);
  await kv.set(`user:${user.id}:friend_requests`, requests);
  return c.json({ ok: true });
});

app.delete("/make-server-59141208/friends/:friendId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const friendId = c.req.param("friendId");
  let myFriends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  let theirFriends: string[] = await kv.get(`user:${friendId}:friends`) || [];
  myFriends = myFriends.filter(f => f !== friendId);
  theirFriends = theirFriends.filter(f => f !== user.id);
  await kv.set(`user:${user.id}:friends`, myFriends);
  await kv.set(`user:${friendId}:friends`, theirFriends);
  return c.json({ ok: true });
});

// Get friend's watched list
app.get("/make-server-59141208/friends/:friendId/watched", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const friendId = c.req.param("friendId");
  const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  if (!friends.includes(friendId)) return c.json({ error: "Not friends" }, 403);
  const watched = await kv.get(`user:${friendId}:watched`) || [];
  return c.json(watched);
});

// ---- RECOMMENDATIONS (Content-Based Filtering with Weighted Scoring) ----
app.get("/make-server-59141208/recommendations", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
    if (watched.length === 0) {
      const resp = await tmdbFetch("/movie/popular?language=ru-RU");
      const data = await resp.json();
      return c.json(data.results?.slice(0, 20) || []);
    }

    // --- Step 1: Build user taste profile from ALL watched movies ---
    // Fetch details for all watched movies (genre info, credits)
    const movieDetails = new Map<number, any>();
    const detailPromises = watched.map(async (w: any) => {
      try {
        const resp = await tmdbFetch(`/movie/${w.movieId}?language=ru-RU&append_to_response=credits`);
        const d = await resp.json();
        if (d.id) movieDetails.set(w.movieId, d);
      } catch {}
    });
    await Promise.all(detailPromises);

    // Genre preference vector: sum of (rating/10) per genre
    const genreScores: Record<number, { score: number; name: string; count: number }> = {};
    // Director/actor frequency for highly rated movies (≥7)
    const directorCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};

    for (const w of watched) {
      const detail = movieDetails.get(w.movieId);
      if (!detail) continue;
      const normalizedRating = (w.rating || 5) / 10;

      // Accumulate genre scores
      for (const g of (detail.genres || [])) {
        if (!genreScores[g.id]) genreScores[g.id] = { score: 0, name: g.name, count: 0 };
        genreScores[g.id].score += normalizedRating;
        genreScores[g.id].count += 1;
      }

      // Track directors & actors from highly rated movies
      if ((w.rating || 0) >= 7) {
        const directors = detail.credits?.crew?.filter((cr: any) => cr.job === "Director") || [];
        for (const d of directors) {
          directorCounts[d.name] = (directorCounts[d.name] || 0) + 1;
        }
        const topActors = detail.credits?.cast?.slice(0, 5) || [];
        for (const a of topActors) {
          actorCounts[a.name] = (actorCounts[a.name] || 0) + 1;
        }
      }
    }

    // Normalize genre weights to [0..1]
    const maxGenreScore = Math.max(...Object.values(genreScores).map(g => g.score), 1);
    const genreWeights: Record<number, number> = {};
    for (const [gid, g] of Object.entries(genreScores)) {
      genreWeights[Number(gid)] = g.score / maxGenreScore;
    }

    // Favorite directors/actors (appear in ≥2 highly rated movies)
    const favDirectors = new Set(Object.entries(directorCounts).filter(([, c]) => c >= 2).map(([n]) => n));
    const favActors = new Set(Object.entries(actorCounts).filter(([, c]) => c >= 2).map(([n]) => n));

    console.log("[Recs] Genre weights:", JSON.stringify(genreScores));
    console.log("[Recs] Fav directors:", [...favDirectors]);
    console.log("[Recs] Fav actors:", [...favActors].slice(0, 10));

    // --- Step 2: Gather candidates from top 8 rated movies ---
    const watchedIds = new Set(watched.map((w: any) => w.movieId));
    const topRated = [...watched].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
    const candidateMap = new Map<number, { movie: any; sourceRating: number }>();

    const recPromises = topRated.map(async (w: any) => {
      try {
        // Use both /recommendations and /similar for broader coverage
        const [recResp, simResp] = await Promise.all([
          tmdbFetch(`/movie/${w.movieId}/recommendations?language=ru-RU`),
          tmdbFetch(`/movie/${w.movieId}/similar?language=ru-RU`),
        ]);
        const recData = await recResp.json();
        const simData = await simResp.json();
        const allResults = [...(recData.results || []), ...(simData.results || [])];
        for (const r of allResults) {
          if (!watchedIds.has(r.id) && !candidateMap.has(r.id)) {
            candidateMap.set(r.id, { movie: r, sourceRating: w.rating || 5 });
          }
        }
      } catch {}
    });
    await Promise.all(recPromises);

    // --- Step 3: Score each candidate ---
    // Fetch credits for candidates to check director/actor bonus
    const candidateIds = [...candidateMap.keys()];
    const creditMap = new Map<number, any>();
    const creditPromises = candidateIds.slice(0, 60).map(async (id) => {
      try {
        const resp = await tmdbFetch(`/movie/${id}?language=ru-RU&append_to_response=credits`);
        const d = await resp.json();
        if (d.id) creditMap.set(id, d);
      } catch {}
    });
    await Promise.all(creditPromises);

    const scored: { movie: any; score: number; breakdown: any }[] = [];

    for (const [id, { movie, sourceRating }] of candidateMap) {
      const detail = creditMap.get(id);

      // 1. Genre Match (0..1): average of genre weights for this movie's genres
      const movieGenreIds = (movie.genre_ids || detail?.genres?.map((g: any) => g.id) || []);
      let genreMatch = 0;
      if (movieGenreIds.length > 0) {
        const sum = movieGenreIds.reduce((acc: number, gid: number) => acc + (genreWeights[gid] || 0), 0);
        genreMatch = sum / movieGenreIds.length;
      }

      // 2. Source Weight (0..1): rating of the movie that generated this rec
      const sourceWeight = sourceRating / 10;

      // 3. Popularity / Quality (0..1): TMDB vote average
      const popularity = Math.min((movie.vote_average || 0) / 10, 1);

      // 4. Vote count confidence: penalize movies with very few votes
      const voteConfidence = Math.min((movie.vote_count || 0) / 100, 1);

      // 5. Director/Actor bonus
      let crewBonus = 0;
      if (detail?.credits) {
        const dirs = detail.credits.crew?.filter((cr: any) => cr.job === "Director") || [];
        if (dirs.some((d: any) => favDirectors.has(d.name))) crewBonus += 0.15;
        const actors = detail.credits.cast?.slice(0, 5) || [];
        if (actors.some((a: any) => favActors.has(a.name))) crewBonus += 0.10;
      }

      // Final score formula
      const finalScore =
        (genreMatch * 0.35) +
        (sourceWeight * 0.20) +
        (popularity * 0.20) +
        (voteConfidence * 0.10) +
        crewBonus +
        // Small bonus for higher TMDB popularity (log scale)
        (Math.min(Math.log10(Math.max(movie.popularity || 1, 1)) / 3, 1) * 0.05);

      // Minimum quality threshold
      if (finalScore >= 0.45 && (movie.vote_average || 0) >= 5.5) {
        scored.push({
          movie: { ...movie, _score: Math.round(finalScore * 100) },
          score: finalScore,
          breakdown: { genreMatch, sourceWeight, popularity, voteConfidence, crewBonus },
        });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    console.log(`[Recs] ${candidateMap.size} candidates → ${scored.length} passed threshold, returning top 20`);
    if (scored.length > 0) {
      console.log("[Recs] Top 3:", scored.slice(0, 3).map(s => ({
        title: s.movie.title,
        score: s.score.toFixed(3),
        ...s.breakdown,
      })));
    }

    return c.json(scored.slice(0, 20).map(s => s.movie));
  } catch (e: any) {
    console.log("[Recs] Error:", e.message);
    return c.json({ error: `Recommendations error: ${e.message}` }, 500);
  }
});

// User profile
app.get("/make-server-59141208/profile", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const profile = await kv.get(`user:${user.id}:profile`);
  return c.json({ id: user.id, ...profile });
});

app.put("/make-server-59141208/profile", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { name, bio, favoriteGenres } = await c.req.json();
    const existing = await kv.get(`user:${user.id}:profile`) || {};
    const updated = { ...existing, ...(name ? { name } : {}), ...(bio !== undefined ? { bio } : {}), ...(favoriteGenres ? { favoriteGenres } : {}) };
    await kv.set(`user:${user.id}:profile`, updated);
    return c.json({ ok: true, profile: updated });
  } catch (e: any) {
    return c.json({ error: `Update profile error: ${e.message}` }, 500);
  }
});

// ---- PHONE / 2FA SETTINGS ----
app.post("/make-server-59141208/profile/phone", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { phone, enable2fa } = await c.req.json();
    const existing = await kv.get(`user:${user.id}:profile`) || {};
    // Normalize phone: strip everything except digits, ensure 7XXXXXXXXXX format
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
    if (normalized.length !== 11 || !normalized.startsWith("7")) {
      return c.json({ error: "Неверный формат номера. Используйте формат +7XXXXXXXXXX" }, 400);
    }
    const updated = { ...existing, phone: normalized, twofa_enabled: !!enable2fa };
    await kv.set(`user:${user.id}:profile`, updated);
    return c.json({ ok: true, phone: normalized, twofa_enabled: !!enable2fa });
  } catch (e: any) {
    return c.json({ error: `Save phone error: ${e.message}` }, 500);
  }
});

// ---- 2FA STATUS ----
app.get("/make-server-59141208/auth/2fa-status", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const profile = await kv.get(`user:${user.id}:profile`) || {};
  const enabled = !!(profile as any).twofa_enabled && !!(profile as any).phone;
  const phone: string = (profile as any).phone || "";
  // Mask phone for display: 7XXXXXXXXXX → +7 *** *** XX XX
  const masked = phone.length === 11
    ? `+7 *** *** ${phone.slice(7, 9)} ${phone.slice(9)}`
    : "";
  return c.json({ enabled, masked });
});

// ---- 2FA SETUP: Step 1 — verify password + send OTP to new phone ----
app.post("/make-server-59141208/auth/2fa-setup-send", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { phone, password } = await c.req.json();
    if (!phone || !password) return c.json({ error: "Укажите телефон и пароль" }, 400);

    // Verify current password by signing in with Supabase
    const { error: signInError } = await supabaseAnon().auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError) {
      return c.json({ error: "Неверный пароль" }, 401);
    }

    // Normalize phone
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
    if (normalized.length !== 11 || !normalized.startsWith("7")) {
      return c.json({ error: "Неверный формат номера. Используйте +7XXXXXXXXXX" }, 400);
    }

    // Rate-limit: не чаще раза в 60 секунд
    const existingOtp: any = await kv.get(`otp:${normalized}`) || {};
    if (existingOtp.sentAt && Date.now() - existingOtp.sentAt < 60_000) {
      const wait = Math.ceil((60_000 - (Date.now() - existingOtp.sentAt)) / 1000);
      return c.json({ error: `Подождите ${wait} сек. перед повторной отправкой` }, 429);
    }

    // Save phone temporarily (not yet enabled)
    const existing: any = await kv.get(`user:${user.id}:profile`) || {};
    await kv.set(`user:${user.id}:profile`, { ...existing, phone: normalized, twofa_enabled: false });

    // Generate & send OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await kv.set(`otp:${normalized}`, { code, expiresAt, attempts: 0, sentAt: Date.now(), purpose: "setup" });

    const apiKey = Deno.env.get("MOBIZON_API_KEY")!;
    const text = encodeURIComponent(`Qaradakor.kz: код подтверждения — ${code}. Действителен 5 минут.`);
    const mobizonUrl = `https://api.mobizon.kz/service/Message/SendSmsMessage?output=json&api=v1&apiKey=${apiKey}&recipient=${normalized}&text=${text}`;
    const resp = await fetch(mobizonUrl);
    const result = await resp.json();
    console.log("[2FA Setup] Mobizon response:", JSON.stringify(result));
    if (result.code !== 0) {
      return c.json({ error: `Ошибка отправки SMS: ${result.message}` }, 500);
    }

    const masked = `+7 *** *** ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
    return c.json({ ok: true, masked });
  } catch (e: any) {
    console.log("[2FA Setup Send] Error:", e.message);
    return c.json({ error: `Ошибка: ${e.message}` }, 500);
  }
});

// ---- 2FA SETUP: Step 2 — verify OTP and enable 2FA ----
app.post("/make-server-59141208/auth/2fa-setup-confirm", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { code } = await c.req.json();
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const phone: string = profile.phone || "";
    if (!phone) return c.json({ error: "Телефон не найден, начните сначала" }, 400);

    const stored: any = await kv.get(`otp:${phone}`);
    if (!stored) return c.json({ error: "Код не найден или истёк. Запросите новый." }, 400);
    if (Date.now() > stored.expiresAt) {
      await kv.del(`otp:${phone}`);
      return c.json({ error: "Код истёк. Запросите новый." }, 400);
    }
    if (stored.attempts >= 3) {
      await kv.del(`otp:${phone}`);
      return c.json({ error: "Превышено число попыток. Запросите новый код." }, 400);
    }
    if (stored.code !== String(code).trim()) {
      stored.attempts += 1;
      await kv.set(`otp:${phone}`, stored);
      const left = 3 - stored.attempts;
      return c.json({ error: `Неверный код. Осталось попыток: ${left}` }, 400);
    }

    // OTP correct — enable 2FA
    await kv.del(`otp:${phone}`);
    const updated = { ...profile, twofa_enabled: true };
    await kv.set(`user:${user.id}:profile`, updated);
    const masked = `+7 *** *** ${phone.slice(7, 9)} ${phone.slice(9)}`;
    return c.json({ ok: true, masked });
  } catch (e: any) {
    console.log("[2FA Setup Confirm] Error:", e.message);
    return c.json({ error: `Ошибка: ${e.message}` }, 500);
  }
});

// ---- 2FA DISABLE — verify password and disable 2FA ----
app.post("/make-server-59141208/auth/2fa-disable", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { password } = await c.req.json();
    if (!password) return c.json({ error: "Введите текущий пароль" }, 400);

    // Verify password
    const { error: signInError } = await supabaseAnon().auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError) {
      return c.json({ error: "Неверный пароль" }, 401);
    }

    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const updated = { ...profile, twofa_enabled: false };
    await kv.set(`user:${user.id}:profile`, updated);
    return c.json({ ok: true });
  } catch (e: any) {
    console.log("[2FA Disable] Error:", e.message);
    return c.json({ error: `Ошибка: ${e.message}` }, 500);
  }
});

// ---- SEND OTP ----
app.post("/make-server-59141208/auth/send-otp", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const phone: string = profile.phone || "";
    if (!phone) return c.json({ error: "Телефон не привязан к аккаунту" }, 400);

    // Rate-limit: не чаще раза в 60 секунд
    const existing: any = await kv.get(`otp:${phone}`) || {};
    if (existing.sentAt && Date.now() - existing.sentAt < 60_000) {
      const wait = Math.ceil((60_000 - (Date.now() - existing.sentAt)) / 1000);
      return c.json({ error: `Подождите ${wait} сек. перед повторной отправкой` }, 429);
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 минут
    await kv.set(`otp:${phone}`, { code, expiresAt, attempts: 0, sentAt: Date.now() });

    // Send via Mobizon
    const apiKey = Deno.env.get("MOBIZON_API_KEY")!;
    const text = encodeURIComponent(`Qaradakor.kz: ваш код подтверждения — ${code}. Действителен 5 минут.`);
    const mobizonUrl = `https://api.mobizon.kz/service/Message/SendSmsMessage?output=json&api=v1&apiKey=${apiKey}&recipient=${phone}&text=${text}`;

    const resp = await fetch(mobizonUrl);
    const result = await resp.json();
    console.log("[2FA] Mobizon response:", JSON.stringify(result));

    if (result.code !== 0) {
      console.log("[2FA] Mobizon error:", result.message);
      return c.json({ error: `Ошибка отправки SMS: ${result.message}` }, 500);
    }

    // Mask phone for response
    const masked = `+7 *** *** ${phone.slice(7, 9)} ${phone.slice(9)}`;
    return c.json({ ok: true, masked });
  } catch (e: any) {
    console.log("[2FA] send-otp exception:", e.message);
    return c.json({ error: `Ошибка отправки OTP: ${e.message}` }, 500);
  }
});

// ---- VERIFY OTP ----
app.post("/make-server-59141208/auth/verify-otp", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { code } = await c.req.json();
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const phone: string = profile.phone || "";
    if (!phone) return c.json({ error: "Телефон не привязан" }, 400);

    const stored: any = await kv.get(`otp:${phone}`);
    if (!stored) return c.json({ error: "Код не найден или истёк. Запросите новый." }, 400);
    if (Date.now() > stored.expiresAt) {
      await kv.del(`otp:${phone}`);
      return c.json({ error: "Код истёк. Запросите новый." }, 400);
    }
    if (stored.attempts >= 3) {
      await kv.del(`otp:${phone}`);
      return c.json({ error: "Превышено число попыток. Запросите новый код." }, 400);
    }
    if (stored.code !== String(code).trim()) {
      stored.attempts += 1;
      await kv.set(`otp:${phone}`, stored);
      const left = 3 - stored.attempts;
      return c.json({ error: `Неверный код. Осталось попыток: ${left}` }, 400);
    }

    // Success — delete OTP
    await kv.del(`otp:${phone}`);
    return c.json({ ok: true });
  } catch (e: any) {
    console.log("[2FA] verify-otp exception:", e.message);
    return c.json({ error: `Ошибка верификации: ${e.message}` }, 500);
  }
});

// ---- AI CHAT (LLM-powered movie discovery) ----
app.post("/make-server-59141208/ai/chat", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { message, history } = await c.req.json();

    // Build user taste context
    const watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
    const movieNames: string[] = [];
    const genreCounts: Record<string, number> = {};

    // Fetch details for watched movies to build context
    const detailPromises = watched.slice(0, 20).map(async (w: any) => {
      try {
        const resp = await tmdbFetch(`/movie/${w.movieId}?language=ru-RU`);
        const d = await resp.json();
        if (d.title) {
          movieNames.push(`${d.title} (оценка: ${w.rating || '?'}/10)`);
          for (const g of (d.genres || [])) {
            genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
          }
        }
      } catch {}
    });
    await Promise.all(detailPromises);

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const systemPrompt = `Ты — Qaradakor AI, интеллектуальный кино-ассистент. Ты помогаешь пользователю находить фильмы, отвечаешь на вопросы о кино, и даёшь персонализированные рекомендации.

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
- Просмотрено фильмов: ${watched.length}
- Любимые жанры: ${topGenres.join(", ") || "пока не определены"}
- Последние просмотренные: ${movieNames.slice(0, 10).join("; ") || "пока нет"}

ПРАВИЛА:
1. Отвечай на русском языке
2. Когда рекомендуешь фильмы, ОБЯЗАТЕЛЬНО включай JSON-блок в формате:
   |||MOVIES|||[{"title":"Название на английском","year":2020}]|||END|||
   Это нужно для автоматического поиска в TMDB. Включай этот блок ПОСЛЕ текстового ответа.
3. Объясняй ПОЧЕМУ конкретный фильм подойдёт этому пользователю, основываясь на его вкусах
4. Будь дружелюбным и увлечённым кино
5. Можешь обсуждать режиссёров, актёров, жанры, киноисторию
6. Если пользователь описывает настроение или ситуацию, подбирай фильмы под это`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    const aiResponse = await callOpenAI(messages, 0.8, 1500);

    // Extract movie recommendations from AI response
    const movieMatch = aiResponse.match(/\|\|\|MOVIES\|\|\|(.*?)\|\|\|END\|\|\|/s);
    let movies: any[] = [];
    let cleanResponse = aiResponse.replace(/\|\|\|MOVIES\|\|\|.*?\|\|\|END\|\|\|/s, "").trim();

    if (movieMatch) {
      try {
        const parsed = JSON.parse(movieMatch[1]);
        // Search TMDB for each recommended movie
        const searchPromises = parsed.map(async (m: any) => {
          try {
            const resp = await tmdbFetch(`/search/movie?query=${encodeURIComponent(m.title)}&language=ru-RU&year=${m.year || ""}`);
            const data = await resp.json();
            if (data.results?.[0]) return data.results[0];
          } catch {}
          return null;
        });
        const results = await Promise.all(searchPromises);
        movies = results.filter(Boolean);
      } catch (e) {
        console.log("[AI Chat] Failed to parse movie JSON:", e);
      }
    }

    return c.json({ response: cleanResponse, movies });
  } catch (e: any) {
    console.log("[AI Chat] Error:", e.message);
    return c.json({ error: `AI Chat error: ${e.message}` }, 500);
  }
});

// ---- AI: Sentiment analysis of review ----
app.post("/make-server-59141208/ai/analyze-review", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { review, movieTitle } = await c.req.json();
    if (!review || review.trim().length < 5) {
      return c.json({ sentiment: "neutral", score: 0.5, summary: "Слишком короткий отзыв для анализа" });
    }

    const response = await callOpenAI([
      {
        role: "system",
        content: `Ты — AI-анализатор тональности кинорецензий. Проанализируй отзыв пользователя и верни JSON:
{
  "sentiment": "positive" | "negative" | "mixed" | "neutral",
  "score": число от 0.0 (очень негативно) до 1.0 (очень позитивно),
  "emotions": ["список основных эмоций, например: восторг, разочарование, ностальгия"],
  "summary": "Краткое описание тональности на русском в 1 предложение",
  "keywords": ["ключевые слова из отзыва, отражающие мнение"]
}
Отвечай ТОЛЬКО валидным JSON.`
      },
      { role: "user", content: `Фильм: "${movieTitle || 'Неизвестно'}"\nОтзыв: "${review}"` }
    ], 0.3, 500);

    const parsed = JSON.parse(response);
    return c.json(parsed);
  } catch (e: any) {
    console.log("[AI Review] Error:", e.message);
    return c.json({ sentiment: "neutral", score: 0.5, summary: "Не удалось проанализировать", error: e.message });
  }
});

// ---- AI: "Why you'll like this" explanation ----
app.post("/make-server-59141208/ai/explain", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { movieId } = await c.req.json();

    // Get user's watched list and the target movie
    const [watched, movieResp] = await Promise.all([
      kv.get(`user:${user.id}:watched`),
      tmdbFetch(`/movie/${movieId}?language=ru-RU&append_to_response=credits`),
    ]);
    const movieData = await movieResp.json();
    const watchedList: any[] = watched || [];

    // Get details of user's top rated movies for context
    const topRated = [...watchedList].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    const topMovieDetails: string[] = [];
    for (const w of topRated) {
      try {
        const resp = await tmdbFetch(`/movie/${w.movieId}?language=ru-RU`);
        const d = await resp.json();
        if (d.title) topMovieDetails.push(`${d.title} (${w.rating}/10)`);
      } catch {}
    }

    const director = movieData.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Неизвестно";
    const cast = movieData.credits?.cast?.slice(0, 3).map((a: any) => a.name).join(", ") || "";
    const genres = movieData.genres?.map((g: any) => g.name).join(", ") || "";

    const response = await callOpenAI([
      {
        role: "system",
        content: "Ты — кино-эксперт. Объясни коротко (2-3 предложения) почему этот фильм может понравиться пользователю, основываясь на его вкусах. Будь конкретным и убедительным. Отвечай на русском."
      },
      {
        role: "user",
        content: `Фильм: "${movieData.title}" (${movieData.release_date?.slice(0,4)})
Жанры: ${genres}
Режиссёр: ${director}
Актёры: ${cast}
Рейтинг TMDB: ${movieData.vote_average}
Описание: ${movieData.overview?.slice(0, 300)}

Любимые фильмы пользователя: ${topMovieDetails.join("; ") || "пока нет оценок"}`
      }
    ], 0.7, 300);

    return c.json({ explanation: response });
  } catch (e: any) {
    console.log("[AI Explain] Error:", e.message);
    return c.json({ explanation: "Не удалось сгенерировать объяснение", error: e.message });
  }
});

// ---- AVATAR UPLOAD ----
app.post("/make-server-59141208/profile/avatar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const formData = await c.req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return c.json({ error: "Файл не предоставлен" }, 400);
    if (!file.type.startsWith("image/")) return c.json({ error: "Разрешены только изображения" }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ error: "Файл слишком большой (макс. 5 МБ)" }, 400);

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin().storage
      .from(AVATAR_BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) return c.json({ error: `Ошибка загрузки: ${uploadError.message}` }, 500);

    const { data: signedData, error: signedError } = await supabaseAdmin().storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 365 * 24 * 60 * 60);

    if (signedError) return c.json({ error: `Ошибка URL: ${signedError.message}` }, 500);

    const existing: any = await kv.get(`user:${user.id}:profile`) || {};
    await kv.set(`user:${user.id}:profile`, { ...existing, avatarPath: path });

    console.log("[Avatar] Uploaded for user:", user.id);
    return c.json({ ok: true, url: signedData.signedUrl });
  } catch (e: any) {
    console.log("[Avatar] Upload error:", e.message);
    return c.json({ error: `Ошибка загрузки аватара: ${e.message}` }, 500);
  }
});

// ---- GET AVATAR URL ----
app.get("/make-server-59141208/profile/avatar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    if (!profile.avatarPath) return c.json({ url: null });

    const { data, error } = await supabaseAdmin().storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(profile.avatarPath, 365 * 24 * 60 * 60);

    if (error) return c.json({ url: null });
    return c.json({ url: data.signedUrl });
  } catch (e: any) {
    console.log("[Avatar] Get error:", e.message);
    return c.json({ url: null });
  }
});

Deno.serve(app.fetch);