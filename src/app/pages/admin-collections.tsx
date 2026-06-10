import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { api, TMDB_IMG } from "../lib/api";
import { Search, Trash2, Eye, Pin, PinOff } from "lucide-react";
import { Link } from "react-router";

interface Collection {
  id: string;
  name: string;
  description: string;
  poster_url: string | null;
  user_id: string;
  username: string;
  created_at: string;
  is_public: boolean;
  is_featured: boolean;
  total_movies: number;
  total_likes: number;
  total_comments: number;
}

export function AdminCollectionsPage() {
  const { t } = useLang();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "featured" | "popular">("all");

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [searchQuery, filterType, collections]);

  async function loadCollections() {
    try {
      setLoading(true);
      const data = await api.get<Collection[]>("/admin/collections");
      setCollections(data);
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterCollections() {
    let result = collections;

    // Filter by type
    if (filterType === "featured") {
      result = result.filter((c) => c.is_featured);
    } else if (filterType === "popular") {
      result = result.sort((a, b) => b.total_likes - a.total_likes).slice(0, 20);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query)
      );
    }

    setFilteredCollections(result);
  }

  async function toggleFeatured(collectionId: string, currentlyFeatured: boolean) {
    try {
      await api.post(`/admin/collections/${collectionId}/toggle-featured`, {});
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, is_featured: !currentlyFeatured } : c
        )
      );
    } catch (err) {
      alert(t("errorUpdatingCollection"));
      console.error(err);
    }
  }

  async function deleteCollection(collectionId: string) {
    if (!confirm(t("confirmDeleteCollection"))) return;

    try {
      await api.delete(`/admin/collections/${collectionId}`);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    } catch (err) {
      alert(t("errorDeletingCollection"));
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="h-12 bg-foreground/10 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t("adminCollections")}</h1>

      {/* Filters */}
      <div className="bg-background border border-border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder={t("searchCollections")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">{t("allCollections")}</option>
            <option value="featured">{t("featuredCollections")}</option>
            <option value="popular">{t("popularCollections")}</option>
          </select>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map((collection) => (
          <div
            key={collection.id}
            className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Poster */}
            <div className="aspect-[16/9] bg-foreground/5 relative">
              {collection.poster_url ? (
                <img
                  src={`${TMDB_IMG}/w500${collection.poster_url}`}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/40">
                  <span className="text-4xl">🎬</span>
                </div>
              )}
              {collection.is_featured && (
                <div className="absolute top-2 right-2 bg-foreground text-background px-2 py-1 rounded text-xs font-semibold">
                  {t("featured")}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{collection.name}</h3>
              <p className="text-sm text-foreground/60 mb-2">
                {t("by")} {collection.username}
              </p>
              <p className="text-sm text-foreground/70 line-clamp-2 mb-3">
                {collection.description || t("noDescription")}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                <span>🎬 {collection.total_movies}</span>
                <span>❤️ {collection.total_likes}</span>
                <span>💬 {collection.total_comments}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/collections/${collection.id}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {t("view")}
                </Link>
                <button
                  onClick={() => toggleFeatured(collection.id, collection.is_featured)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                  title={collection.is_featured ? t("unfeature") : t("feature")}
                >
                  {collection.is_featured ? (
                    <PinOff className="w-4 h-4" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                  title={t("delete")}
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="py-12 text-center text-foreground/60">
          {t("noCollectionsFound")}
        </div>
      )}
    </div>
  );
}