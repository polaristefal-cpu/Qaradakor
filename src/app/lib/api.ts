import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getTmdbLang } from "./tmdb-lang";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-59141208`;

export const TMDB_IMG = "https://image.tmdb.org/t/p";
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

async function getToken(): Promise<string> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      return publicAnonKey;
    }
    
    const token = data.session.access_token;
    // Decode and check expiry with 60s buffer
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now() + 60_000) {
        // Token expired or about to expire — refresh
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed?.session?.access_token) {
          // Don't sign out here — just return anonKey and let the caller handle it
          return publicAnonKey;
        }
        return refreshed.session.access_token;
      }
    } catch {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session?.access_token) return refreshed.session.access_token;
      return publicAnonKey;
    }
    
    return token;
  } catch {
    return publicAnonKey;
  }
}

async function request(path: string, options: RequestInit = {}) {
  // For public routes (TMDB proxy, signup), no session token needed
  const isPublicRoute = path.startsWith("/tmdb/") || path === "/signup" ||
    path === "/auth/sms-login-send" || path === "/auth/sms-login-verify";
  const sessionToken = isPublicRoute ? null : await getToken();
  const hasSession = sessionToken && sessionToken !== publicAnonKey;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Always send anonKey for Supabase gateway auth
    Authorization: `Bearer ${publicAnonKey}`,
  };
  // Pass user session token in a custom header so gateway doesn't reject it
  if (hasSession) {
    headers["x-user-token"] = sessionToken;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  // If 401 and we had a session, try refreshing and retry once
  if (res.status === 401 && hasSession) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session?.access_token) {
      const retryRes = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
          ...headers,
          "x-user-token": refreshed.session.access_token,
          ...(options.headers as Record<string, string>),
        },
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        console.error(`API error ${path} after retry:`, retryData);
        throw new Error(retryData.error || "Request failed");
      }
      return retryData;
    } else {
      throw new Error("Session expired");
    }
  }

  // Read body ONCE as text, then try to parse as JSON
  let data: any;
  const rawText = await res.text().catch(() => "");

  try {
    data = JSON.parse(rawText);
  } catch {
    // Hono returns plain-text "404 Not Found" when a route isn't registered
    // This typically means the Edge Function is deployed with an older version
    console.error(`API non-JSON response ${path}: status=${res.status} body="${rawText}"`);
    if (res.status === 404) {
      throw new Error(
        "Маршрут не найден (404). Edge Function устарела — задеплойте свежую ерсию командой: supabase functions deploy make-server-59141208"
      );
    }
    if (res.status >= 500) throw new Error("Ошибка сервера. Попробуйте повторить запрос через несколько секунд.");
    throw new Error(`Неожиданный ответ сервера (${res.status}). Попробуйте позже.`);
  }

  if (!res.ok) {
    console.error(`API error ${path}:`, data);
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// Auth
export async function signup(email: string, password: string, name: string) {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getProfile() {
  return request("/profile");
}

export async function updateProfile(data: { name?: string; bio?: string; favoriteGenres?: string[] }) {
  return request("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Avatar
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const sessionToken = await getToken();
  const hasSession = sessionToken && sessionToken !== publicAnonKey;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };
  if (hasSession) headers["x-user-token"] = sessionToken;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${BASE}/profile/avatar`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data;
}

export async function getAvatarUrl(): Promise<string | null> {
  try {
    const data = await request("/profile/avatar");
    return data.url || null;
  } catch {
    return null;
  }
}

// 2FA / Phone
export async function savePhone(phone: string, enable2fa: boolean) {
  return request("/profile/phone", {
    method: "POST",
    body: JSON.stringify({ phone, enable2fa }),
  });
}

export async function get2FAStatus() {
  return request("/auth/2fa-status");
}

// 2FA Setup: step 1 — verify password + send OTP to new phone
export async function setup2FASend(phone: string, password: string) {
  return request("/auth/2fa-setup-send", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

// 2FA Setup: step 2 — confirm OTP and enable 2FA
export async function setup2FAConfirm(code: string) {
  return request("/auth/2fa-setup-confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// Disable 2FA — requires password confirmation
export async function disable2FA(password: string) {
  return request("/auth/2fa-disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function sendOtp() {
  return request("/auth/send-otp", { method: "POST" });
}

export async function verifyOtp(code: string) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// SMS Login (passwordless)
export async function smsLoginSend(phone: string) {
  return request("/auth/sms-login-send", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function smsLoginVerify(phone: string, code: string): Promise<{
  ok: boolean; access_token: string; refresh_token: string; expires_in: number;
}> {
  return request("/auth/sms-login-verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}
// TMDB
export async function searchMovies(query: string, page = 1) {
  return request(`/tmdb/search/movie?query=${encodeURIComponent(query)}&language=${getTmdbLang()}&page=${page}`);
}

export async function getMovie(id: number) {
  return request(`/tmdb/movie/${id}?language=${getTmdbLang()}&append_to_response=credits`);
}

export async function getMovieBasic(id: number) {
  return request(`/tmdb/movie/${id}?language=${getTmdbLang()}`);
}

export async function getMovieVideos(id: number) {
  // Fetch English videos first (most trailers are in English)
  const data = await request(`/tmdb/movie/${id}/videos?language=en-US`);
  // If no results, fallback to all languages
  if (!data?.results?.length) {
    return request(`/tmdb/movie/${id}/videos`);
  }
  return data;
}

export async function getTrending() {
  return request(`/tmdb/trending/movie/week?language=${getTmdbLang()}`);
}

export async function getPopular(page = 1) {
  return request(`/tmdb/movie/popular?language=${getTmdbLang()}&page=${page}`);
}

export async function getTopRated(page = 1) {
  return request(`/tmdb/movie/top_rated?language=${getTmdbLang()}&page=${page}`);
}

export async function getUpcoming(page = 1) {
  return request(`/tmdb/movie/upcoming?language=${getTmdbLang()}&page=${page}`);
}

export async function getNowPlaying(page = 1) {
  return request(`/tmdb/movie/now_playing?language=${getTmdbLang()}&page=${page}`);
}

export async function getRandomMovieCandidates(page = 1, sortBy = "popularity.desc") {
  const maxReleaseYear = new Date().getFullYear() - 1;
  const params = new URLSearchParams({
    language: getTmdbLang(),
    sort_by: sortBy,
    include_adult: "false",
    include_video: "false",
    "primary_release_date.gte": "1970-01-01",
    "primary_release_date.lte": `${maxReleaseYear}-12-31`,
    "vote_average.gte": "6.4",
    "vote_count.gte": "250",
    page: String(page),
  });
  return request(`/tmdb/discover/movie?${params.toString()}`);
}

export async function getGenres() {
  return request(`/tmdb/genre/movie/list?language=${getTmdbLang()}`);
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  return request(`/tmdb/discover/movie?with_genres=${genreId}&language=${getTmdbLang()}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`);
}

// Watched
export async function getWatched() {
  return request("/watched");
}

export async function addWatched(
  movieId: number,
  rating: number,
  review?: string,
  movieTitle?: string,
  posterPath?: string | null,
  mediaType: "movie" | "tv" = "movie"
) {
  return request("/watched", {
    method: "POST",
    body: JSON.stringify({ movieId, rating, review, movieTitle, posterPath, mediaType }),
  });
}

export async function removeWatched(movieId: number, mediaType: "movie" | "tv" = "movie") {
  return request(`/watched/${movieId}?type=${mediaType}`, { method: "DELETE" });
}

// Watchlist
export async function getWatchlist() {
  return request("/watchlist");
}

export async function addToWatchlist(movie: {
  movieId: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  mediaType?: "movie" | "tv";
}) {
  return request("/watchlist", {
    method: "POST",
    body: JSON.stringify(movie),
  });
}

export async function removeFromWatchlist(movieId: number, mediaType: "movie" | "tv" = "movie") {
  return request(`/watchlist/${movieId}?type=${mediaType}`, { method: "DELETE" });
}

// Recommendations
export async function getRecommendations(params?: {
  exclude?: number[];
  page?: number;
  seed?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.exclude?.length) {
    queryParams.append("exclude", params.exclude.join(","));
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.seed) {
    queryParams.append("seed", params.seed.toString());
  }
  const query = queryParams.toString();
  return request(`/recommendations${query ? `?${query}` : ""}`);
}

// Friends
export async function getFriends() {
  return request("/friends");
}

export async function sendFriendRequest(targetEmail: string) {
  return request("/friends/request", {
    method: "POST",
    body: JSON.stringify({ targetEmail }),
  });
}

export async function getFriendRequests() {
  return request("/friends/requests");
}

export async function acceptFriend(fromId: string) {
  return request("/friends/accept", {
    method: "POST",
    body: JSON.stringify({ fromId }),
  });
}

export async function rejectFriend(fromId: string) {
  return request("/friends/reject", {
    method: "POST",
    body: JSON.stringify({ fromId }),
  });
}

export async function removeFriend(friendId: string) {
  return request(`/friends/${friendId}`, { method: "DELETE" });
}

export async function getFriendWatched(friendId: string) {
  return request(`/friends/${friendId}/watched`);
}

export async function getFriendRecommendations() {
  return request("/friends/recommendations");
}

export async function markRecommendationSeen(id: string) {
  return request(`/friends/recommendations/${id}/seen`, { method: "POST" });
}

// Friend profile & recommendations
export async function getFriendProfile(friendId: string) {
  return request(`/friends/${friendId}/profile`);
}

export async function getFriendAvatarUrl(friendId: string): Promise<string | null> {
  try {
    const data = await request(`/friends/${friendId}/avatar`);
    return data.url || null;
  } catch {
    return null;
  }
}

export async function sendRecommendation(friendId: string, movieId: number, note?: string) {
  try {
    return await request("/friends/recommend", {
      method: "POST",
      body: JSON.stringify({ friendId, movieId, note }),
    });
  } catch (e: any) {
    // If route not yet deployed, throw a user-friendly message
    if (e.message?.includes("404") || e.message?.includes("Маршрут не найден")) {
      throw new Error("Маршрут рекмедаций ещё не задеплоен. Выполните: supabase functions deploy make-server-59141208");
    }
    throw e;
  }
}

// ---- COLLECTIONS ----
export async function getCollections(): Promise<any[]> {
  return request("/collections");
}

export async function getMyCollections(): Promise<any[]> {
  return request("/my-collections");
}

export async function createCollection(name: string, description?: string) {
  return request("/collections", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function updateCollection(id: string, data: { name?: string; description?: string }) {
  return request(`/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: string) {
  return request(`/collections/${id}`, { method: "DELETE" });
}

export async function getCollection(id: string) {
  return request(`/collections/${id}`);
}

export async function addMovieToCollection(collectionId: string, movie: {
  movieId: number; title: string; poster_path: string | null; release_date: string; vote_average: number;
}) {
  return request(`/collections/${collectionId}/movies`, {
    method: "POST",
    body: JSON.stringify(movie),
  });
}

export async function removeMovieFromCollection(collectionId: string, movieId: number) {
  return request(`/collections/${collectionId}/movies/${movieId}`, { method: "DELETE" });
}

export async function toggleCollectionLike(collectionId: string) {
  return request(`/collections/${collectionId}/like`, { method: "POST" });
}

export async function addCollectionComment(collectionId: string, text: string) {
  return request(`/collections/${collectionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteCollectionComment(collectionId: string, commentId: string) {
  return request(`/collections/${collectionId}/comments/${commentId}`, { method: "DELETE" });
}

// ---- REVIEWS ----
export async function getTopReviews(): Promise<any[]> {
  return request("/reviews/top");
}

export async function getMovieReviews(movieId: number): Promise<any[]> {
  return request(`/reviews/movie/${movieId}`);
}

export async function likeReview(reviewId: string) {
  return request(`/reviews/${reviewId}/like`, { method: "POST" });
}

export async function deleteReview(reviewId: string) {
  return request(`/reviews/${reviewId}`, { method: "DELETE" });
}

// ---- TV SHOWS (TMDB) ----
export async function searchTVShows(query: string, page = 1) {
  return request(`/tmdb/search/tv?query=${encodeURIComponent(query)}&language=${getTmdbLang()}&page=${page}`);
}

export async function getTVShow(id: number) {
  return request(`/tmdb/tv/${id}?language=${getTmdbLang()}&append_to_response=credits`);
}

export async function getTVShowBasic(id: number) {
  return request(`/tmdb/tv/${id}?language=${getTmdbLang()}`);
}

export async function getTVShowVideos(id: number) {
  const data = await request(`/tmdb/tv/${id}/videos?language=en-US`);
  if (!data?.results?.length) {
    return request(`/tmdb/tv/${id}/videos`);
  }
  return data;
}

export async function getTrendingTV() {
  return request(`/tmdb/trending/tv/week?language=${getTmdbLang()}`);
}

export async function getPopularTV(page = 1) {
  return request(`/tmdb/tv/popular?language=${getTmdbLang()}&page=${page}`);
}

export async function getTopRatedTV(page = 1) {
  return request(`/tmdb/tv/top_rated?language=${getTmdbLang()}&page=${page}`);
}

export async function getAiringToday(page = 1) {
  return request(`/tmdb/tv/airing_today?language=${getTmdbLang()}&page=${page}`);
}

export async function getOnAirTV(page = 1) {
  return request(`/tmdb/tv/on_the_air?language=${getTmdbLang()}&page=${page}`);
}

export async function getTVGenres() {
  return request(`/tmdb/genre/tv/list?language=${getTmdbLang()}`);
}

export async function getTVShowsByGenre(genreId: number, page = 1) {
  return request(`/tmdb/discover/tv?with_genres=${genreId}&language=${getTmdbLang()}&sort_by=popularity.desc&page=${page}`);
}

export async function getTVSeasonDetails(tvId: number, seasonNumber: number) {
  return request(`/tmdb/tv/${tvId}/season/${seasonNumber}?language=${getTmdbLang()}`);
}

// ---- KAZAKH CINEMA (TMDB discover with origin country KZ) ----
export async function getKazakhMoviesTopRated(page = 1) {
  return request(`/tmdb/discover/movie?with_origin_country=KZ&sort_by=vote_average.desc&vote_count.gte=5&language=${getTmdbLang()}&page=${page}`);
}

export async function getKazakhMoviesNew(page = 1) {
  return request(`/tmdb/discover/movie?with_origin_country=KZ&sort_by=release_date.desc&language=${getTmdbLang()}&page=${page}`);
}

export async function getKazakhMoviesGoldenAge(page = 1) {
  // Golden Age: Kazakh Soviet cinema (1960s–80s) + Kazakh New Wave (1988–2005)
  return request(`/tmdb/discover/movie?with_origin_country=KZ&sort_by=vote_average.desc&primary_release_date.lte=2005-12-31&vote_count.gte=2&language=${getTmdbLang()}&page=${page}`);
}

// ---- PEOPLE (TMDB) ----
export async function searchPeople(query: string, page = 1) {
  return request(`/tmdb/search/person?query=${encodeURIComponent(query)}&language=${getTmdbLang()}&page=${page}`);
}

export async function getPersonDetails(personId: number) {
  return request(`/tmdb/person/${personId}?language=${getTmdbLang()}`);
}

export async function getPersonMovies(personId: number) {
  return request(`/tmdb/person/${personId}/movie_credits?language=${getTmdbLang()}`);
}

// ---- AI ----
export async function aiChat(messages: { role: string; content: string }[]) {
  return request("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export async function aiExplain(movieId: number, movieTitle: string) {
  return request("/ai/explain", {
    method: "POST",
    body: JSON.stringify({ movieId, movieTitle }),
  });
}

export async function aiAnalyzeReview(movieId: number, review: string) {
  return request("/ai/analyze-review", {
    method: "POST",
    body: JSON.stringify({ movieId, review }),
  });
}

// ---- ADMIN API (real server routes) ----
export const api = {
  get: async <T = any>(path: string): Promise<T> => {
    return request(path) as Promise<T>;
  },
  post: async <T = any>(path: string, body: any): Promise<T> => {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<T>;
  },
  delete: async <T = any>(path: string): Promise<T> => {
    return request(path, { method: "DELETE" }) as Promise<T>;
  },
};

// Check admin status
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; email?: string }> {
  try {
    return await request("/admin/check");
  } catch {
    return { isAdmin: false };
  }
}

// Bootstrap first admin (call once when no admin exists)
export async function bootstrapAdmin(): Promise<{ ok: boolean; message?: string; email?: string; error?: string }> {
  return request("/admin/bootstrap", { method: "POST", body: JSON.stringify({}) });
}
