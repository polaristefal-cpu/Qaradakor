import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Star, Quote, ThumbsUp, MessageSquare, Film, ArrowRight } from "lucide-react";
import { getTopReviews, likeReview, TMDB_IMG } from "../lib/api";
import { useAuth } from "../lib/auth-context";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= rating ? "text-primary fill-primary" : "text-border"}`}
        />
      ))}
      <span className="ml-1.5 text-primary font-black text-sm leading-none">
        {rating}<span className="text-muted-foreground text-xs font-normal">/10</span>
      </span>
    </div>
  );
}

function ReviewCard({ review, onLike, currentUserId }: {
  review: Review;
  onLike: (id: string) => void;
  currentUserId?: string;
}) {
  const navigate = useNavigate();
  const liked = currentUserId ? (review.likedBy || []).includes(currentUserId) : false;
  const isOwn = currentUserId === review.userId;
  const MAX_LEN = 220;
  const truncated = review.review.length > MAX_LEN;
  const text = truncated ? review.review.slice(0, MAX_LEN) + "…" : review.review;

  // Avatar letter
  const letter = review.userName?.charAt(0).toUpperCase() || "?";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group flex flex-col">
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Movie info */}
        <button
          onClick={() => navigate(`/movie/${review.movieId}`)}
          className="flex items-center gap-3 group/movie"
        >
          {review.posterPath ? (
            <img
              src={`${TMDB_IMG}/w92${review.posterPath}`}
              alt={review.movieTitle}
              className="w-10 h-14 rounded-lg object-cover shrink-0 group-hover/movie:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-10 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Film className="w-4 h-4 text-muted-foreground/40" />
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-foreground line-clamp-1 group-hover/movie:text-primary transition-colors">
              {review.movieTitle}
            </p>
            <StarRating rating={review.rating} />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover/movie:opacity-100 transition-opacity shrink-0" />
        </button>

        {/* Review text */}
        <div className="relative flex-1">
          <Quote className="w-6 h-6 text-primary/10 absolute -top-1 -left-0.5" />
          <p className="text-foreground/80 text-sm leading-relaxed pl-4">
            {text}
          </p>
          {truncated && (
            <button
              onClick={() => navigate(`/movie/${review.movieId}`)}
              className="text-xs text-primary hover:underline mt-1 pl-4"
            >
              Читать полностью
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary text-[10px] font-black">{letter}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {isOwn ? "Вы" : review.userName}
            </span>
            <span className="text-muted-foreground/40 text-[10px]">
              {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          {/* Like */}
          <button
            onClick={() => onLike(review.id)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              liked
                ? "bg-primary/10 text-primary border-primary/25"
                : "text-muted-foreground border-transparent hover:border-border hover:text-foreground"
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${liked ? "fill-primary" : ""}`} />
            {review.likes > 0 && <span>{review.likes}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TopReviewsSection() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (reviewId: string) => {
    if (!session) return;
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
                  : (r.likedBy || []).filter((id) => id !== session.user.id),
              }
            : r
        )
      );
    } catch {}
  };

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-0.5 h-5 rounded-full bg-primary" />
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground tracking-tight">Лучшие рецензии</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!reviews.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-5 rounded-full bg-primary" />
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground tracking-tight">Лучшие рецензии</h2>
          <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
            Топ-5
          </span>
        </div>
        {session && (
          <button
            onClick={() => navigate("/library")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Написать рецензию <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reviews.slice(0, 5).map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onLike={handleLike}
            currentUserId={session?.user?.id}
          />
        ))}
      </div>

      {!session && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            <button
              onClick={() => navigate("/register")}
              className="text-primary hover:underline font-medium"
            >
              Зарегистрируйтесь
            </button>{" "}
            чтобы писать рецензии и ставить оценки
          </p>
        </div>
      )}
    </section>
  );
}
