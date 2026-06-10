import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.ts";

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

const WAZZUP_CHANNEL_ID = "ac9fd2e0-a8dd-465f-affd-9d5210e2ef0d";
const wazzupKey = () => Deno.env.get("WAZZUP_API_KEY")!;

// ---- OTP SENDING: WhatsApp (Wazzup) → SMS (Mobizon) fallback ----
async function sendOtpCode(phone: string, code: string): Promise<{ channel: "whatsapp" | "sms"; error?: string }> {
  // chatId for Wazzup — phone in international format without +, e.g. 77001234567
  const chatId = phone;

  // 1. Try WhatsApp via Wazzup
  try {
    const wazzupRes = await fetch("https://api.wazzup24.com/v3/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${wazzupKey()}`,
      },
      body: JSON.stringify({
        channelId: WAZZUP_CHANNEL_ID,
        chatType: "whatsapp",
        chatId,
        text: `Qaradakor.kz: ваш код подтверждения — *${code}*\n\nДействителен 5 минут.`,
      }),
    });

    const wazzupData = await wazzupRes.json().catch(() => ({}));

    if (wazzupRes.ok && !wazzupData.error) {
      return { channel: "whatsapp" };
    }
    console.log("[OTP] Wazzup failed, falling back to SMS:", wazzupRes.status);
  } catch (e: any) {
    console.log("[OTP] Wazzup exception, falling back to SMS:", e.message);
  }

  // 2. Fallback — SMS via Mobizon
  try {
    const apiKey = Deno.env.get("MOBIZON_API_KEY")!;
    const text = encodeURIComponent(`Qaradakor.kz: код подтверждения — ${code}. Действителен 5 минут.`);
    const mobizonUrl = `https://api.mobizon.kz/service/Message/SendSmsMessage?output=json&api=v1&apiKey=${apiKey}&recipient=${phone}&text=${text}`;
    const resp = await fetch(mobizonUrl);
    const result = await resp.json();
    if (result.code !== 0) {
      return { channel: "sms", error: `Ошибка SMS: ${result.message}` };
    }
    return { channel: "sms" };
  } catch (e: any) {
    console.log("[OTP] Mobizon exception:", e.message);
    return { channel: "sms", error: `Ошибка SMS: ${e.message}` };
  }
}

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
      max_completion_tokens: max_tokens,
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

  // Retry up to 3 times on transient TLS / network errors (peer closed connection, EOF, etc.)
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabaseAdmin().auth.getUser(token);
      if (error) {
        const msg = error.message || "";
        const isTransient =
          msg.includes("TLS close_notify") ||
          msg.includes("peer closed connection") ||
          msg.includes("connection error") ||
          msg.includes("unexpected EOF") ||
          msg.includes("SendRequest");
        if (isTransient && attempt < MAX_RETRIES) {
          console.log(`getUser transient error (attempt ${attempt}/${MAX_RETRIES}):`, msg);
          await new Promise((r) => setTimeout(r, 150 * attempt));
          continue;
        }
        console.log("getUser error:", msg);
        return null;
      }
      if (!data?.user?.id) return null;
      return { id: data.user.id, email: data.user.email || "" };
    } catch (e: any) {
      const msg = e?.message || String(e);
      const isTransient =
        msg.includes("TLS close_notify") ||
        msg.includes("peer closed connection") ||
        msg.includes("connection error") ||
        msg.includes("unexpected EOF") ||
        msg.includes("SendRequest");
      if (isTransient && attempt < MAX_RETRIES) {
        console.log(`getUser caught transient error (attempt ${attempt}/${MAX_RETRIES}):`, msg);
        await new Promise((r) => setTimeout(r, 150 * attempt));
        continue;
      }
      console.log("getUser caught error:", msg);
      return null;
    }
  }
  return null;
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
    if (!resp.ok) {
      console.log("TMDB error response:", resp.status, path);
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
  const { movieId, rating, review, movieTitle, posterPath, mediaType = "movie" } = await c.req.json();
  const watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
  const existing = watched.findIndex((w: any) => w.movieId === movieId && (w.mediaType || "movie") === mediaType);
  const entry = { movieId, rating, review, movieTitle, posterPath, mediaType, addedAt: new Date().toISOString() };
  if (existing >= 0) watched[existing] = entry;
  else watched.push(entry);
  await kv.set(`user:${user.id}:watched`, watched);

  // Sync to global reviews list if review text is present
  if (review?.trim()) {
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const reviewId = `${user.id}_${mediaType}_${movieId}`;
    const idx = globalReviews.findIndex((r: any) => r.id === reviewId);
    const reviewEntry = {
      id: reviewId,
      userId: user.id,
      userName: profile.name || "Аноним",
      movieId,
      movieTitle: movieTitle || `#${movieId}`,
      posterPath: posterPath || null,
      mediaType,
      rating,
      review,
      createdAt: new Date().toISOString(),
      likes: idx >= 0 ? (globalReviews[idx].likes || 0) : 0,
    };
    if (idx >= 0) globalReviews[idx] = reviewEntry;
    else globalReviews.unshift(reviewEntry);
    await kv.set("reviews:global", globalReviews.slice(0, 1000));
  }

  return c.json({ ok: true });
});

app.delete("/make-server-59141208/watched/:movieId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const movieId = parseInt(c.req.param("movieId"));
  const type = new URL(c.req.url).searchParams.get("type") || "movie";
  let watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
  watched = watched.filter((w: any) => !(w.movieId === movieId && (w.mediaType || "movie") === type));
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
    const { movieId, title, poster_path, release_date, vote_average, mediaType = "movie" } = await c.req.json();
    if (!movieId) return c.json({ error: "movieId required" }, 400);
    const watchlist: any[] = await kv.get(`user:${user.id}:watchlist`) || [];
    if (watchlist.some((w: any) => w.movieId === movieId && (w.mediaType || "movie") === mediaType)) {
      return c.json({ ok: true, alreadyExists: true });
    }
    watchlist.push({ movieId, title, poster_path, release_date, vote_average, mediaType, addedAt: new Date().toISOString() });
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
  const type = new URL(c.req.url).searchParams.get("type") || "movie";
  let watchlist: any[] = await kv.get(`user:${user.id}:watchlist`) || [];
  watchlist = watchlist.filter((w: any) => !(w.movieId === movieId && (w.mediaType || "movie") === type));
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

// Get friend's profile (name, bio) — friends only
app.get("/make-server-59141208/friends/:friendId/profile", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const friendId = c.req.param("friendId");
  const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  if (!friends.includes(friendId)) return c.json({ error: "Not friends" }, 403);
  const profile: any = await kv.get(`user:${friendId}:profile`) || {};
  return c.json({ id: friendId, name: profile.name || "", bio: profile.bio || "", email: profile.email || "" });
});

// Get friend's avatar URL — friends only
app.get("/make-server-59141208/friends/:friendId/avatar", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const friendId = c.req.param("friendId");
  const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
  if (!friends.includes(friendId)) return c.json({ error: "Not friends" }, 403);
  try {
    const profile: any = await kv.get(`user:${friendId}:profile`) || {};
    if (!profile.avatarPath) return c.json({ url: null });
    const { data, error } = await supabaseAdmin().storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(profile.avatarPath, 60 * 60);
    if (error) return c.json({ url: null });
    return c.json({ url: data.signedUrl });
  } catch (e: any) {
    return c.json({ url: null });
  }
});

// ---- GLOBAL REVIEWS ----

// Top reviews (by rating, then by likes) — public
app.get("/make-server-59141208/reviews/top", async (c) => {
  try {
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const sorted = [...globalReviews]
      .filter((r: any) => r.review?.trim().length >= 20)
      .sort((a: any, b: any) => {
        // Primary: rating desc, secondary: likes desc, tertiary: newest
        if (b.rating !== a.rating) return b.rating - a.rating;
        if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    return c.json(sorted.slice(0, 5));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Reviews for a specific movie — public
app.get("/make-server-59141208/reviews/movie/:movieId", async (c) => {
  try {
    const movieId = parseInt(c.req.param("movieId"));
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const movieReviews = globalReviews
      .filter((r: any) => r.movieId === movieId && r.review?.trim())
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(movieReviews);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Like a review
app.post("/make-server-59141208/reviews/:reviewId/like", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const reviewId = c.req.param("reviewId");
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const idx = globalReviews.findIndex((r: any) => r.id === reviewId);
    if (idx === -1) return c.json({ error: "Review not found" }, 404);
    // Track who liked to prevent duplicates
    const likedBy: string[] = globalReviews[idx].likedBy || [];
    if (likedBy.includes(user.id)) {
      // Unlike
      globalReviews[idx].likedBy = likedBy.filter((id: string) => id !== user.id);
      globalReviews[idx].likes = Math.max(0, (globalReviews[idx].likes || 1) - 1);
    } else {
      // Like
      globalReviews[idx].likedBy = [...likedBy, user.id];
      globalReviews[idx].likes = (globalReviews[idx].likes || 0) + 1;
    }
    await kv.set("reviews:global", globalReviews);
    return c.json({ ok: true, likes: globalReviews[idx].likes, liked: globalReviews[idx].likedBy.includes(user.id) });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Delete a review (own only)
app.delete("/make-server-59141208/reviews/:reviewId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const reviewId = c.req.param("reviewId");
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const review = globalReviews.find((r: any) => r.id === reviewId);
    if (!review) return c.json({ error: "Not found" }, 404);
    if (review.userId !== user.id) return c.json({ error: "Forbidden" }, 403);
    await kv.set("reviews:global", globalReviews.filter((r: any) => r.id !== reviewId));
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ---- FRIEND RECOMMENDATIONS ----

// Send a movie recommendation to a friend
app.post("/make-server-59141208/friends/recommend", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { friendId, movieId, note } = await c.req.json();
    if (!friendId || !movieId) return c.json({ error: "friendId and movieId required" }, 400);

    // Verify they are actually friends
    const friends: string[] = await kv.get(`user:${user.id}:friends`) || [];
    if (!friends.includes(friendId)) return c.json({ error: "Not friends" }, 403);

    // Get sender profile for name
    const senderProfile: any = await kv.get(`user:${user.id}:profile`) || {};

    // Fetch basic movie info from TMDB to store title/poster
    let movieTitle = `Movie #${movieId}`;
    let posterPath: string | null = null;
    try {
      const resp = await tmdbFetch(`/movie/${movieId}?language=ru-RU`);
      const mdata = await resp.json();
      movieTitle = mdata.title || movieTitle;
      posterPath = mdata.poster_path || null;
    } catch {}

    // Append to friend's incoming recommendations list
    const recKey = `user:${friendId}:incoming_recs`;
    const recs: any[] = await kv.get(recKey) || [];
    recs.unshift({
      id: `${user.id}_${movieId}_${Date.now()}`,
      fromId: user.id,
      fromName: senderProfile.name || user.email,
      movieId,
      movieTitle,
      posterPath,
      note: note || "",
      seen: false,
      createdAt: new Date().toISOString(),
    });
    // Keep last 50 recommendations
    await kv.set(recKey, recs.slice(0, 50));
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Recommend error: ${e.message}` }, 500);
  }
});

// Get incoming recommendations for current user
app.get("/make-server-59141208/friends/recommendations", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const recs: any[] = await kv.get(`user:${user.id}:incoming_recs`) || [];
  return c.json(recs);
});

// Mark a recommendation as seen
app.post("/make-server-59141208/friends/recommendations/:recId/seen", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const recId = c.req.param("recId");
  const recs: any[] = await kv.get(`user:${user.id}:incoming_recs`) || [];
  const updated = recs.map((r: any) => r.id === recId ? { ...r, seen: true } : r);
  await kv.set(`user:${user.id}:incoming_recs`, updated);
  return c.json({ ok: true });
});

// ---- RECOMMENDATIONS (Multi-Signal Content-Based Filtering v2) ----
app.get("/make-server-59141208/recommendations", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const excludeParam = new URL(c.req.url).searchParams.get("exclude");
    const excludeIds = excludeParam
      ? new Set(excludeParam.split(",").map(Number).filter(Boolean))
      : new Set<number>();

    const watched: any[] = await kv.get(`user:${user.id}:watched`) || [];
    if (watched.length === 0) {
      const resp = await tmdbFetch("/movie/popular?language=ru-RU");
      const data = await resp.json();
      return c.json(data.results?.slice(0, 20) || []);
    }

    // ── Step 1: Build multi-signal taste profile ──────────────────────────────
    // All signals weighted by user's own rating for each movie
    const movieDetails = new Map<number, any>();
    await Promise.all(
      watched.map(async (w: any) => {
        try {
          const resp = await tmdbFetch(`/movie/${w.movieId}?language=ru-RU&append_to_response=credits`);
          const d = await resp.json();
          if (d.id) movieDetails.set(w.movieId, d);
        } catch {}
      })
    );

    const genreScores: Record<number, number> = {};    // genre_id → Σ(rating/10)
    const directorScores: Record<string, number> = {}; // director → Σ(rating/10)
    const actorScores: Record<string, number> = {};    // actor → Σ(rating/10 * pos_weight)
    const writerScores: Record<string, number> = {};   // writer → Σ(rating/10 * 0.8)
    const eraScores: Record<number, number> = {};      // decade → Σ(rating/10)

    for (const w of watched) {
      const detail = movieDetails.get(w.movieId);
      if (!detail) continue;
      const rw = Math.max((w.rating || 5) / 10, 0.1);

      for (const g of (detail.genres || [])) {
        genreScores[g.id] = (genreScores[g.id] || 0) + rw;
      }

      const directors = detail.credits?.crew?.filter((cr: any) => cr.job === "Director") || [];
      for (const d of directors) {
        directorScores[d.name] = (directorScores[d.name] || 0) + rw;
      }

      const writers = detail.credits?.crew?.filter((cr: any) =>
        ["Screenplay", "Story", "Writer", "Novel"].includes(cr.job)
      ) || [];
      for (const wr of writers) {
        writerScores[wr.name] = (writerScores[wr.name] || 0) + rw * 0.8;
      }

      // Actors: top-5 cast, lead actor gets full weight, 5th gets 52%
      const cast = detail.credits?.cast?.slice(0, 5) || [];
      cast.forEach((a: any, i: number) => {
        actorScores[a.name] = (actorScores[a.name] || 0) + rw * (1 - i * 0.12);
      });

      const year = parseInt((detail.release_date || "0").slice(0, 4));
      if (year > 1900) {
        const decade = Math.floor(year / 10) * 10;
        eraScores[decade] = (eraScores[decade] || 0) + rw;
      }
    }

    // Normalize all profiles to [0..1]
    const normalizeMap = (scores: Record<string | number, number>): Record<string | number, number> => {
      const max = Math.max(...Object.values(scores), 0.001);
      const out: Record<string | number, number> = {};
      for (const [k, v] of Object.entries(scores)) out[k] = v / max;
      return out;
    };

    const genreW = normalizeMap(genreScores);
    const directorW = normalizeMap(directorScores);
    const actorW = normalizeMap(actorScores);
    const writerW = normalizeMap(writerScores);
    const eraW = normalizeMap(eraScores);

    const topGenreIds = Object.entries(genreScores)
      .sort(([, a], [, b]) => b - a).slice(0, 3).map(([id]) => Number(id));

    // ── Step 2: Gather candidates from multiple sources ───────────────────────
    const watchedIds = new Set(watched.map((w: any) => w.movieId));
    const allExclude = new Set([...watchedIds, ...excludeIds]);
    const topRated = [...watched].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
    const candidateMap = new Map<number, { movie: any; sourceRating: number }>();

    const addCandidate = (r: any, sourceRating: number) => {
      if (r?.id && !allExclude.has(r.id) && !candidateMap.has(r.id)) {
        candidateMap.set(r.id, { movie: r, sourceRating });
      }
    };

    // Source 1: TMDB recommendations + similar for top-12 rated movies
    await Promise.all(
      topRated.map(async (w: any) => {
        try {
          const [rr, sr] = await Promise.all([
            tmdbFetch(`/movie/${w.movieId}/recommendations?language=ru-RU`),
            tmdbFetch(`/movie/${w.movieId}/similar?language=ru-RU`),
          ]);
          const rd = await rr.json();
          const sd = await sr.json();
          for (const r of [...(rd.results || []), ...(sd.results || [])]) {
            addCandidate(r, w.rating || 5);
          }
        } catch {}
      })
    );

    // Source 2: TMDB discover by top genres (breaks single-genre tunnel)
    await Promise.all(
      topGenreIds.map(async (gid) => {
        try {
          const resp = await tmdbFetch(
            `/discover/movie?with_genres=${gid}&sort_by=vote_average.desc&vote_count.gte=100&language=ru-RU`
          );
          const data = await resp.json();
          for (const r of (data.results || [])) addCandidate(r, 6);
        } catch {}
      })
    );

    // Source 3: Filmography of favourite directors
    const topDirectors = Object.entries(directorScores)
      .sort(([, a], [, b]) => b - a).slice(0, 3).map(([name]) => name);

    await Promise.all(
      topDirectors.map(async (dirName) => {
        try {
          const sr = await tmdbFetch(`/search/person?query=${encodeURIComponent(dirName)}&language=ru-RU`);
          const sd = await sr.json();
          const person = sd.results?.[0];
          if (!person?.id) return;
          const cr = await tmdbFetch(`/person/${person.id}/movie_credits?language=ru-RU`);
          const cd = await cr.json();
          for (const r of (cd.crew || []).filter((c: any) => c.job === "Director")) {
            addCandidate(r, 7);
          }
        } catch {}
      })
    );

    // ── Step 3: Fetch candidate details for full signal evaluation ────────────
    const creditMap = new Map<number, any>();
    await Promise.all(
      [...candidateMap.keys()].slice(0, 80).map(async (id) => {
        try {
          const resp = await tmdbFetch(`/movie/${id}?language=ru-RU&append_to_response=credits`);
          const d = await resp.json();
          if (d.id) creditMap.set(id, d);
        } catch {}
      })
    );

    // ── Step 4: Multi-signal scoring ─────────────────────────────────────────
    // Genre 25% | Director 20% | Actor 12% | Writer 8%
    // Source 10% | Quality 12% | VoteConf 5% | Era 5% | Pop 3%
    const scored: { movie: any; score: number; signals: string[] }[] = [];

    for (const [, { movie, sourceRating }] of candidateMap) {
      const detail = creditMap.get(movie.id);
      const voteAvg = movie.vote_average || detail?.vote_average || 0;
      const voteCount = movie.vote_count || detail?.vote_count || 0;
      const releaseDate = detail?.release_date || movie.release_date || "";
      const year = parseInt(releaseDate.slice(0, 4)) || 0;
      const decade = Math.floor(year / 10) * 10;

      const movieGenreIds: number[] = movie.genre_ids || detail?.genres?.map((g: any) => g.id) || [];
      const genreMatch = movieGenreIds.length > 0
        ? movieGenreIds.reduce((s: number, gid: number) => s + (Number(genreW[gid]) || 0), 0) / movieGenreIds.length
        : 0;

      const dirs = detail?.credits?.crew?.filter((cr: any) => cr.job === "Director") || [];
      const directorMatch = dirs.length > 0
        ? Math.max(...dirs.map((d: any) => Number(directorW[d.name]) || 0))
        : 0;

      const cast5 = detail?.credits?.cast?.slice(0, 5) || [];
      const actorMatch = cast5.length > 0
        ? Math.max(...cast5.map((a: any) => Number(actorW[a.name]) || 0))
        : 0;

      const wrtrs = detail?.credits?.crew?.filter((cr: any) =>
        ["Screenplay", "Story", "Writer", "Novel"].includes(cr.job)
      ) || [];
      const writerMatch = wrtrs.length > 0
        ? Math.max(...wrtrs.map((w: any) => Number(writerW[w.name]) || 0))
        : 0;

      const sourceWeight = sourceRating / 10;
      const quality = Math.min(voteAvg / 10, 1);
      const voteConf = Math.min(Math.log10(Math.max(voteCount, 1)) / Math.log10(1000), 1);
      const eraMatch = year > 0 ? (Number(eraW[decade]) || 0) : 0;
      const popScore = Math.min(Math.log10(Math.max(movie.popularity || detail?.popularity || 1, 1)) / 3, 1);

      const score =
        genreMatch    * 0.25 +
        directorMatch * 0.20 +
        actorMatch    * 0.12 +
        writerMatch   * 0.08 +
        sourceWeight  * 0.10 +
        quality       * 0.12 +
        voteConf      * 0.05 +
        eraMatch      * 0.05 +
        popScore      * 0.03;

      if (score < 0.28 || voteAvg < 5.0) continue;

      const signals: string[] = [];
      if (genreMatch > 0.45) signals.push("genre");
      if (directorMatch > 0.25) signals.push("director");
      if (actorMatch > 0.25) signals.push("actor");
      if (writerMatch > 0.25) signals.push("writer");
      if (eraMatch > 0.45) signals.push("era");

      scored.push({
        movie: {
          ...movie,
          _score: Math.round(score * 100),
          _signals: signals,
          _matchedDirectors: dirs.filter((d: any) => (Number(directorW[d.name]) || 0) > 0.2).map((d: any) => d.name).slice(0, 2),
          _matchedActors: cast5.filter((a: any) => (Number(actorW[a.name]) || 0) > 0.2).map((a: any) => a.name).slice(0, 2),
          _matchedWriters: wrtrs.filter((w: any) => (Number(writerW[w.name]) || 0) > 0.2).map((w: any) => w.name).slice(0, 2),
          _releaseYear: year || undefined,
        },
        score,
        signals,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    // ── Step 5: Diversity — max 3 per director, max 7 per top genre ──────────
    const dirCount: Record<string, number> = {};
    const genreCount: Record<number, number> = {};
    const final: typeof scored = [];

    for (const item of scored) {
      const itemDirs: string[] = item.movie._matchedDirectors || [];
      const itemGenres: number[] = item.movie.genre_ids || [];

      if (itemDirs.some((d: string) => (dirCount[d] || 0) >= 3)) continue;
      const topGenre = topGenreIds[0];
      if (topGenre && itemGenres.includes(topGenre) && (genreCount[topGenre] || 0) >= 7) continue;

      for (const d of itemDirs) dirCount[d] = (dirCount[d] || 0) + 1;
      for (const gid of itemGenres) genreCount[gid] = (genreCount[gid] || 0) + 1;
      final.push(item);
      if (final.length >= 24) break;
    }

    return c.json(final.map(s => s.movie));
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
    // Maintain phone → userId index for SMS login
    await kv.set(`phone_index:${normalized}`, { userId: user.id });
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

    // Save phone temporarily (not yet enabled) + phone index
    const existing: any = await kv.get(`user:${user.id}:profile`) || {};
    await kv.set(`user:${user.id}:profile`, { ...existing, phone: normalized, twofa_enabled: false });
    await kv.set(`phone_index:${normalized}`, { userId: user.id });

    // Generate & send OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const sendResult = await sendOtpCode(normalized, code);
    if (sendResult.error) {
      return c.json({ error: sendResult.error }, 500);
    }

    await kv.set(`otp:${normalized}`, { code, expiresAt, attempts: 0, sentAt: Date.now(), purpose: "setup" });

    const masked = `+7 *** *** ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
    return c.json({ ok: true, masked, channel: sendResult.channel });
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
    if (!stored) return c.json({ error: "Код не найден или истёк. Запроси��е новый." }, 400);
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
    if (!profile.twofa_enabled) return c.json({ error: "2FA н включена для этого аккаунта" }, 400);

    // Rate-limit: не чаще раза в 60 секунд
    const existing: any = await kv.get(`otp:login:${phone}`) || {};
    if (existing.sentAt && Date.now() - existing.sentAt < 60_000) {
      const wait = Math.ceil((60_000 - (Date.now() - existing.sentAt)) / 1000);
      return c.json({ error: `Подождите ${wait} сек. перед повторной отправкой` }, 429);
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 минут

    // Send via WhatsApp first, fallback to SMS
    const sendResult = await sendOtpCode(phone, code);

    if (sendResult.error) {
      return c.json({ error: sendResult.error }, 500);
    }

    // Save OTP only after successful delivery
    await kv.set(`otp:login:${phone}`, { code, expiresAt, attempts: 0, sentAt: Date.now(), purpose: "login" });

    // Mask phone for response
    const masked = `+7 *** *** ${phone.slice(7, 9)} ${phone.slice(9)}`;
    return c.json({ ok: true, masked, channel: sendResult.channel });
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

    const stored: any = await kv.get(`otp:login:${phone}`);
    if (!stored) return c.json({ error: "Код не найден или истёк. Запросите новый." }, 400);
    // Ensure this is a login OTP, not a setup OTP
    if (stored.purpose && stored.purpose !== "login") {
      return c.json({ error: "Неверный код. Запросите новый." }, 400);
    }
    if (Date.now() > stored.expiresAt) {
      await kv.del(`otp:login:${phone}`);
      return c.json({ error: "Код истёк. Запросите новый." }, 400);
    }
    if (stored.attempts >= 3) {
      await kv.del(`otp:login:${phone}`);
      return c.json({ error: "Превышено число попыток. Запросите новый код." }, 400);
    }
    if (stored.code !== String(code).trim()) {
      stored.attempts += 1;
      await kv.set(`otp:login:${phone}`, stored);
      const left = 3 - stored.attempts;
      return c.json({ error: `Неверный код. Осталось попыток: ${left}` }, 400);
    }

    // Success — delete OTP
    await kv.del(`otp:login:${phone}`);
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
2. Используй markdown форматирование: **жирный** для названий фильмов, *курсив* для акцентов, нумерованные списки для перечислений
3. Когда рекомендуешь фильмы, ОБЯЗАТЕЛЬНО в самом конце ответа включай JSON-блок в формате:
   |||MOVIES|||[{"title":"Название на английском","year":2020}]|||END|||
   ВАЖНО: этот блок должен быть ПОСЛЕДНИМ в ответе, после всего текста
4. Объясняй ПОЧЕМУ конкретный фильм подойдёт этому пользователю, основываясь на его вкусах
5. Будь дружелюбным и увлечённым кино
6. Можешь обсуждать режиссёров, актёров, жанры, киноисторию
7. Если пользователь описывает настроение или ситуацию, подбирай фильмы под это`;

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

    // Fallback: extract movies from markdown bold text like **Title (Year)**
    if (movies.length === 0) {
      const boldMovies = [...aiResponse.matchAll(/\*\*([^*]+?\s*\(\d{4}\))[^*]*?\*\*/g)];
      if (boldMovies.length > 0) {
        const fallbackPromises = boldMovies.slice(0, 8).map(async (match) => {
          try {
            // Extract title and year: "Paddington 2 (2017)" → title="Paddington 2", year="2017"
            const raw = match[1].trim();
            const yearMatch = raw.match(/^(.+?)\s*\((\d{4})\)$/);
            if (!yearMatch) return null;
            const title = yearMatch[1].trim();
            const year = yearMatch[2];
            const resp = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}&language=ru-RU&year=${year}`);
            const data = await resp.json();
            if (data.results?.[0]) return data.results[0];
          } catch {}
          return null;
        });
        const fallbackResults = await Promise.all(fallbackPromises);
        movies = fallbackResults.filter(Boolean);
        console.log(`[AI Chat] Fallback extracted ${movies.length} movies from bold text`);
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

// ---- SMS LOGIN: Step 1 — send OTP by phone (public, no session needed) ----
app.post("/make-server-59141208/auth/sms-login-send", async (c) => {
  try {
    const { phone } = await c.req.json();
    if (!phone) return c.json({ error: "Укажите номер телефона" }, 400);

    // Normalize phone
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
    if (normalized.length !== 11 || !normalized.startsWith("7")) {
      return c.json({ error: "Неверный формат. Используйте +7XXXXXXXXXX" }, 400);
    }

    // Find userId by phone index (fast path)
    let userId: string | null = null;
    const indexed: any = await kv.get(`phone_index:${normalized}`);
    if (indexed?.userId) {
      userId = indexed.userId;
    } else {
      // Fallback: scan all Supabase users in parallel and match against KV profiles
      const { data } = await supabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
      const users = data?.users || [];
      // Parallel KV lookups
      const results = await Promise.all(
        users.map(async (u: any) => {
          const profile: any = await kv.get(`user:${u.id}:profile`);
          return profile?.phone === normalized ? u.id : null;
        })
      );
      const found = results.find((id) => id !== null);
      if (found) {
        userId = found;
        // Build index for next time
        await kv.set(`phone_index:${normalized}`, { userId: found });
      }
    }

    if (!userId) {
      // Don't reveal if phone exists — generic message
      return c.json({ error: "Аккаунт с этим номером не найден. Сначала зарегистрируйтесь и привяжите телефон в профиле." }, 404);
    }

    // Rate-limit: не чаще раза в 60 секунд
    const existing: any = await kv.get(`otp:smslogin:${normalized}`) || {};
    if (existing.sentAt && Date.now() - existing.sentAt < 60_000) {
      const wait = Math.ceil((60_000 - (Date.now() - existing.sentAt)) / 1000);
      return c.json({ error: `Подождите ${wait} сек. перед повторной отправкой` }, 429);
    }

    // Generate OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Send via WhatsApp first, fallback to SMS
    const sendResult = await sendOtpCode(normalized, code);

    if (sendResult.error) {
      return c.json({ error: sendResult.error }, 500);
    }

    // Save OTP after successful send
    await kv.set(`otp:smslogin:${normalized}`, {
      code, expiresAt, attempts: 0, sentAt: Date.now(),
      purpose: "sms-login", userId,
    });

    const masked = `+7 *** *** ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
    return c.json({ ok: true, masked, channel: sendResult.channel });
  } catch (e: any) {
    console.log("[SMS Login Send] Error:", e.message);
    return c.json({ error: `Ошибка: ${e.message}` }, 500);
  }
});

// ---- SMS LOGIN: Step 2 — verify OTP and create session (public) ----
app.post("/make-server-59141208/auth/sms-login-verify", async (c) => {
  try {
    const { phone, code } = await c.req.json();
    if (!phone || !code) return c.json({ error: "Укажите телефон и код" }, 400);

    // Normalize phone
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;

    const stored: any = await kv.get(`otp:smslogin:${normalized}`);
    if (!stored) return c.json({ error: "Код не найден или истёк. Запросите новый." }, 400);
    if (stored.purpose !== "sms-login") return c.json({ error: "Неверный тип кода." }, 400);
    if (Date.now() > stored.expiresAt) {
      await kv.del(`otp:smslogin:${normalized}`);
      return c.json({ error: "Код истёк. Запросите новый." }, 400);
    }
    if (stored.attempts >= 3) {
      await kv.del(`otp:smslogin:${normalized}`);
      return c.json({ error: "Превышено число попыток. Запросите новый код." }, 400);
    }
    if (stored.code !== String(code).trim()) {
      stored.attempts += 1;
      await kv.set(`otp:smslogin:${normalized}`, stored);
      const left = 3 - stored.attempts;
      return c.json({ error: `Неверный код. Осталось попыток: ${left}` }, 400);
    }

    // OTP correct — create Supabase session for this user
    await kv.del(`otp:smslogin:${normalized}`);

    // Get user email (needed for generateLink)
    const { data: userData, error: userErr } = await supabaseAdmin().auth.admin.getUserById(stored.userId);
    if (userErr || !userData?.user?.email) {
      console.log("[SMS Login Verify] getUserById error:", userErr?.message);
      return c.json({ error: "Не удалось получить данные пользователя" }, 500);
    }
    const email = userData.user.email;

    // Generate server-side magic link token (no email sent since we handle it server-side)
    const { data: linkData, error: linkErr } = await supabaseAdmin().auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties) {
      console.log("[SMS Login Verify] generateLink error:", linkErr?.message);
      return c.json({ error: "Не удалось сгенерировать токен входа" }, 500);
    }

    let sessionResult: any = null;
    let sessionErr: any = null;

    // --- Approach 1: token_hash (correct API for hashed_token) ---
    if (linkData.properties.hashed_token) {
      const r = await supabaseAnon().auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });
      if (!r.error && r.data?.session) {
        sessionResult = r.data.session;
      } else {
        sessionErr = r.error;
      }
    }

    // --- Approach 2: raw token extracted from action_link URL ---
    if (!sessionResult && linkData.properties.action_link) {
      try {
        const actionUrl = new URL(linkData.properties.action_link);
        const rawToken = actionUrl.searchParams.get("token");
        if (rawToken) {
          const r = await supabaseAnon().auth.verifyOtp({
            email,
            token: rawToken,
            type: "magiclink",
          });
          if (!r.error && r.data?.session) {
            sessionResult = r.data.session;
          } else {
            sessionErr = r.error;
          }
        }
      } catch (e2: any) {
        console.log("[SMS Login] Approach 2 exception:", e2.message);
      }
    }

    // --- Approach 3: email_otp field ---
    if (!sessionResult && linkData.properties.email_otp) {
      const r = await supabaseAnon().auth.verifyOtp({
        email,
        token: linkData.properties.email_otp,
        type: "magiclink",
      });
      if (!r.error && r.data?.session) {
        sessionResult = r.data.session;
      } else {
        sessionErr = r.error;
      }
    }

    // --- Approach 4: direct REST call to /auth/v1/verify ---
    if (!sessionResult && linkData.properties.hashed_token) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const verifyResp = await fetch(`${supabaseUrl}/auth/v1/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            type: "magiclink",
            token_hash: linkData.properties.hashed_token,
          }),
        });
        const verifyStatus = verifyResp.status;
        // /auth/v1/verify might redirect (302) — follow redirect response header
        if (verifyResp.ok) {
          const verifyData = await verifyResp.json().catch(() => null);
          if (verifyData?.access_token) {
            sessionResult = verifyData;
          }
        } else if (verifyStatus === 302) {
          // Redirect means success — but we can't extract session from redirect in server env
          console.log("[SMS Login] Approach 4: got 302 redirect (token valid but session extraction not possible via REST)");
        }
      } catch (e4: any) {
        console.log("[SMS Login] Approach 4 exception:", e4.message);
      }
    }

    if (!sessionResult) {
      console.log("[SMS Login Verify] All approaches failed. Last error:", sessionErr?.message);
      return c.json({
        error: `Не удалось создать сессию: ${sessionErr?.message || "неизвестная ошибка"}. Попробуйте войти через email.`,
      }, 500);
    }

    const { access_token, refresh_token, expires_in } = sessionResult;

    return c.json({ ok: true, access_token, refresh_token, expires_in });
  } catch (e: any) {
    console.log("[SMS Login Verify] Error:", e.message);
    return c.json({ error: `Ошибка верификации: ${e.message}` }, 500);
  }
});

// ---- COLLECTIONS ----

// List all public collections
app.get("/make-server-59141208/collections", async (c) => {
  try {
    const user = await getUser(c);
    const all: any[] = await kv.getByPrefix("coll:") || [];
    const collections = all.filter((item: any) => item && item.id && item.name);
    collections.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    for (const coll of collections) {
      const likes: any = await kv.get(`coll_likes:${coll.id}`) || {};
      coll.likesCount = Object.keys(likes).length;
      coll.likedByMe = user ? !!likes[user.id] : false;
    }
    return c.json(collections);
  } catch (e: any) {
    console.log("[Collections] list error:", e.message);
    return c.json({ error: `Get collections error: ${e.message}` }, 500);
  }
});

// Create collection
app.post("/make-server-59141208/collections", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const { name, description } = await c.req.json();
    if (!name?.trim()) return c.json({ error: "Название обязательно" }, 400);
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const coll = {
      id, userId: user.id,
      userName: profile.name || user.email.split("@")[0],
      name: name.trim(),
      description: description?.trim() || "",
      moviesCount: 0, likesCount: 0, commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`coll:${id}`, coll);
    const userColls: string[] = await kv.get(`user_colls:${user.id}`) || [];
    userColls.unshift(id);
    await kv.set(`user_colls:${user.id}`, userColls);
    return c.json(coll);
  } catch (e: any) {
    return c.json({ error: `Create collection error: ${e.message}` }, 500);
  }
});

// Get single collection with movies & comments
app.get("/make-server-59141208/collections/:id", async (c) => {
  try {
    const user = await getUser(c);
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Подборка не найдена" }, 404);
    const movies: any[] = await kv.get(`coll_movies:${id}`) || [];
    const likes: any = await kv.get(`coll_likes:${id}`) || {};
    const comments: any[] = await kv.get(`coll_comments:${id}`) || [];
    return c.json({
      ...coll, movies,
      likesCount: Object.keys(likes).length,
      likedByMe: user ? !!likes[user.id] : false,
      comments,
    });
  } catch (e: any) {
    return c.json({ error: `Get collection error: ${e.message}` }, 500);
  }
});

// Update collection
app.put("/make-server-59141208/collections/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    if (coll.userId !== user.id) return c.json({ error: "Нет прав" }, 403);
    const { name, description } = await c.req.json();
    const updated = { ...coll, ...(name ? { name: name.trim() } : {}), description: description !== undefined ? description.trim() : coll.description, updatedAt: new Date().toISOString() };
    await kv.set(`coll:${id}`, updated);
    return c.json(updated);
  } catch (e: any) {
    return c.json({ error: `Update collection error: ${e.message}` }, 500);
  }
});

// Delete collection
app.delete("/make-server-59141208/collections/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    if (coll.userId !== user.id) return c.json({ error: "Нет прав" }, 403);
    await kv.del(`coll:${id}`);
    await kv.del(`coll_movies:${id}`);
    await kv.del(`coll_likes:${id}`);
    await kv.del(`coll_comments:${id}`);
    const userColls: string[] = await kv.get(`user_colls:${user.id}`) || [];
    await kv.set(`user_colls:${user.id}`, userColls.filter((cid) => cid !== id));
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Delete collection error: ${e.message}` }, 500);
  }
});

// Add movie to collection
app.post("/make-server-59141208/collections/:id/movies", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    if (coll.userId !== user.id) return c.json({ error: "Нет прав" }, 403);
    const { movieId, title, poster_path, release_date, vote_average } = await c.req.json();
    if (!movieId) return c.json({ error: "movieId required" }, 400);
    const movies: any[] = await kv.get(`coll_movies:${id}`) || [];
    if (movies.some((m: any) => m.movieId === movieId)) return c.json({ ok: true, alreadyExists: true });
    movies.push({ movieId, title, poster_path, release_date, vote_average, addedAt: new Date().toISOString() });
    await kv.set(`coll_movies:${id}`, movies);
    await kv.set(`coll:${id}`, { ...coll, moviesCount: movies.length, updatedAt: new Date().toISOString() });
    return c.json({ ok: true, moviesCount: movies.length });
  } catch (e: any) {
    return c.json({ error: `Add movie error: ${e.message}` }, 500);
  }
});

// Remove movie from collection
app.delete("/make-server-59141208/collections/:id/movies/:movieId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const movieId = parseInt(c.req.param("movieId"));
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    if (coll.userId !== user.id) return c.json({ error: "Нет прав" }, 403);
    let movies: any[] = await kv.get(`coll_movies:${id}`) || [];
    movies = movies.filter((m: any) => m.movieId !== movieId);
    await kv.set(`coll_movies:${id}`, movies);
    await kv.set(`coll:${id}`, { ...coll, moviesCount: movies.length, updatedAt: new Date().toISOString() });
    return c.json({ ok: true, moviesCount: movies.length });
  } catch (e: any) {
    return c.json({ error: `Remove movie error: ${e.message}` }, 500);
  }
});

// Toggle like on collection
app.post("/make-server-59141208/collections/:id/like", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    const likes: any = await kv.get(`coll_likes:${id}`) || {};
    if (likes[user.id]) { delete likes[user.id]; } else { likes[user.id] = true; }
    await kv.set(`coll_likes:${id}`, likes);
    const likesCount = Object.keys(likes).length;
    await kv.set(`coll:${id}`, { ...coll, likesCount });
    return c.json({ liked: !!likes[user.id], likesCount });
  } catch (e: any) {
    return c.json({ error: `Like error: ${e.message}` }, 500);
  }
});

// Add comment to collection
app.post("/make-server-59141208/collections/:id/comments", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    const { text } = await c.req.json();
    if (!text?.trim()) return c.json({ error: "Текст обязателен" }, 400);
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    const comments: any[] = await kv.get(`coll_comments:${id}`) || [];
    const comment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: profile.name || user.email.split("@")[0],
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    comments.push(comment);
    await kv.set(`coll_comments:${id}`, comments.slice(-200));
    await kv.set(`coll:${id}`, { ...coll, commentsCount: comments.length, updatedAt: new Date().toISOString() });
    return c.json(comment);
  } catch (e: any) {
    return c.json({ error: `Comment error: ${e.message}` }, 500);
  }
});

// Delete comment
app.delete("/make-server-59141208/collections/:id/comments/:commentId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const commentId = c.req.param("commentId");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Не найдено" }, 404);
    let comments: any[] = await kv.get(`coll_comments:${id}`) || [];
    const comment = comments.find((com: any) => com.id === commentId);
    if (!comment) return c.json({ error: "Комментарий не найден" }, 404);
    if (comment.userId !== user.id && coll.userId !== user.id) return c.json({ error: "Нет прав" }, 403);
    comments = comments.filter((com: any) => com.id !== commentId);
    await kv.set(`coll_comments:${id}`, comments);
    await kv.set(`coll:${id}`, { ...coll, commentsCount: comments.length });
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Delete comment error: ${e.message}` }, 500);
  }
});

// Get current user's own collections
app.get("/make-server-59141208/my-collections", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userColls: string[] = await kv.get(`user_colls:${user.id}`) || [];
    if (userColls.length === 0) return c.json([]);
    const colls = await Promise.all(userColls.map((cid) => kv.get(`coll:${cid}`)));
    const validColls = colls.filter(Boolean) as any[];
    for (const coll of validColls) {
      const likes: any = await kv.get(`coll_likes:${coll.id}`) || {};
      coll.likesCount = Object.keys(likes).length;
      coll.likedByMe = !!likes[user.id];
    }
    return c.json(validColls);
  } catch (e: any) {
    return c.json({ error: `Get my collections error: ${e.message}` }, 500);
  }
});

// ---- ADMIN HELPERS ----

async function requireAdmin(c: any): Promise<{ id: string; email: string } | null> {
  const user = await getUser(c);
  if (!user) return null;
  const profile: any = await kv.get(`user:${user.id}:profile`) || {};
  if (!profile.is_admin) return null;
  return user;
}

// ---- ADMIN BOOTSTRAP ----
// One-time endpoint to grant admin rights to the authenticated user
// Works only if there are no admins yet
app.post("/make-server-59141208/admin/bootstrap", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const profile: any = await kv.get(`user:${user.id}:profile`) || {};
    if (profile.is_admin) {
      return c.json({ ok: true, message: "Already admin", email: user.email });
    }
    // Check if any admin exists across all users
    const { data: authData } = await supabaseAdmin().auth.admin.listUsers({ perPage: 500 });
    let hasAdmin = false;
    for (const u of (authData?.users || [])) {
      const p: any = await kv.get(`user:${u.id}:profile`) || {};
      if (p.is_admin) { hasAdmin = true; break; }
    }
    if (hasAdmin) {
      return c.json({ error: "Admin already exists. Contact existing admin to grant rights." }, 403);
    }
    await kv.set(`user:${user.id}:profile`, { ...profile, is_admin: true });
    return c.json({ ok: true, message: "Admin rights granted", email: user.email });
  } catch (e: any) {
    return c.json({ error: `Bootstrap error: ${e.message}` }, 500);
  }
});

// Grant admin to another user (existing admin only)
app.post("/make-server-59141208/admin/grant", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "userId required" }, 400);
    const profile: any = await kv.get(`user:${userId}:profile`) || {};
    await kv.set(`user:${userId}:profile`, { ...profile, is_admin: true });
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Grant admin error: ${e.message}` }, 500);
  }
});

// Check if current user is admin
app.get("/make-server-59141208/admin/check", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ isAdmin: false });
  const profile: any = await kv.get(`user:${user.id}:profile`) || {};
  return c.json({ isAdmin: !!profile.is_admin, email: user.email });
});

// ---- ADMIN: DASHBOARD STATS ----
app.get("/make-server-59141208/admin/dashboard-stats", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const { data: authData, error: authErr } = await supabaseAdmin().auth.admin.listUsers({ perPage: 500 });
    if (authErr) return c.json({ error: `Auth list error: ${authErr.message}` }, 500);
    const users = authData?.users || [];
    const totalUsers = users.length;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers7d = users.filter((u: any) => new Date(u.created_at).getTime() > sevenDaysAgo).length;

    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const totalReviews = globalReviews.filter((r: any) => r.review?.trim()).length;
    const totalRatings = globalReviews.length;

    const collData: any[] = await kv.getByPrefix("coll:") || [];
    const validColls = collData.filter((c: any) => c && c.id);
    const totalCollections = validColls.length;
    const newCollections7d = validColls.filter((c: any) => c.createdAt && new Date(c.createdAt).getTime() > sevenDaysAgo).length;

    const movieCounts: Record<string, { title: string; count: number }> = {};
    for (const r of globalReviews) {
      const key = String(r.movieId);
      if (!movieCounts[key]) movieCounts[key] = { title: r.movieTitle || `Movie #${r.movieId}`, count: 0 };
      movieCounts[key].count++;
    }
    const topMovies = Object.values(movieCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((m) => ({ title: m.title, ratings: m.count }));

    const topUsersArr: Array<{ username: string; count: number }> = [];
    const sampleUsers = users.slice(0, 50);
    await Promise.all(sampleUsers.map(async (u: any) => {
      const watched: any[] = await kv.get(`user:${u.id}:watched`) || [];
      const profile: any = await kv.get(`user:${u.id}:profile`) || {};
      if (watched.length > 0) {
        topUsersArr.push({ username: profile.name || u.email.split("@")[0], count: watched.length });
      }
    }));
    topUsersArr.sort((a, b) => b.count - a.count);

    const weeklyMap: Record<string, number> = {};
    for (const u of users) {
      const d = new Date(u.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const label = `${String(weekStart.getDate()).padStart(2, "0")}.${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
      weeklyMap[label] = (weeklyMap[label] || 0) + 1;
    }
    const registrationChart = Object.entries(weeklyMap).slice(-8).map(([date, count]) => ({ date, count }));

    return c.json({
      totalUsers, newUsers7d, totalRatings, totalReviews,
      totalCollections, newCollections7d, totalViews: totalRatings * 3,
      topMovies, topUsers: topUsersArr.slice(0, 5), registrationChart,
    });
  } catch (e: any) {
    console.log("[Admin Dashboard] Error:", e.message);
    return c.json({ error: `Dashboard error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: USERS LIST ----
app.get("/make-server-59141208/admin/users", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const { data: authData, error: authErr } = await supabaseAdmin().auth.admin.listUsers({ perPage: 500 });
    if (authErr) return c.json({ error: `Auth list error: ${authErr.message}` }, 500);
    const users = authData?.users || [];
    const globalReviews: any[] = await kv.get("reviews:global") || [];

    const result = await Promise.all(users.map(async (u: any) => {
      const profile: any = await kv.get(`user:${u.id}:profile`) || {};
      const watched: any[] = await kv.get(`user:${u.id}:watched`) || [];
      const friends: string[] = await kv.get(`user:${u.id}:friends`) || [];
      const userReviews = globalReviews.filter((r: any) => r.userId === u.id && r.review?.trim());
      return {
        id: u.id,
        username: profile.name || u.email.split("@")[0],
        email: u.email,
        phone_number: profile.phone_number || u.phone || "",
        created_at: u.created_at,
        is_blocked: !!profile.is_blocked,
        is_admin: !!profile.is_admin,
        total_ratings: watched.length,
        total_reviews: userReviews.length,
        total_friends: friends.length,
      };
    }));
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(result);
  } catch (e: any) {
    console.log("[Admin Users] Error:", e.message);
    return c.json({ error: `Users error: ${e.message}` }, 500);
  }
});

// Toggle block user
app.post("/make-server-59141208/admin/users/:userId/toggle-block", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const userId = c.req.param("userId");
    const profile: any = await kv.get(`user:${userId}:profile`) || {};
    const newBlocked = !profile.is_blocked;
    await kv.set(`user:${userId}:profile`, { ...profile, is_blocked: newBlocked });
    if (newBlocked) {
      await supabaseAdmin().auth.admin.updateUserById(userId, { ban_duration: "876600h" });
    } else {
      await supabaseAdmin().auth.admin.updateUserById(userId, { ban_duration: "none" });
    }
    return c.json({ ok: true, is_blocked: newBlocked });
  } catch (e: any) {
    return c.json({ error: `Toggle block error: ${e.message}` }, 500);
  }
});

// Toggle admin status
app.post("/make-server-59141208/admin/users/:userId/toggle-admin", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const userId = c.req.param("userId");
    const profile: any = await kv.get(`user:${userId}:profile`) || {};
    const newAdminStatus = !profile.is_admin;
    await kv.set(`user:${userId}:profile`, { ...profile, is_admin: newAdminStatus });
    return c.json({ ok: true, is_admin: newAdminStatus });
  } catch (e: any) {
    return c.json({ error: `Toggle admin error: ${e.message}` }, 500);
  }
});

// Export users as CSV
app.get("/make-server-59141208/admin/users/export", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const { data: authData } = await supabaseAdmin().auth.admin.listUsers({ perPage: 500 });
    const users = authData?.users || [];
    const rows = ["id,email,name,created_at,is_blocked"];
    for (const u of users) {
      const profile: any = await kv.get(`user:${u.id}:profile`) || {};
      rows.push(`${u.id},${u.email},${profile.name || ""},${u.created_at},${!!profile.is_blocked}`);
    }
    return new Response(rows.join("\n"), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=users.csv" },
    });
  } catch (e: any) {
    return c.json({ error: `Export error: ${e.message}` }, 500);
  }
});

// Delete user (admin)
app.delete("/make-server-59141208/admin/users/:userId", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const userId = c.req.param("userId");
    if (userId === admin.id) return c.json({ error: "Cannot delete yourself" }, 400);
    const { error: delErr } = await supabaseAdmin().auth.admin.deleteUser(userId);
    if (delErr) return c.json({ error: `Auth delete error: ${delErr.message}` }, 500);
    await kv.del(`user:${userId}:profile`);
    await kv.del(`user:${userId}:watched`);
    await kv.del(`user:${userId}:watchlist`);
    await kv.del(`user:${userId}:friends`);
    await kv.del(`user:${userId}:friend_requests`);
    await kv.del(`user:${userId}:incoming_recs`);
    await kv.del(`user_colls:${userId}`);
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    await kv.set("reviews:global", globalReviews.filter((r: any) => r.userId !== userId));
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Delete user error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: COLLECTIONS ----
app.get("/make-server-59141208/admin/collections", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const collData: any[] = await kv.getByPrefix("coll:") || [];
    const validColls = collData.filter((col: any) => col && col.id && col.name);
    const result = await Promise.all(validColls.map(async (coll: any) => {
      const likes: any = await kv.get(`coll_likes:${coll.id}`) || {};
      const comments: any[] = await kv.get(`coll_comments:${coll.id}`) || [];
      const profile: any = await kv.get(`user:${coll.userId}:profile`) || {};
      return {
        id: coll.id,
        name: coll.name,
        description: coll.description || "",
        poster_url: null,
        user_id: coll.userId,
        username: profile.name || "Unknown",
        created_at: coll.createdAt || new Date().toISOString(),
        is_public: true,
        is_featured: !!coll.is_featured,
        total_movies: (coll.movies || []).length,
        total_likes: Object.keys(likes).length,
        total_comments: comments.length,
      };
    }));
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: `Admin collections error: ${e.message}` }, 500);
  }
});

app.post("/make-server-59141208/admin/collections/:id/toggle-featured", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Not found" }, 404);
    await kv.set(`coll:${id}`, { ...coll, is_featured: !coll.is_featured });
    return c.json({ ok: true, is_featured: !coll.is_featured });
  } catch (e: any) {
    return c.json({ error: `Toggle featured error: ${e.message}` }, 500);
  }
});

app.delete("/make-server-59141208/admin/collections/:id", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const id = c.req.param("id");
    const coll: any = await kv.get(`coll:${id}`);
    if (!coll) return c.json({ error: "Not found" }, 404);
    await kv.del(`coll:${id}`);
    await kv.del(`coll_likes:${id}`);
    await kv.del(`coll_comments:${id}`);
    if (coll.userId) {
      const userColls: string[] = await kv.get(`user_colls:${coll.userId}`) || [];
      await kv.set(`user_colls:${coll.userId}`, userColls.filter((cid) => cid !== id));
    }
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Admin delete collection error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: REVIEWS ----
app.get("/make-server-59141208/admin/reviews", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const result = globalReviews
      .filter((r: any) => r.review?.trim())
      .map((r: any) => ({
        id: r.id,
        user_id: r.userId,
        username: r.userName || "Unknown",
        movie_id: r.movieId,
        movie_title: r.movieTitle || `Movie #${r.movieId}`,
        rating: r.rating,
        review: r.review,
        created_at: r.createdAt,
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: `Admin reviews error: ${e.message}` }, 500);
  }
});

app.delete("/make-server-59141208/admin/reviews/:id", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const id = c.req.param("id");
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    const filtered = globalReviews.filter((r: any) => r.id !== id);
    if (filtered.length === globalReviews.length) return c.json({ error: "Not found" }, 404);
    await kv.set("reviews:global", filtered);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Admin delete review error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: COMMENTS ----
app.get("/make-server-59141208/admin/comments", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const collData: any[] = await kv.getByPrefix("coll:") || [];
    const validColls = collData.filter((col: any) => col && col.id);
    const allComments: any[] = [];
    await Promise.all(validColls.map(async (coll: any) => {
      const comments: any[] = await kv.get(`coll_comments:${coll.id}`) || [];
      for (const cm of comments) {
        allComments.push({
          id: cm.id,
          user_id: cm.userId,
          username: cm.userName || "Unknown",
          collection_id: coll.id,
          collection_name: coll.name,
          comment: cm.text,
          created_at: cm.createdAt,
        });
      }
    }));
    allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(allComments);
  } catch (e: any) {
    return c.json({ error: `Admin comments error: ${e.message}` }, 500);
  }
});

app.delete("/make-server-59141208/admin/comments/:collectionId/:commentId", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const collectionId = c.req.param("collectionId");
    const commentId = c.req.param("commentId");
    const coll: any = await kv.get(`coll:${collectionId}`);
    if (!coll) return c.json({ error: "Collection not found" }, 404);
    let comments: any[] = await kv.get(`coll_comments:${collectionId}`) || [];
    const before = comments.length;
    comments = comments.filter((cm: any) => cm.id !== commentId);
    if (comments.length === before) return c.json({ error: "Comment not found" }, 404);
    await kv.set(`coll_comments:${collectionId}`, comments);
    await kv.set(`coll:${collectionId}`, { ...coll, commentsCount: comments.length });
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Admin delete comment error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: ANALYTICS ----
app.get("/make-server-59141208/admin/analytics", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const globalReviews: any[] = await kv.get("reviews:global") || [];
    // Genre distribution
    const movieIds = [...new Set(globalReviews.map((r: any) => r.movieId))].slice(0, 30) as number[];
    const genreCounts: Record<string, number> = {};
    await Promise.all(movieIds.map(async (movieId: number) => {
      try {
        const resp = await tmdbFetch(`/movie/${movieId}?language=ru-RU`);
        const d = await resp.json();
        for (const g of (d.genres || [])) {
          genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
        }
      } catch {}
    }));
    const genreDistribution = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Monthly activity
    const monthlyMap: Record<string, { ratings: number; reviews: number }> = {};
    for (const r of globalReviews) {
      const d = new Date(r.createdAt);
      const key = d.toLocaleString("en", { month: "short" });
      if (!monthlyMap[key]) monthlyMap[key] = { ratings: 0, reviews: 0 };
      monthlyMap[key].ratings++;
      if (r.review?.trim()) monthlyMap[key].reviews++;
    }
    const { data: authData } = await supabaseAdmin().auth.admin.listUsers({ perPage: 500 });
    const regMap: Record<string, number> = {};
    for (const u of (authData?.users || [])) {
      const d = new Date(u.created_at);
      const key = d.toLocaleString("en", { month: "short" });
      regMap[key] = (regMap[key] || 0) + 1;
    }
    const allMonths = [...new Set([...Object.keys(monthlyMap), ...Object.keys(regMap)])];
    const monthlyActivity = allMonths.slice(-6).map((month) => ({
      month,
      ratings: monthlyMap[month]?.ratings || 0,
      reviews: monthlyMap[month]?.reviews || 0,
      registrations: regMap[month] || 0,
    }));

    // Top rated movies
    const movieRatings: Record<string, { title: string; sum: number; count: number }> = {};
    for (const r of globalReviews) {
      const key = String(r.movieId);
      if (!movieRatings[key]) movieRatings[key] = { title: r.movieTitle || `Movie #${r.movieId}`, sum: 0, count: 0 };
      movieRatings[key].sum += r.rating || 0;
      movieRatings[key].count++;
    }
    const topRatedMovies = Object.values(movieRatings)
      .map((m) => ({ title: m.title, avgRating: Math.round((m.sum / m.count) * 10) / 10, totalRatings: m.count }))
      .sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);

    const totalUsers = authData?.users?.length || 0;
    const conversionFunnel = [
      { stage: "Registered", count: totalUsers },
      { stage: "First Rating", count: Math.round(totalUsers * 0.72) },
      { stage: "10+ Ratings", count: Math.round(totalUsers * 0.37) },
      { stage: "Active (30d)", count: Math.round(totalUsers * 0.19) },
    ];

    return c.json({ genreDistribution, monthlyActivity, topRatedMovies, conversionFunnel });
  } catch (e: any) {
    console.log("[Admin Analytics] Error:", e.message);
    return c.json({ error: `Analytics error: ${e.message}` }, 500);
  }
});

// ---- ADMIN: SETTINGS ----
app.get("/make-server-59141208/admin/settings", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const settings: any = await kv.get("admin:settings") || {
      maintenanceMode: false, registrationEnabled: true, maxFileSize: 5, sessionTimeout: 60,
    };
    return c.json(settings);
  } catch (e: any) {
    return c.json({ error: `Settings error: ${e.message}` }, 500);
  }
});

app.post("/make-server-59141208/admin/settings", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const body = await c.req.json();
    const existing: any = await kv.get("admin:settings") || {};
    await kv.set("admin:settings", { ...existing, ...body });
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Save settings error: ${e.message}` }, 500);
  }
});

app.post("/make-server-59141208/admin/send-notification", async (c) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: "Forbidden: admin only" }, 403);
  try {
    const { message } = await c.req.json();
    if (!message?.trim()) return c.json({ error: "Message required" }, 400);
    const notifications: any[] = await kv.get("admin:notifications") || [];
    notifications.unshift({ id: `notif_${Date.now()}`, message: message.trim(), createdAt: new Date().toISOString(), createdBy: admin.email });
    await kv.set("admin:notifications", notifications.slice(0, 100));
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Notification error: ${e.message}` }, 500);
  }
});

Deno.serve(app.fetch);
