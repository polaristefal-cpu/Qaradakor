import { useEffect, useState } from "react";
import {
  MessageSquare, Star, ThumbsUp, Quote, Loader2, Trash2,
  ChevronDown, ChevronUp, User,
} from "lucide-react";
import { getMovieReviews, likeReview, deleteReview } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";

interface Review {
  id: string;
  userId: string;
  userName: string;
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  rating: number;
  review: string;
  createdAt: string;
  likes: number;
  likedBy?: string[];
}

function ReviewItem({
  review,
  currentUserId,
  onLike,
  onDelete,
}: {
  review: Review;
  currentUserId?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const liked = currentUserId ? (review.likedBy || []).includes(currentUserId) : false;
  const isOwn = currentUserId === review.userId;
  const MAX_LEN = 300;
  const truncated = review.review.length > MAX_LEN;
  const text = !expanded && truncated ? review.review.slice(0, MAX_LEN) + "…" : review.review;
  const letter = review.userName?.charAt(0).toUpperCase() || "?";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              {isOwn ? (
                <span className="text-primary text-[11px] font-black">{letter}</span>
              ) : (
                <User className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {isOwn ? "Вы" : review.userName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-primary font-black text-sm leading-none">{review.rating}</span>
            <span className="text-primary/50 text-[10px]">/10</span>
          </div>
        </div>

        {/* Text */}
        <div className="relative pl-4">
          <Quote className="w-6 h-6 text-primary/8 absolute -top-0.5 -left-0.5" />
          <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          {truncated && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Свернуть</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Читать полностью</>
              )}
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <button
            onClick={() => onLike(review.id)}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              liked
                ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/15"
                : "text-muted-foreground border-transparent hover:border-border hover:bg-muted"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${liked ? "fill-primary" : ""}`} />
            <span>{review.likes > 0 ? review.likes : ""} Полезно</span>
          </button>

          {isOwn && (
            <button
              onClick={() => onDelete(review.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/8"
            >
              <Trash2 className="w-3 h-3" />
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MovieReviews({ movieId }: { movieId: number }) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = () => {
    setLoading(true);
    getMovieReviews(movieId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [movieId]);

  const handleLike = async (reviewId: string) => {
    if (!session) { toast.error("Войдите, чтобы оценить рецензию"); return; }
    try {
      const res = await likeReview(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                likes: res.likes ?? r.likes,
                likedBy: res.liked
                  ? [...(r.likedBy || []), session.user.id]
                  : (r.likedBy || []).filter((id: string) => id !== session.user.id),
              }
            : r
        )
      );
    } catch { toast.error("Не удалось оценить"); }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Удалить рецензию?")) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Рецензия удалена");
    } catch { toast.error("Ошибка при удалении"); }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Загрузка рецензий...
      </div>
    );
  }

  const displayed = showAll ? reviews : reviews.slice(0, 3);

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-0.5 h-5 rounded-full bg-primary" />
        <MessageSquare className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Рецензии зрителей</h2>
        {reviews.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            {reviews.length}
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Пока нет рецензий</p>
          {session && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Будьте первым — оцените и напишите отзыв выше
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              currentUserId={session?.user?.id}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}

          {reviews.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-xl bg-card transition-all"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4" /> Скрыть</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> Показать все {reviews.length} рецензии</>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
