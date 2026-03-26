import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { getPersonDetails, getPersonMovies, TMDB_IMG } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import {
  ArrowLeft, User, Film, Loader2, Calendar,
  Clapperboard, Star, Filter,
} from "lucide-react";
import { BackButton } from "../components/back-button";

type Role = "all" | "cast" | "crew" | "director";

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [role, setRole] = useState<Role>("all");
  const [sortKey, setSortKey] = useState<"date" | "rating">("date");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPerson(null);
    setMovies([]);
    Promise.all([getPersonDetails(Number(id)), getPersonMovies(Number(id))])
      .then(([p, credits]) => {
        setPerson(p);
        // Merge cast + crew (directors/producers), deduplicate
        const seen = new Set<number>();
        const all: any[] = [];
        for (const m of [...(credits.cast || [])]) {
          if (!seen.has(m.id)) { seen.add(m.id); all.push({ ...m, _role: "cast" }); }
        }
        for (const m of [...(credits.crew || [])]) {
          if (!seen.has(m.id)) { seen.add(m.id); all.push({ ...m, _role: "crew", _job: m.job }); }
          else {
            // If movie already from cast, add job info
            const existing = all.find(x => x.id === m.id);
            if (existing) existing._job = [existing._job, m.job].filter(Boolean).join(", ");
          }
        }
        setMovies(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const deptLabel = (dept: string) => {
    if (dept === "Acting") return "Актёр / Актриса";
    if (dept === "Directing") return "Режиссёр";
    if (dept === "Writing") return "Сценарист";
    if (dept === "Production") return "Продюсер";
    return dept || "";
  };

  const filtered = movies
    .filter(m => {
      if (role === "cast") return m._role === "cast";
      if (role === "crew") return m._role === "crew";
      if (role === "director") return (m._job || "").toLowerCase().includes("director");
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "rating") return (b.vote_average || 0) - (a.vote_average || 0);
      return (b.release_date || "").localeCompare(a.release_date || "");
    });

  const bio = person?.biography;
  const bioShort = bio && bio.length > 400 ? bio.slice(0, 400) + "…" : bio;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загружаем…</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <User className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-muted-foreground">Не найдено</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">Назад</button>
      </div>
    );
  }

  const birthYear = person.birthday?.slice(0, 4);
  const deathYear = person.deathday?.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <BackButton />

      {/* Person card */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Photo */}
          <div className="shrink-0">
            <div className="w-32 sm:w-40 rounded-2xl overflow-hidden bg-muted border border-border shadow-md">
              {person.profile_path ? (
                <img
                  src={`${TMDB_IMG}/w342${person.profile_path}`}
                  alt={person.name}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center">
                  <User className="w-14 h-14 text-muted-foreground/20" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-black text-foreground leading-tight">{person.name}</h1>
              {person.also_known_as?.length > 0 && (
                <p className="text-muted-foreground text-sm mt-1 italic">{person.also_known_as[0]}</p>
              )}
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              {person.known_for_department && (
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg font-semibold">
                  {deptLabel(person.known_for_department)}
                </span>
              )}
              {birthYear && (
                <span className="text-xs bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {deathYear ? `${birthYear} – ${deathYear}` : `р. ${birthYear}`}
                </span>
              )}
              {person.place_of_birth && (
                <span className="text-xs bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-lg">
                  {person.place_of_birth}
                </span>
              )}
              {movies.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {movies.length} фильмов
                </span>
              )}
            </div>

            {/* Biography */}
            {bio && (
              <div>
                <p className="text-foreground/75 text-sm leading-relaxed">
                  {bioExpanded ? bio : bioShort}
                </p>
                {bio.length > 400 && (
                  <button
                    onClick={() => setBioExpanded(v => !v)}
                    className="text-primary text-xs mt-1 hover:underline"
                  >
                    {bioExpanded ? "Свернуть" : "Читать полностью"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filmography */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            Фильмография
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Role filter */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {([
                { key: "all", label: "Все" },
                { key: "cast", label: "В ролях" },
                { key: "director", label: "Режиссёр" },
                { key: "crew", label: "За кадром" },
              ] as { key: Role; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    role === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {([
                { key: "date", label: "Дата", icon: Calendar },
                { key: "rating", label: "Рейтинг", icon: Star },
              ] as { key: "date" | "rating"; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    sortKey === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Фильмов не найдено</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {filtered.map((m) => (
              <div key={m.id} className="relative">
                <MovieCard movie={m} />
                {m._role === "cast" && m.character && (
                  <p className="text-[9px] text-muted-foreground text-center mt-1 line-clamp-1 px-0.5">
                    {m.character}
                  </p>
                )}
                {m._role === "crew" && m._job && (
                  <p className="text-[9px] text-primary/70 text-center mt-1 line-clamp-1 px-0.5">
                    {m._job}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}