import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getMovie, addWatched, removeWatched, getWatched,
  TMDB_IMG, aiExplain, aiAnalyzeReview,
} from "../lib/api";
import {
  Star, Clock, ArrowLeft, Check, Trash2, Loader2,
  Calendar, Users, Film, Bot, Brain, LogIn, UserPlus, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";

export function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setMovie(null); setWatched(null); setRating(0); setReview("");

    getMovie(Number(id))
      .then(setMovie)
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));

    if (session) {
      getWatched().then((w) => {
        if (Array.isArray(w)) {
          const e = w.find((x: any) => x.movieId === Number(id));
          if (e) { setWatched(e); setRating(e.rating || 0); setReview(e.review || ""); }
        }
      }).catch(() => {});
    }
  }, [id, session]);

  const handleAdd = async () => {
    if (!session) { toast.error("Войдите в аккаунт"); return; }
    if (rating === 0) { toast.error("Поставьте оценку"); return; }
    setSaving(true);
    try {
      await addWatched(Number(id), rating, review);
      setWatched({ movieId: Number(id), rating, review });
      toast.success("Добавлено в библиотеку!");
    } catch { toast.error("Ошибка при добавлении"); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await removeWatched(Number(id));
      setWatched(null); setRating(0); setReview("");
      toast.success("Удалено из библиотеки");
    } catch { toast.error("Ошибка при удалении"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-9 h-9 text-primary animate-spin" />
    </div>
  );

  if (!movie || movie.success === false) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Film className="w-14 h-14 text-muted-foreground/30" />
      <p className="text-muted-foreground text-lg">Фильм не найден</p>
      <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">На главную</button>
    </div>
  );

  const directors = movie.credits?.crew?.filter((c: any) => c.job === "Director") || [];
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const year = movie.release_date?.slice(0, 4);
  const budget = movie.budget ? `$${(movie.budget / 1_000_000).toFixed(1)}M` : null;
  const revenue = movie.revenue ? `$${(movie.revenue / 1_000_000).toFixed(1)}M` : null;
  const langs = movie.spoken_languages?.map((l: any) => l.name).join(", ");
  const countries = movie.production_countries?.map((c: any) => c.name).join(", ");
  const companies = movie.production_companies?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative h-60 md:h-[360px] overflow-hidden">
          <img
            src={`${TMDB_IMG}/w1280${movie.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/75 to-transparent" />
        </div>
      )}

      <div
        className="max-w-5xl mx-auto px-4 pb-16 relative z-10"
        style={{ marginTop: movie.backdrop_path ? "-160px" : "2rem" }}
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        <div className="flex flex-col md:flex-row gap-7">
          {/* Poster */}
          <div className="shrink-0">
            {movie.poster_path ? (
              <img
                src={`${TMDB_IMG}/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-44 md:w-56 rounded-2xl shadow-2xl border border-border"
              />
            ) : (
              <div className="w-44 md:w-56 aspect-[2/3] bg-muted rounded-2xl flex items-center justify-center border border-border">
                <Film className="w-14 h-14 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-muted-foreground text-sm mt-1 italic">{movie.original_title}</p>
              )}
              {movie.tagline && (
                <p className="text-muted-foreground text-sm mt-2 italic border-l-2 border-primary/40 pl-3">«{movie.tagline}»</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              {year && (
                <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                  <Calendar className="w-3 h-3" /> {year}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                  <Clock className="w-3 h-3" />
                  {Math.floor(movie.runtime / 60)}ч {movie.runtime % 60}мин
                </span>
              )}
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/25 font-semibold">
                  <Star className="w-3 h-3 fill-primary" />
                  {movie.vote_average.toFixed(1)}
                  <span className="text-primary/50 font-normal">/ {movie.vote_count?.toLocaleString()}</span>
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g: any) => (
                  <span key={g.id} className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground border border-border hover:border-primary/30 transition-colors">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Описание</h3>
                <p className="text-foreground/80 leading-relaxed text-sm">{movie.overview}</p>
              </div>
            )}

            {/* AI Explain */}
            {session && (
              <div>
                {!aiExplanation ? (
                  <button
                    onClick={async () => {
                      setAiExplainLoading(true);
                      try { const d = await aiExplain(Number(id)); setAiExplanation(d.explanation); }
                      catch { setAiExplanation("Не удалось сгенерировать"); }
                      finally { setAiExplainLoading(false); }
                    }}
                    disabled={aiExplainLoading}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted hover:bg-accent border border-border hover:border-primary/30 px-3.5 py-2 rounded-xl transition-all"
                  >
                    {aiExplainLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    AI: Почему вам понравится этот фильм?
                  </button>
                ) : (
                  <div className="bg-muted border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary text-[11px] font-bold uppercase tracking-wider">AI-анализ совместимости</span>
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed">{aiExplanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {directors.length > 0 && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Режиссёр</p><p className="text-sm text-foreground">{directors.map((d: any) => d.name).join(", ")}</p></div>
              )}
              {countries && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Страна</p><p className="text-sm text-foreground">{countries}</p></div>
              )}
              {langs && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Язык</p><p className="text-sm text-foreground">{langs}</p></div>
              )}
              {budget && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Бюджет</p><p className="text-sm text-foreground">{budget}</p></div>
              )}
              {revenue && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Сборы</p><p className="text-sm text-foreground">{revenue}</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Актёры
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {cast.map((c: any) => (
                <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                  {c.profile_path ? (
                    <img src={`${TMDB_IMG}/w185${c.profile_path}`} alt={c.name} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      <Users className="w-7 h-7 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-foreground text-[11px] font-semibold line-clamp-1">{c.name}</p>
                    <p className="text-muted-foreground text-[10px] line-clamp-1">{c.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companies */}
        {companies.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Производство</h3>
            <div className="flex flex-wrap gap-2">
              {companies.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                  {c.logo_path && <img src={`${TMDB_IMG}/w92${c.logo_path}`} alt={c.name} className="h-4 object-contain opacity-70 dark:invert dark:opacity-60" />}
                  <span className="text-muted-foreground text-xs">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Rating panel ─────────────────────────── */}
        <div className="mt-10">
          {session ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base">
                  {watched ? "Вы уже смотрели этот фильм" : "Отметить как просмотренный"}
                </h3>
                {watched && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded-full">
                    В библиотеке
                  </span>
                )}
              </div>

              {/* Stars */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ваша оценка:</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star className={`w-6 h-6 transition-colors ${n <= (hoverRating || rating) ? "text-primary fill-primary" : "text-border hover:text-muted-foreground"}`} />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-primary font-black text-xl leading-none">
                      {rating}<span className="text-muted-foreground text-sm font-normal">/10</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Review */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Отзыв (необязательно):</p>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Что вы думаете об этом фильме?..."
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none h-24 placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleAdd} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {watched ? "Обновить" : "Добавить в библиотеку"}
                </button>

                {review.trim().length >= 10 && (
                  <button
                    onClick={async () => {
                      setSentimentLoading(true);
                      try { const d = await aiAnalyzeReview(review, movie?.title || ""); setSentimentData(d); }
                      catch { toast.error("Ошибка анализа"); }
                      finally { setSentimentLoading(false); }
                    }}
                    disabled={sentimentLoading}
                    className="flex items-center gap-2 bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    {sentimentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    AI Анализ
                  </button>
                )}

                {watched && (
                  <button
                    onClick={handleRemove} disabled={saving}
                    className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/15 border border-destructive/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Удалить
                  </button>
                )}
              </div>

              {/* Sentiment */}
              {sentimentData && (
                <div className="bg-muted border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-[11px] font-bold uppercase tracking-wider">AI Sentiment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sentimentData.sentiment === "positive" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      sentimentData.sentiment === "negative" ? "bg-destructive/15 text-destructive" :
                      sentimentData.sentiment === "mixed" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {sentimentData.sentiment === "positive" ? "Позитивный" :
                       sentimentData.sentiment === "negative" ? "Негативный" :
                       sentimentData.sentiment === "mixed" ? "Смешанный" : "Нейтральный"}
                    </span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(sentimentData.score||0.5)>0.6?"bg-green-500":(sentimentData.score||0.5)<0.4?"bg-destructive":"bg-primary"}`}
                        style={{ width: `${(sentimentData.score||0.5)*100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">{((sentimentData.score||0.5)*100).toFixed(0)}%</span>
                  </div>
                  <p className="text-foreground/70 text-sm">{sentimentData.summary}</p>
                  {sentimentData.emotions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sentimentData.emotions.map((e: string, i: number) => (
                        <span key={i} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full border border-border">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Guest CTA */
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-foreground mb-1">Оцените этот фильм</h3>
                <p className="text-muted-foreground text-sm">
                  Войдите, чтобы добавить в библиотеку, поставить оценку и получать AI-рекомендации.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                  <LogIn className="w-4 h-4" /> Войти
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-sm font-medium hover:border-primary/30 transition-all">
                  <UserPlus className="w-4 h-4" /> Регистрация
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-muted-foreground/40 text-xs mt-10">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </div>
  );
}
