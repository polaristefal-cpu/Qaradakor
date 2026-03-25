/**
 * Страница документации: Алгоритм рекомендаций qaradakor.kz
 * Файл: /src/app/pages/recommendations-doc.tsx
 *
 * Описывает полный пайплайн Content-Based Filtering,
 * реализованный в /supabase/functions/server/index.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
  Calendar,
  Film,
  Loader2,
  Check,
  X as XIcon,
  GitBranch,
  Brain,
  BarChart2,
  TrendingUp,
  Shield,
  Users,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { BackButton } from "../components/back-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  id,
  label,
  icon: Icon,
  accent = false,
  children,
}: {
  id: string;
  label: string;
  icon: any;
  accent?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-6 py-4 transition ${
          accent ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-primary/15" : "bg-muted"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <h2 className={`font-bold text-base ${accent ? "text-primary" : "text-foreground"}`}>{label}</h2>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-6 pb-6 pt-4 space-y-4">{children}</div>}
    </section>
  );
}

function Formula({ children, label }: { children: string; label?: string }) {
  return (
    <div className="my-3">
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      )}
      <div className="bg-muted border border-border rounded-xl px-5 py-3 font-mono text-sm text-foreground overflow-x-auto whitespace-pre">
        {children}
      </div>
    </div>
  );
}

function Badge({ children, color = "default" }: { children: React.ReactNode; color?: "primary" | "green" | "orange" | "red" | "default" }) {
  const cls = {
    primary: "bg-primary/10 text-primary border-primary/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    default: "bg-muted text-muted-foreground border-border",
  }[color];
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {children}
    </span>
  );
}

function Row({ k, v, highlight = false }: { k: string; v: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0 ${highlight ? "bg-primary/5 -mx-6 px-6 rounded" : ""}`}>
      <span className="font-mono text-primary text-sm w-36 shrink-0">{k}</span>
      <span className="text-foreground/80 text-sm">{v}</span>
    </div>
  );
}

function WeightBar({ label, weight, max = 0.35 }: { label: string; weight: number; max?: number }) {
  const pct = (weight / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-foreground/70 text-xs w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-primary text-xs w-8 text-right">{(weight * 100).toFixed(0)}%</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function RecommendationsDocPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-20 space-y-5">

        {/* Back */}
        <BackButton />

        {/* Header */}
        <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground leading-tight">
                Алгоритм рекомендаций
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Content-Based Filtering с взвешенным скорингом — qaradakor.kz
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge color="primary">Content-Based Filtering</Badge>
                <Badge color="green">Weighted Scoring</Badge>
                <Badge color="default">TMDB API</Badge>
                <Badge color="default">KV Store</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 0. Overview */}
        <Section id="overview" label="0. Общий пайплайн" icon={GitBranch} accent>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Система использует подход <strong>Content-Based Filtering</strong> — рекомендации строятся
            исключительно на вкусах <em>текущего пользователя</em>, без сравнения с другими.
            Весь процесс разбит на три этапа:
          </p>
          <ol className="space-y-2 mt-2">
            {[
              ["Этап 1", "Построить вкусовой профиль пользователя по всем просмотренным фильмам"],
              ["Этап 2", "Собрать кандидатов из TMDB-рекомендаций топ-8 оценённых фильмов"],
              ["Этап 3", "Посчитать итоговый скор каждому кандидату и вернуть топ-20"],
            ].map(([step, desc]) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="font-mono text-primary shrink-0 font-bold">{step}</span>
                <span className="text-foreground/75">{desc}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 bg-muted border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Поток данных
            </p>
            <div className="font-mono text-xs text-foreground/70 space-y-1">
              <p>KV Store (watched[]) ──▶ tmdbFetch(details+credits) ──▶ genreScores{}</p>
              <p>                                                     ──▶ directorCounts{}</p>
              <p>                                                     ──▶ actorCounts{}</p>
              <p>topRated[8] ──▶ tmdbFetch(similar+recs) ──▶ candidateMap{}</p>
              <p>candidateMap ──▶ scoreEach() ──▶ filter(≥0.45) ──▶ sort ──▶ top 20</p>
            </div>
          </div>
        </Section>

        {/* 1. User Profile */}
        <Section id="profile" label="Этап 1 — Вкусовой профиль пользователя" icon={Brain}>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Для каждого просмотренного фильма из KV-хранилища запрашиваем TMDB
            (детали + credits). Затем строим три словаря.
          </p>

          <h3 className="font-bold text-foreground text-sm mt-4">1.1 Жанровые оценки (genreScores)</h3>
          <p className="text-foreground/70 text-sm">
            Для каждого жанра фильма суммируем нормированный рейтинг пользователя:
          </p>
          <Formula label="Накопление">
{`normalizedRating = userRating / 10          // ∈ [0, 1]

for each genre g in movie.genres:
    genreScores[g.id].score += normalizedRating
    genreScores[g.id].count += 1`}
          </Formula>
          <p className="text-muted-foreground text-xs">
            Если пользователь оценил боевик на 9/10 и триллер на 9/10 — оба жанра получат по +0.9.
            Фильм без оценки считается как 5/10 (по умолчанию).
          </p>

          <h3 className="font-bold text-foreground text-sm mt-5">1.2 Нормализация жанровых весов</h3>
          <p className="text-foreground/70 text-sm">
            Приводим все genre-score к диапазону [0..1] через min-max нормализацию:
          </p>
          <Formula label="Нормализация">
{`maxGenreScore = max(genreScores[*].score)    // наибольший жанровый балл

genreWeight[g] = genreScores[g].score / maxGenreScore
               ∈ [0, 1]`}
          </Formula>
          <p className="text-muted-foreground text-xs">
            Самый любимый жанр всегда получает вес 1.0. Остальные — пропорционально ниже.
          </p>

          <h3 className="font-bold text-foreground text-sm mt-5">1.3 Любимые режиссёры и актёры</h3>
          <p className="text-foreground/70 text-sm">
            Считаем только фильмы с оценкой ≥ 7 (высококачественный вкусовой сигнал):
          </p>
          <Formula label="Сбор частот">
{`if userRating >= 7:
    for each director in movie.credits.crew (job=Director):
        directorCounts[director.name] += 1

    for each actor in movie.credits.cast[0..4]:   // топ-5 актёров
        actorCounts[actor.name] += 1

// Порог — режиссёр/актёр в ≥2 высоко оценённых фильмах:
favDirectors = { name | directorCounts[name] >= 2 }
favActors    = { name | actorCounts[name]    >= 2 }`}
          </Formula>
        </Section>

        {/* 2. Candidates */}
        <Section id="candidates" label="Этап 2 — Сбор кандидатов" icon={Film}>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Берём топ-8 фильмов из библиотеки по пользовательскому рейтингу.
            Для каждого из них запрашиваем два TMDB-эндпоинта параллельно:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-muted rounded-xl p-3 border border-border">
              <p className="text-xs font-bold text-foreground mb-1">/movie/{"{id}"}/recommendations</p>
              <p className="text-muted-foreground text-xs">Прямые рекомендации TMDB — по алгоритму похожести платформы</p>
            </div>
            <div className="bg-muted rounded-xl p-3 border border-border">
              <p className="text-xs font-bold text-foreground mb-1">/movie/{"{id}"}/similar</p>
              <p className="text-muted-foreground text-xs">Похожие фильмы — по жанрам и ключевым словам TMDB</p>
            </div>
          </div>
          <Formula label="Наполнение candidateMap">
{`topRated = watched.sortByRating().slice(0, 8)

for each movie w in topRated:
    results = tmdb(w.id/recommendations) ∪ tmdb(w.id/similar)

    for each candidate c in results:
        if c.id ∉ watchedIds AND c.id ∉ candidateMap:
            candidateMap[c.id] = {
                movie: c,
                sourceRating: w.userRating   // «сила» источника
            }`}
          </Formula>
          <div className="flex items-start gap-2 bg-orange-500/5 border border-orange-500/15 rounded-xl p-3 mt-1">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-orange-500/90 text-xs">
              <strong>Дедупликация:</strong> если один кандидат попал из нескольких источников,
              в карту сохраняется только <em>первое</em> вхождение (вместе с sourceRating того фильма,
              который нашёл его первым).
            </p>
          </div>

          <h3 className="font-bold text-foreground text-sm mt-4">Обогащение кандидатов</h3>
          <p className="text-foreground/70 text-sm">
            Для первых 60 кандидатов дополнительно запрашиваются credits (для бонуса
            режиссёра/актёра на этапе 3):
          </p>
          <Formula>
{`creditMap[id] = tmdbFetch(/movie/\${id}?append_to_response=credits)
// параллельно, максимум 60 запросов`}
          </Formula>
        </Section>

        {/* 3. Scoring */}
        <Section id="scoring" label="Этап 3 — Взвешенный скоринг" icon={BarChart2} accent>
          <p className="text-foreground/80 text-sm leading-relaxed">
            Итоговый балл каждого кандидата — взвешенная сумма пяти компонент:
          </p>

          {/* Final formula */}
          <Formula label="Итоговая формула (finalScore)">
{`finalScore =
    genreMatch    × 0.35   // жанровое совпадение
  + sourceWeight  × 0.20   // рейтинг-источника
  + popularity    × 0.20   // качество TMDB
  + voteConfidence× 0.10   // уверенность голосов
  + crewBonus              // директор +0.15 / актёр +0.10
  + popularityLog × 0.05   // бонус популярности (log)`}
          </Formula>

          {/* Weight bars */}
          <div className="space-y-2.5 mt-2 mb-4 bg-muted rounded-xl p-4 border border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Веса компонент</p>
            <WeightBar label="Genre Match × 0.35"      weight={0.35} />
            <WeightBar label="Source Weight × 0.20"    weight={0.20} />
            <WeightBar label="Popularity × 0.20"       weight={0.20} />
            <WeightBar label="Vote Confidence × 0.10"  weight={0.10} />
            <WeightBar label="Crew Bonus (max 0.25)"    weight={0.25} />
            <WeightBar label="Popularity Log × 0.05"   weight={0.05} />
          </div>

          {/* Component descriptions */}
          <h3 className="font-bold text-foreground text-sm">Компоненты подробно</h3>

          <div className="space-y-4 mt-2">

            {/* Genre Match */}
            <div className="border-l-2 border-primary/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-primary" />
                <p className="font-semibold text-foreground text-sm">1. genreMatch — жанровое совпадение (вес 0.35)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Среднее значение genreWeight по всем жанрам кандидата:
              </p>
              <Formula>
{`movieGenreIds = candidate.genre_ids  // массив ID жанров

genreMatch = Σ genreWeight[g] / |movieGenreIds|
           = ( genreWeight[g₁] + genreWeight[g₂] + … ) / N`}
              </Formula>
              <p className="text-muted-foreground text-xs">
                Чем больше жанров кандидата совпадают с любимыми жанрами пользователя —
                тем выше genreMatch. Диапазон: <code>[0, 1]</code>.
              </p>
            </div>

            {/* Source Weight */}
            <div className="border-l-2 border-blue-500/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <p className="font-semibold text-foreground text-sm">2. sourceWeight — вес источника (вес 0.20)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Чем выше пользователь оценил «родительский» фильм, породивший кандидата,
                тем доверенней рекомендация:
              </p>
              <Formula>
{`sourceWeight = sourceRating / 10     // userRating ∈ [1..10]
             ∈ [0.1, 1.0]`}
              </Formula>
              <p className="text-muted-foreground text-xs">
                Кандидат из «Крёстного отца» (10/10) получит sourceWeight = 1.0,
                а кандидат из посредственного фильма (5/10) — только 0.5.
              </p>
            </div>

            {/* Popularity */}
            <div className="border-l-2 border-green-500/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-green-500" />
                <p className="font-semibold text-foreground text-sm">3. popularity — качество TMDB (вес 0.20)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Нормированный средний рейтинг TMDB кандидата:
              </p>
              <Formula>
{`popularity = min(movie.vote_average / 10, 1)
           ∈ [0, 1]

// Пример: vote_average = 7.4  →  popularity = 0.74`}
              </Formula>
            </div>

            {/* Vote Confidence */}
            <div className="border-l-2 border-orange-500/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                <p className="font-semibold text-foreground text-sm">4. voteConfidence — уверенность (вес 0.10)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Штрафует фильмы с малым числом голосов (насыщение при 100+ отзывах):
              </p>
              <Formula>
{`voteConfidence = min(movie.vote_count / 100, 1)
               ∈ [0, 1]

// vote_count =  30  →  0.30  (недостаточно данных)
// vote_count = 100  →  1.00  (насыщение)
// vote_count = 500  →  1.00  (насыщение)`}
              </Formula>
            </div>

            {/* Crew Bonus */}
            <div className="border-l-2 border-purple-500/40 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <p className="font-semibold text-foreground text-sm">5. crewBonus — бонус режиссёра/актёра (до +0.25)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Добавляется, если кандидат снят любимым режиссёром или содержит любимого актёра:
              </p>
              <Formula>
{`crewBonus = 0

if candidate.directors ∩ favDirectors ≠ ∅:
    crewBonus += 0.15     // режиссёр из «любимых»

if candidate.cast[0..4] ∩ favActors ≠ ∅:
    crewBonus += 0.10     // актёр из «любимых»

// Максимум: crewBonus = 0.25 (и режиссёр, и актёр)`}
              </Formula>
              <p className="text-muted-foreground text-xs">
                <code>favDirectors</code> и <code>favActors</code> — те, кто встретился в ≥ 2
                высоко оценённых фильмах (рейтинг ≥ 7).
              </p>
            </div>

            {/* Popularity Log */}
            <div className="border-l-2 border-muted-foreground/30 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="font-semibold text-foreground text-sm">6. popularityLog — логарифмический бонус (вес 0.05)</p>
              </div>
              <p className="text-foreground/70 text-sm">
                Небольшой бонус за широкую известность на платформе TMDB:
              </p>
              <Formula>
{`popularityLog = min( log₁₀(max(movie.popularity, 1)) / 3, 1 )
              × 0.05

// movie.popularity = 1    →  log₁₀(1)/3  = 0   →  +0.000
// movie.popularity = 10   →  log₁₀(10)/3 ≈ 0.33 →  +0.017
// movie.popularity = 100  →  log₁₀(100)/3 ≈ 0.67 → +0.033
// movie.popularity = 1000 →  log₁₀(1000)/3 = 1   →  +0.050 (max)`}
              </Formula>
            </div>
          </div>
        </Section>

        {/* 4. Filtering & Output */}
        <Section id="output" label="Этап 3б — Фильтрация и возврат" icon={Layers}>
          <p className="text-foreground/80 text-sm leading-relaxed">
            После подсчёта скора каждый кандидат проходит двойную проверку качества:
          </p>
          <Formula label="Порог допуска">
{`// Кандидат попадает в итоговый список только если:
finalScore  >= 0.45       // минимальный суммарный балл
AND
vote_average >= 5.5       // TMDB-рейтинг не ниже 5.5/10`}
          </Formula>
          <p className="text-foreground/70 text-sm mt-1">
            Прошедшие порог сортируются по <code>finalScore DESC</code>,
            возвращаются топ-20. Каждому фильму добавляется поле <code>_score</code> (0–100)
            для отладки в консоли Edge Function.
          </p>
          <Formula label="Сортировка и обрезка">
{`passed = scored.filter(s => s.finalScore >= 0.45 && voteAvg >= 5.5)
passed.sort((a, b) => b.finalScore - a.finalScore)
return passed.slice(0, 20).map(s => s.movie)`}
          </Formula>

          <h3 className="font-bold text-foreground text-sm mt-4">Холодный старт (0 фильмов в библиотеке)</h3>
          <p className="text-foreground/70 text-sm">
            Если библиотека пуста — профиль строить не из чего. В этом случае система
            возвращает глобальный топ TMDB:
          </p>
          <Formula>
{`if watched.length === 0:
    return tmdbFetch(/movie/popular?language=ru-RU).results.slice(0, 20)`}
          </Formula>
        </Section>

        {/* 5. Full example */}
        <Section id="example" label="Числовой пример" icon={Sparkles} accent>
          <p className="text-foreground/80 text-sm">
            Пользователь посмотрел три фильма:
          </p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Фильм</th>
                  <th className="py-2 pr-3 font-semibold">Жанры</th>
                  <th className="py-2 pr-3 font-semibold">Оценка</th>
                  <th className="py-2 font-semibold">Режиссёр</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">Тёмный рыцарь</td>
                  <td className="py-2 pr-3">Боевик, Триллер</td>
                  <td className="py-2 pr-3 text-primary font-bold">10/10</td>
                  <td className="py-2">Нолан</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-3">Интерстеллар</td>
                  <td className="py-2 pr-3">Драма, Фантастика</td>
                  <td className="py-2 pr-3 text-primary font-bold">9/10</td>
                  <td className="py-2">Нолан</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Матрица</td>
                  <td className="py-2 pr-3">Боевик, Фантастика</td>
                  <td className="py-2 pr-3 text-primary font-bold">8/10</td>
                  <td className="py-2">Вачовски</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-foreground text-sm mt-4">Шаг 1 — genreScores (сырые)</h3>
          <Formula>
{`Боевик:    score = 10/10 + 8/10 = 1.0 + 0.8 = 1.8,  count = 2
Триллер:   score = 10/10         = 1.0,             count = 1
Драма:     score = 9/10          = 0.9,              count = 1
Фантастика:score = 9/10 + 8/10   = 0.9 + 0.8 = 1.7, count = 2`}
          </Formula>

          <h3 className="font-bold text-foreground text-sm mt-3">Шаг 1б — genreWeights (нормализованные)</h3>
          <Formula>
{`maxGenreScore = 1.8 (Боевик)

genreWeight[Боевик]     = 1.8 / 1.8 = 1.000
genreWeight[Фантастика] = 1.7 / 1.8 = 0.944
genreWeight[Триллер]    = 1.0 / 1.8 = 0.556
genreWeight[Драма]      = 0.9 / 1.8 = 0.500`}
          </Formula>

          <h3 className="font-bold text-foreground text-sm mt-3">Шаг 1в — favDirectors</h3>
          <Formula>
{`// Оценка >= 7 у всех трёх → считаем режиссёров
directorCounts = { "Нолан": 2, "Вачовски": 1 }

// Порог >= 2 → favDirectors = { "Нолан" }`}
          </Formula>

          <h3 className="font-bold text-foreground text-sm mt-4">
            Шаг 3 — Скоринг кандидата «Начало» (Inception)
          </h3>
          <p className="text-foreground/70 text-xs mb-2">
            Жанры: Боевик + Фантастика + Триллер | vote_average: 8.4 | vote_count: 35,000 | Режиссёр: Нолан
          </p>
          <Formula>
{`genreMatch     = (1.000 + 0.944 + 0.556) / 3 = 0.833
sourceWeight   = 10 / 10 = 1.000               // из топ фильма (Тёмный рыцарь)
popularity     = 8.4 / 10 = 0.840
voteConfidence = min(35000 / 100, 1) = 1.000
crewBonus      = 0.15                           // Нолан в favDirectors
popularityLog  = min(log₁₀(350)/3, 1) × 0.05
               ≈ min(0.85, 1) × 0.05 = 0.043

finalScore = 0.833×0.35 + 1.000×0.20 + 0.840×0.20
           + 1.000×0.10 + 0.15 + 0.043

           = 0.292 + 0.200 + 0.168 + 0.100 + 0.150 + 0.043

           = 0.953  →  _score = 95`}
          </Formula>
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mt-1">
            <p className="text-primary text-sm font-semibold">
              finalScore = 0.953 ≥ 0.45 ✓  |  vote_average = 8.4 ≥ 5.5 ✓
            </p>
            <p className="text-primary/70 text-xs mt-0.5">
              «Начало» попадает в топ рекомендаций с баллом 95/100.
            </p>
          </div>
        </Section>

        {/* 6. Variables Reference */}
        <Section id="reference" label="Справочник переменных" icon={Layers}>
          <div className="divide-y divide-border/50">
            <Row k="watched[]"        v="Массив записей из KV: { movieId, rating, review, addedAt }" />
            <Row k="genreScores{}"    v="Словарь { genreId → { score, name, count } } — сырые жанровые баллы" />
            <Row k="genreWeights{}"   v="Словарь { genreId → [0..1] } — нормализованные веса" />
            <Row k="directorCounts{}" v="Частота режиссёра среди фильмов с рейтингом ≥ 7" />
            <Row k="actorCounts{}"    v="Частота актёра (топ-5 каста) среди фильмов с рейтингом ≥ 7" />
            <Row k="favDirectors"     v="Set режиссёров с частотой ≥ 2 в высоко оценённых фильмах" />
            <Row k="favActors"        v="Set актёров с частотой ≥ 2 в высоко оценённых фильмах" />
            <Row k="topRated[8]"      v="Топ-8 фильмов из watched[], отсортированных по рейтингу пользователя" />
            <Row k="candidateMap{}"   v="Map { movieId → { movie, sourceRating } } — кандидаты без дублей" />
            <Row k="creditMap{}"      v="Map { movieId → TMDB detail+credits } — для первых 60 кандидатов" />
            <Row k="finalScore"       v="Взвешенная сумма всех компонент ∈ [0, ~1.05] (может превысить 1 из-за crewBonus)" highlight />
            <Row k="_score"           v="finalScore × 100, округлённое — отладочное поле в ответе TMDB" />
          </div>
        </Section>

        {/* 7. Limitations */}
        <Section id="limits" label="Ограничения и улучшения" icon={AlertCircle}>
          <div className="space-y-3">
            {[
              {
                title: "Только Content-Based",
                desc: "Нет Collaborative Filtering — алгоритм не учитывает вкусы других пользователей. Пользователи с нестандартными вкусами получат качественные рекомендации, т.к. они персонализированы полностью.",
                color: "orange" as const,
              },
              {
                title: "Первое вхождение в candidateMap",
                desc: "Если один кандидат появился из нескольких источников — используется sourceRating первого. Идеально было бы взять sourceRating от наиболее высоко оценённого источника.",
                color: "orange" as const,
              },
              {
                title: "Холодный старт",
                desc: "При пустой библиотеке возвращается global popular — нет персонализации. Решение: онбординг с выбором любимых жанров.",
                color: "red" as const,
              },
              {
                title: "Ограничение 60 кандидатов на credits",
                desc: "Только первые 60 кандидатов обогащаются credits для crewBonus. Остальные получают crewBonus = 0.",
                color: "default" as const,
              },
              {
                title: "voteConfidence насыщается быстро",
                desc: "Порог насыщения = 100 голосов. Фильм с 100 голосами и фильм с 100,000 голосами получат одинаковый voteConfidence = 1.0.",
                color: "default" as const,
              },
            ].map(({ title, desc, color }) => (
              <div key={title} className="flex gap-3 bg-muted rounded-xl p-3 border border-border">
                <Badge color={color}>{title}</Badge>
                <p className="text-foreground/70 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <p className="text-center text-muted-foreground/40 text-xs pt-4">
          qaradakor.kz — алгоритм рекомендаций v1 · /supabase/functions/server/index.tsx
        </p>
      </div>
    </div>
  );
}