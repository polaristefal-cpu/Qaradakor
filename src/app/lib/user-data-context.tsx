import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./auth-context";
import {
  getWatched, getWatchlist,
  addToWatchlist as apiAddToWatchlist,
  removeFromWatchlist as apiRemoveFromWatchlist,
  addWatched as apiAddWatched,
  removeWatched as apiRemoveWatched,
} from "./api";

export interface WatchedEntry {
  movieId: number;
  rating: number;
  review?: string;
  addedAt: string;
  mediaType?: "movie" | "tv";
}

interface UserDataCtx {
  // Movies
  watchedMap: Record<number, WatchedEntry>;
  watchlistSet: Set<number>;
  addToWatchlistFn: (movie: {
    movieId: number; title: string;
    poster_path: string | null; release_date: string; vote_average: number;
    mediaType?: "movie" | "tv";
  }) => Promise<void>;
  removeFromWatchlistFn: (movieId: number, mediaType?: "movie" | "tv") => Promise<void>;
  addWatchedFn: (movieId: number, rating: number, review?: string, mediaType?: "movie" | "tv") => Promise<void>;
  removeWatchedFn: (movieId: number, mediaType?: "movie" | "tv") => Promise<void>;
  refreshUserData: () => Promise<void>;
  // TV Shows
  tvWatchedMap: Record<number, WatchedEntry>;
  tvWatchlistSet: Set<number>;
}

const Ctx = createContext<UserDataCtx | null>(null);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [watchedMap, setWatchedMap] = useState<Record<number, WatchedEntry>>({});
  const [watchlistSet, setWatchlistSet] = useState<Set<number>>(new Set());
  const [tvWatchedMap, setTvWatchedMap] = useState<Record<number, WatchedEntry>>({});
  const [tvWatchlistSet, setTvWatchlistSet] = useState<Set<number>>(new Set());

  const clearUserData = useCallback(() => {
    setWatchedMap({});
    setWatchlistSet(new Set());
    setTvWatchedMap({});
    setTvWatchlistSet(new Set());
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!session) {
      clearUserData();
      return;
    }

    const [w, wl] = await Promise.all([getWatched(), getWatchlist()]);
    const movieMap: Record<number, WatchedEntry> = {};
    const tvMap: Record<number, WatchedEntry> = {};
    if (Array.isArray(w)) {
      w.forEach((e: WatchedEntry) => {
        if ((e.mediaType || "movie") === "tv") tvMap[e.movieId] = e;
        else movieMap[e.movieId] = e;
      });
    }
    setWatchedMap(movieMap);
    setTvWatchedMap(tvMap);

    const movieIds = new Set<number>();
    const tvIds = new Set<number>();
    if (Array.isArray(wl)) {
      wl.forEach((e: any) => {
        if ((e.mediaType || "movie") === "tv") tvIds.add(e.movieId as number);
        else movieIds.add(e.movieId as number);
      });
    }
    setWatchlistSet(movieIds);
    setTvWatchlistSet(tvIds);
  }, [clearUserData, session]);

  useEffect(() => {
    refreshUserData().catch(() => {});
  }, [refreshUserData]);

  const addToWatchlistFn = useCallback(async (movie: any) => {
    const mt: "movie" | "tv" = movie.mediaType || "movie";
    await apiAddToWatchlist(movie);
    if (mt === "tv") {
      setTvWatchlistSet(prev => new Set([...prev, movie.movieId as number]));
    } else {
      setWatchlistSet(prev => new Set([...prev, movie.movieId as number]));
    }
  }, []);

  const removeFromWatchlistFn = useCallback(async (movieId: number, mediaType: "movie" | "tv" = "movie") => {
    await apiRemoveFromWatchlist(movieId, mediaType);
    if (mediaType === "tv") {
      setTvWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
    } else {
      setWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
    }
  }, []);

  const addWatchedFn = useCallback(async (movieId: number, rating: number, review?: string, mediaType: "movie" | "tv" = "movie") => {
    await apiAddWatched(movieId, rating, review, undefined, undefined, mediaType);
    const entry: WatchedEntry = { movieId, rating, review, addedAt: new Date().toISOString(), mediaType };
    if (mediaType === "tv") {
      setTvWatchedMap(prev => ({ ...prev, [movieId]: entry }));
      setTvWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
    } else {
      setWatchedMap(prev => ({ ...prev, [movieId]: entry }));
      setWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
    }
  }, []);

  const removeWatchedFn = useCallback(async (movieId: number, mediaType: "movie" | "tv" = "movie") => {
    await apiRemoveWatched(movieId, mediaType);
    if (mediaType === "tv") {
      setTvWatchedMap(prev => { const n = { ...prev }; delete n[movieId]; return n; });
    } else {
      setWatchedMap(prev => { const n = { ...prev }; delete n[movieId]; return n; });
    }
  }, []);

  return (
    <Ctx.Provider value={{
      watchedMap, watchlistSet,
      tvWatchedMap, tvWatchlistSet,
      addToWatchlistFn, removeFromWatchlistFn,
      addWatchedFn, removeWatchedFn,
      refreshUserData,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserData must be within UserDataProvider");
  return ctx;
}
