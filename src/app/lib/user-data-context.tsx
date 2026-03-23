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
}

interface UserDataCtx {
  watchedMap: Record<number, WatchedEntry>;
  watchlistSet: Set<number>;
  addToWatchlistFn: (movie: {
    movieId: number; title: string;
    poster_path: string | null; release_date: string; vote_average: number;
  }) => Promise<void>;
  removeFromWatchlistFn: (movieId: number) => Promise<void>;
  addWatchedFn: (movieId: number, rating: number, review?: string) => Promise<void>;
  removeWatchedFn: (movieId: number) => Promise<void>;
}

const Ctx = createContext<UserDataCtx | null>(null);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [watchedMap, setWatchedMap] = useState<Record<number, WatchedEntry>>({});
  const [watchlistSet, setWatchlistSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!session) {
      setWatchedMap({});
      setWatchlistSet(new Set());
      return;
    }
    Promise.all([getWatched(), getWatchlist()])
      .then(([w, wl]) => {
        const map: Record<number, WatchedEntry> = {};
        if (Array.isArray(w)) w.forEach((e: WatchedEntry) => { map[e.movieId] = e; });
        setWatchedMap(map);
        if (Array.isArray(wl)) setWatchlistSet(new Set(wl.map((e: any) => e.movieId as number)));
      })
      .catch(() => {});
  }, [session]);

  const addToWatchlistFn = useCallback(async (movie: any) => {
    await apiAddToWatchlist(movie);
    setWatchlistSet(prev => new Set([...prev, movie.movieId as number]));
  }, []);

  const removeFromWatchlistFn = useCallback(async (movieId: number) => {
    await apiRemoveFromWatchlist(movieId);
    setWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
  }, []);

  const addWatchedFn = useCallback(async (movieId: number, rating: number, review?: string) => {
    await apiAddWatched(movieId, rating, review);
    setWatchedMap(prev => ({
      ...prev,
      [movieId]: { movieId, rating, review, addedAt: new Date().toISOString() },
    }));
    setWatchlistSet(prev => { const n = new Set(prev); n.delete(movieId); return n; });
  }, []);

  const removeWatchedFn = useCallback(async (movieId: number) => {
    await apiRemoveWatched(movieId);
    setWatchedMap(prev => { const n = { ...prev }; delete n[movieId]; return n; });
  }, []);

  return (
    <Ctx.Provider value={{ watchedMap, watchlistSet, addToWatchlistFn, removeFromWatchlistFn, addWatchedFn, removeWatchedFn }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserData must be within UserDataProvider");
  return ctx;
}
