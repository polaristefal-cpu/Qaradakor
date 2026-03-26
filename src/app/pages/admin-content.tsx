import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { api } from "../lib/api";
import { Search, Trash2, MessageSquare, Star } from "lucide-react";
import { Link } from "react-router";

interface Review {
  id: string;
  user_id: string;
  username: string;
  movie_id: number;
  movie_title: string;
  rating: number;
  review: string;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  collection_id: string;
  collection_name: string;
  comment: string;
  created_at: string;
}

export function AdminContentPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<"reviews" | "comments">("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === "reviews") {
      filterReviews();
    } else {
      filterComments();
    }
  }, [searchQuery, reviews, comments, tab]);

  async function loadData() {
    try {
      setLoading(true);
      const [reviewsData, commentsData] = await Promise.all([
        api.get<Review[]>("/admin/reviews"),
        api.get<Comment[]>("/admin/comments"),
      ]);
      setReviews(reviewsData);
      setComments(commentsData);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterReviews() {
    let result = reviews;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.username.toLowerCase().includes(query) ||
          r.movie_title.toLowerCase().includes(query) ||
          r.review.toLowerCase().includes(query)
      );
    }

    setFilteredReviews(result);
  }

  function filterComments() {
    let result = comments;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.username.toLowerCase().includes(query) ||
          c.collection_name.toLowerCase().includes(query) ||
          c.comment.toLowerCase().includes(query)
      );
    }

    setFilteredComments(result);
  }

  async function deleteReview(reviewId: string) {
    if (!confirm(t("confirmDeleteReview"))) return;

    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert(t("errorDeletingReview"));
      console.error(err);
    }
  }

  async function deleteComment(commentId: string, collectionId: string) {
    if (!confirm(t("confirmDeleteComment"))) return;

    try {
      await api.delete(`/admin/comments/${collectionId}/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(t("errorDeletingComment"));
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="h-12 bg-foreground/10 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t("adminContent")}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setTab("reviews")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            tab === "reviews"
              ? "text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            {t("reviews")} ({reviews.length})
          </div>
          {tab === "reviews" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
          )}
        </button>
        <button
          onClick={() => setTab("comments")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            tab === "comments"
              ? "text-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {t("comments")} ({comments.length})
          </div>
          {tab === "comments" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"></div>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="bg-background border border-border rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            placeholder={
              tab === "reviews" ? t("searchReviews") : t("searchComments")
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      </div>

      {/* Reviews List */}
      {tab === "reviews" && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      to={`/movie/${review.movie_id}`}
                      target="_blank"
                      className="font-bold hover:underline"
                    >
                      {review.movie_title}
                    </Link>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{review.rating}/10</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 mb-2">
                    {t("by")} {review.username} •{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-foreground/80">{review.review}</p>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors ml-4"
                  title={t("delete")}
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="py-12 text-center text-foreground/60">
              {t("noReviewsFound")}
            </div>
          )}
        </div>
      )}

      {/* Comments List */}
      {tab === "comments" && (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      to={`/collections/${comment.collection_id}`}
                      target="_blank"
                      className="font-bold hover:underline"
                    >
                      {comment.collection_name}
                    </Link>
                  </div>
                  <p className="text-sm text-foreground/60 mb-2">
                    {t("by")} {comment.username} •{" "}
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-foreground/80">{comment.comment}</p>
                </div>
                <button
                  onClick={() => deleteComment(comment.id, comment.collection_id)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors ml-4"
                  title={t("delete")}
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {filteredComments.length === 0 && (
            <div className="py-12 text-center text-foreground/60">
              {t("noCommentsFound")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}