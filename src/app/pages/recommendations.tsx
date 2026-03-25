import { useState, useEffect, useCallback, useRef } from "react";
import { getRecommendations } from "../lib/api";
import { RecommendationCard } from "../components/recommendation-card";
import { useLang } from "../lib/lang-context";
import { Sparkles, Loader2, Film, Library, BookOpen, RefreshCw, RotateCcw, Shuffle, Filter } from "lucide-react";
import { Link } from "react-router";

const STORAGE_KEY = "qaradakor_rec_history";
const MAX_HISTORY = 500;

interface RecHistory {
  shown: number[];   // all movie IDs ever shown
  skipped: number[]; // explicitly skipped
  rated: number[];   // rated through rec cards
  generation: number; // how many times refreshed
}

function loadHistory(): RecHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const h = JSON.parse(raw);
      return {
        shown: Array.isArray(h.shown) ? h.shown : [],
        skipped: Array.isArray(h.skipped) ? h.skipped : [],
        rated: Array.isArray(h.rated) ? h.rated : [],
        generation: typeof h.generation === "number" ? h.generation : 0,
      };
    }
  } catch {}
  return { shown: [], skipped: [], rated: [], generation: 0 };
}

function saveHistory(h: RecHistory) {
  // Trim to avoid localStorage bloat
  const trimmed = {
    shown: h.shown.slice(-MAX_HISTORY),
    skipped: h.skipped.slice(-MAX_HISTORY),
    rated: h.rated.slice(-MAX_HISTORY),
    generation: h.generation,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
}

export function RecommendationsPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<RecHistory>(loadHistory);
  const [deepMode, setDeepMode] = useState(true); // exclude previously shown
  const { t } = useLang();
  const loadCountRef = useRef(0);

  const loadRecommendations = useCallback((resetHistory = false) => {
    setLoading(true);
    setSkipped(new Set());

    let currentHistory = resetHistory
      ? { shown: [], skipped: [], rated: [], generation: 0 }
      : loadHistory();

    if (resetHistory) {
      saveHistory(currentHistory);
      setHistory(currentHistory);
    }

    const nextGen = currentHistory.generation + 1;
    const seed = Math.floor(Math.random() * 100000);

    // Build exclude list: all previously shown movie IDs (if deep mode on)
    const excludeIds = deepMode && !resetHistory
      ? [...new Set([...currentHistory.shown, ...currentHistory.skipped])]
      : [];

    getRecommendations({
      exclude: excludeIds.length > 0 ? excludeIds.slice(-200) : undefined,
      page: nextGen,
      seed,
    })
      .then((data: any[]) => {
        const list = Array.isArray(data) ? data : [];
        setMovies(list);

        // Track shown IDs
        const newShown = [...currentHistory.shown, ...list.map((m: any) => m.id)];
        const updated: RecHistory = {
          ...currentHistory,
          shown: newShown,
          generation: nextGen,
        };
        saveHistory(updated);
        setHistory(updated);
      })
      .catch(() => setMovies([]))
      .finally(() => {
        setLoading(false);
        loadCountRef.current++;
      });
  }, [deepMode]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleSkip = (movieId: number) => {
    setSkipped((prev) => new Set([...prev, movieId]));
    // Persist skip
    const h = loadHistory();
    if (!h.skipped.includes(movieId)) {
      h.skipped.push(movieId);
      saveHistory(h);
      setHistory(h);
    }
  };

  const handleFullReset = () => {
    loadRecommendations(true);
  };

  const visible = movies.filter((m) => !skipped.has(m.id));
  const skippedCount = skipped.size;
  const totalHistoryShown = history.shown.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">{t("analyzingTastes")}</p>
        {history.generation > 0 && (
          <p className="text-muted-foreground/50 text-[10px]">
            Поколение #{history.generation + 1} · Исключено {history.shown.length} фильмов
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5.5 h-5.5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">{t("recommendationsTitle")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("recommendationsSubtitle")}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {movies.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Deep mode toggle */}
            <button
              onClick={() => setDeepMode(!deepMode)}
              title={deepMode ? "Глубокий режим: новые фильмы каждый раз" : "Обычный режим: могут повторяться"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                deepMode
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              {deepMode ? "Глубокий" : "Обычный"}
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadRecommendations(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-muted text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>

            {/* Full reset */}
            {totalHistoryShown > 20 && (
              <button
                onClick={handleFullReset}
                title="Сбросить историю и начать рекомендации с нуля"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:text-red-300 hover:border-red-500/50 text-xs font-semibold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сброс
              </button>
            )}
          </div>
        )}
      </div>

      {/* How it works + stats */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link
          to="/recommendations-doc"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {t("howItWorksLink")}
        </Link>

        {/* Stats */}
        {totalHistoryShown > 0 && (
          <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Поколение #{history.generation} · Просмотрено {totalHistoryShown} рек.
            {deepMode && " · Исключены повторы"}
          </span>
        )}

        {/* Skipped counter */}
        {skippedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            Пропущено: <span className="font-semibold text-foreground">{skippedCount}</span>
            {" "}— исключены из будущих подборок
          </span>
        )}
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">{t("noHistoryTitle")}</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              {t("noHistoryDesc")}
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Library className="w-4 h-4" />
            {t("goToLibrary")}
          </Link>
        </div>
      ) : visible.length === 0 ? (
        /* All skipped */
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary/40" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Все фильмы просмотрены или пропущены
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Нажмите «Обновить» — алгоритм подберёт совершенно новые фильмы, исключив все {totalHistoryShown} ранее показанных
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadRecommendations(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Новая подборка
            </button>
            <button
              onClick={handleFullReset}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Сброс истории
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {visible.map((movie) => (
            <RecommendationCard
              key={movie.id}
              movie={movie}
              onSkip={handleSkip}
            />
          ))}
        </div>
      )}
    </div>
  );
}