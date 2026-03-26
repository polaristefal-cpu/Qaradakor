import { useState } from "react";

type Tab = "architecture" | "auth" | "datamodel" | "routes" | "api";

// ── Shared primitives ────────────────────────────────────────────────────────

function Box({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`border border-foreground/30 rounded ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Arrow({ label, dir = "down" }: { label?: string; dir?: "down" | "right" | "left" }) {
  if (dir === "down")
    return (
      <div className="flex flex-col items-center gap-0.5 py-1">
        {label && <span className="text-[10px] text-foreground/50 uppercase tracking-widest">{label}</span>}
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-foreground/40" />
          <div
            className="w-0 h-0"
            style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid currentColor", opacity: 0.5 }}
          />
        </div>
      </div>
    );
  if (dir === "right")
    return (
      <div className="flex items-center gap-0.5 px-1">
        {label && <span className="text-[10px] text-foreground/50 uppercase tracking-widest">{label}</span>}
        <div className="flex items-center">
          <div className="h-px w-5 bg-foreground/40" />
          <div
            className="w-0 h-0"
            style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid currentColor", opacity: 0.5 }}
          />
        </div>
      </div>
    );
  return null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 mb-2 font-mono">
      {children}
    </div>
  );
}

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "admin" | "public" | "protected" | "auth" }) {
  const cls: Record<string, string> = {
    default: "border-foreground/20 text-foreground/60",
    admin: "border-foreground/60 text-foreground/80 bg-foreground/5",
    public: "border-foreground/20 text-foreground/50",
    protected: "border-foreground/40 text-foreground/70",
    auth: "border-foreground/30 text-foreground/60",
  };
  return (
    <span className={`border rounded px-1.5 py-0.5 text-[10px] font-mono ${cls[variant]}`}>
      {children}
    </span>
  );
}

// ── Tab 1 — System Architecture ──────────────────────────────────────────────

function ArchitectureDiagram() {
  return (
    <div className="flex flex-col items-center gap-0 w-full max-w-3xl mx-auto select-none">
      {/* FRONTEND */}
      <Box className="w-full p-4">
        <SectionLabel>① Frontend — React + Vite + Tailwind CSS</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { title: "Router (react-router)", items: ["OpenLayout", "ProtectedLayout", "AdminLayout", "NeutralLayout"] },
            { title: "Pages (30+)", items: ["Home, Search, Movie", "TV, Person", "Library, Watchlist", "Friends, Profile", "Collections, AI", "Admin dashboard"] },
            { title: "Contexts", items: ["AuthContext", "ThemeContext", "LangContext", "SidebarContext", "UserDataContext"] },
            { title: "API lib (api.ts)", items: ["tmdbFetch()", "watched CRUD", "watchlist CRUD", "friends CRUD", "admin calls"] },
          ].map((col) => (
            <div key={col.title} className="border border-foreground/10 rounded p-2">
              <div className="text-[10px] font-mono text-foreground/70 mb-1 border-b border-foreground/10 pb-1">{col.title}</div>
              {col.items.map((i) => (
                <div key={i} className="text-[10px] text-foreground/50 leading-relaxed">• {i}</div>
              ))}
            </div>
          ))}
        </div>
      </Box>

      <Arrow label="HTTPS / JWT" dir="down" />

      {/* EDGE FUNCTIONS */}
      <Box className="w-full p-4 border-foreground/50">
        <SectionLabel>② Backend — Supabase Edge Function (Deno + Hono)</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { title: "Auth module", items: ["POST /signup", "OTP send/verify", "Admin bootstrap", "Toggle-admin"] },
            { title: "TMDB Proxy", items: ["GET /tmdb/*", "Movies, TV, Person", "Search, Trending", "Recommendations"] },
            { title: "User data", items: ["watched CRUD", "watchlist CRUD", "friends system", "profile & avatar"] },
            { title: "AI & Admin", items: ["POST /ai/chat", "GET /ai/recommend", "GET /admin/users", "GET /reviews/global"] },
          ].map((col) => (
            <div key={col.title} className="border border-foreground/10 rounded p-2">
              <div className="text-[10px] font-mono text-foreground/70 mb-1 border-b border-foreground/10 pb-1">{col.title}</div>
              {col.items.map((i) => (
                <div key={i} className="text-[10px] text-foreground/50 leading-relaxed">• {i}</div>
              ))}
            </div>
          ))}
        </div>
      </Box>

      {/* Two branches */}
      <div className="w-full flex justify-center">
        <div className="w-full flex">
          <div className="flex-1 flex flex-col items-center">
            <Arrow label="Supabase SDK" dir="down" />
          </div>
          <div className="flex-1 flex flex-col items-center">
            <Arrow label="REST API" dir="down" />
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Supabase */}
        <Box className="p-4">
          <SectionLabel>③ Supabase (Database + Auth + Storage)</SectionLabel>
          <div className="space-y-2">
            <div className="border border-foreground/10 rounded p-2">
              <div className="text-[10px] font-mono text-foreground/70 mb-1">auth.users (built-in)</div>
              <div className="text-[10px] text-foreground/50">id, email, encrypted_password</div>
              <div className="text-[10px] text-foreground/50">phone, user_metadata, created_at</div>
            </div>
            <div className="border border-foreground/10 rounded p-2">
              <div className="text-[10px] font-mono text-foreground/70 mb-1">kv_store_59141208 (KV table)</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  "user:{id}:profile",
                  "user:{id}:watched",
                  "user:{id}:watchlist",
                  "user:{id}:friends",
                  "user:{id}:friend_requests",
                  "user:{id}:is_admin",
                  "reviews:global",
                  "otp:{phone}",
                  "admins:list",
                  "collections:{id}",
                ].map((k) => (
                  <div key={k} className="text-[9px] text-foreground/40 font-mono">• {k}</div>
                ))}
              </div>
            </div>
            <div className="border border-foreground/10 rounded p-2">
              <div className="text-[10px] font-mono text-foreground/70 mb-1">Storage Bucket</div>
              <div className="text-[10px] text-foreground/50">make-59141208-avatars (private)</div>
            </div>
          </div>
        </Box>

        {/* External APIs */}
        <Box className="p-4">
          <SectionLabel>④ External APIs</SectionLabel>
          <div className="space-y-2">
            {[
              {
                name: "TMDB API",
                url: "api.themoviedb.org/3",
                items: ["Movies, TV Shows, Persons", "Search, Trending, Popular", "Recommendations, Credits"],
              },
              {
                name: "OpenAI API",
                url: "api.openai.com/v1",
                items: ["AI Chat (GPT model)", "Movie recommendations", "Smart suggestions"],
              },
              {
                name: "Wazzup API (Primary OTP)",
                url: "api.wazzup24.com/v3",
                items: ["WhatsApp OTP delivery", "Channel: ac9fd2e0-..."],
              },
              {
                name: "Mobizon API (Fallback OTP)",
                url: "api.mobizon.kz",
                items: ["SMS OTP delivery", "Kazakhstan numbers"],
              },
            ].map((api) => (
              <div key={api.name} className="border border-foreground/10 rounded p-2">
                <div className="text-[10px] font-mono text-foreground/70 mb-0.5">{api.name}</div>
                <div className="text-[9px] text-foreground/30 font-mono mb-1">{api.url}</div>
                {api.items.map((i) => (
                  <div key={i} className="text-[10px] text-foreground/50">• {i}</div>
                ))}
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  );
}

// ── Tab 2 — Auth Flow ─────────────────────────────────────────────────────────

function AuthFlow() {
  const steps = [
    {
      id: "A1",
      title: "Регистрация (POST /signup)",
      desc: "email + password + name → Supabase Admin createUser → KV: user:{id}:profile",
      alt: null,
    },
    {
      id: "A2",
      title: "Вход (Supabase Auth)",
      desc: "signInWithPassword(email, password) → JWT session token",
      alt: null,
    },
    {
      id: "A3",
      title: "2FA / OTP — запрос кода",
      desc: "POST /otp/send → генерация 6-значного кода → KV: otp:{phone}",
      alt: "OTP отправляется через WhatsApp (Wazzup) ИЛИ SMS (Mobizon fallback)",
    },
    {
      id: "A4",
      title: "Wazzup WhatsApp (Primary)",
      desc: "POST api.wazzup24.com/v3/message → chatId = phone → text: 'Qaradakor.kz: код *{code}*'",
      alt: "Если успех → channel: 'whatsapp'",
    },
    {
      id: "A5",
      title: "Mobizon SMS (Fallback)",
      desc: "GET api.mobizon.kz/SendSmsMessage → recipient={phone} → text={код}",
      alt: "Если Wazzup упал или вернул ошибку → channel: 'sms'",
    },
    {
      id: "A6",
      title: "Верификация OTP (POST /otp/verify)",
      desc: "Проверка code == stored.code && Date.now() < expiresAt → удаление KV-записи",
      alt: null,
    },
    {
      id: "A7",
      title: "Активная сессия",
      desc: "session.access_token передаётся в заголовке x-user-token ко всем Edge Function запросам",
      alt: null,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 text-[11px] text-foreground/50 font-mono border border-foreground/10 rounded p-3">
        Токен сессии передаётся через заголовок <span className="text-foreground/80">x-user-token</span> (НЕ Authorization), 
        поскольку Authorization зарезервирован шлюзом Supabase
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-foreground/15" />

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-4 group">
              {/* Node */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-12 h-12 border border-foreground/40 rounded-full flex items-center justify-center bg-background text-[10px] font-mono text-foreground/60">
                  {step.id}
                </div>
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="border border-foreground/15 rounded p-3 group-hover:border-foreground/30 transition-colors">
                  <div className="text-[11px] font-mono text-foreground/80 mb-1">{step.title}</div>
                  <div className="text-[10px] text-foreground/50">{step.desc}</div>
                  {step.alt && (
                    <div className="mt-1.5 text-[9px] text-foreground/35 italic border-t border-foreground/10 pt-1.5">
                      {step.alt}
                    </div>
                  )}
                </div>

                {/* OTP branch for A3 */}
                {step.id === "A3" && (
                  <div className="ml-4 mt-1 flex gap-2 items-start">
                    <div className="flex flex-col items-center">
                      <div className="h-4 w-px bg-foreground/20" />
                      <div className="flex gap-8">
                        <div className="h-4 w-px bg-foreground/20" />
                        <div className="h-4 w-px bg-foreground/20" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin check flow */}
      <div className="mt-4">
        <div className="border-t border-foreground/10 pt-4">
          <SectionLabel>Проверка прав администратора</SectionLabel>
          <div className="flex flex-col gap-2">
            {[
              "GET /admin/check → читает KV: admins:list",
              "Проверяет user.id ∈ admins:list",
              "Если нет записей → /admin/bootstrap доступен любому авторизованному",
              "После bootstrap → user добавляется в admins:list + user:{id}:is_admin = true",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 flex-shrink-0 border border-foreground/20 rounded flex items-center justify-center text-[9px] font-mono text-foreground/40">
                  {i + 1}
                </div>
                <div className="text-[10px] text-foreground/60 font-mono pt-0.5">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3 — Data Model ────────────────────────────────────────────────────────

function DataModelDiagram() {
  const kvKeys = [
    {
      key: "user:{id}:profile",
      type: "object",
      fields: [
        { name: "name", type: "string" },
        { name: "email", type: "string" },
        { name: "phone?", type: "string" },
        { name: "avatarUrl?", type: "string" },
      ],
    },
    {
      key: "user:{id}:watched",
      type: "array",
      fields: [
        { name: "movieId", type: "number" },
        { name: "rating", type: "number | null" },
        { name: "review", type: "string | null" },
        { name: "movieTitle", type: "string" },
        { name: "posterPath", type: "string | null" },
        { name: "mediaType", type: "'movie' | 'tv'" },
        { name: "addedAt", type: "ISO string" },
      ],
    },
    {
      key: "user:{id}:watchlist",
      type: "array",
      fields: [
        { name: "movieId", type: "number" },
        { name: "title", type: "string" },
        { name: "poster_path", type: "string | null" },
        { name: "release_date", type: "string" },
        { name: "vote_average", type: "number" },
        { name: "mediaType", type: "'movie' | 'tv'" },
        { name: "addedAt", type: "ISO string" },
      ],
    },
    {
      key: "user:{id}:friends",
      type: "array<userId>",
      fields: [{ name: "userId", type: "string (UUID)" }],
    },
    {
      key: "user:{id}:friend_requests",
      type: "array",
      fields: [
        { name: "fromId", type: "string (UUID)" },
        { name: "fromName", type: "string" },
        { name: "fromEmail", type: "string" },
      ],
    },
    {
      key: "user:{id}:is_admin",
      type: "boolean",
      fields: [{ name: "value", type: "true | false" }],
    },
    {
      key: "reviews:global",
      type: "array (max 1000)",
      fields: [
        { name: "id", type: "string (userId_type_movieId)" },
        { name: "userId", type: "string" },
        { name: "userName", type: "string" },
        { name: "movieId", type: "number" },
        { name: "movieTitle", type: "string" },
        { name: "rating", type: "number" },
        { name: "review", type: "string" },
        { name: "createdAt", type: "ISO string" },
        { name: "likes", type: "number" },
      ],
    },
    {
      key: "otp:{phone}",
      type: "object (TTL 5 min)",
      fields: [
        { name: "code", type: "string (6 digits)" },
        { name: "expiresAt", type: "timestamp ms" },
      ],
    },
    {
      key: "admins:list",
      type: "array",
      fields: [
        { name: "userId", type: "string (UUID)" },
        { name: "email", type: "string" },
        { name: "addedAt", type: "ISO string" },
      ],
    },
  ];

  return (
    <div className="w-full">
      {/* auth.users */}
      <div className="mb-6">
        <Box className="p-4 border-foreground/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] uppercase tracking-widest font-mono text-foreground/40">Supabase Auth</div>
            <div className="flex-1 h-px bg-foreground/10" />
            <Tag variant="auth">auth.users</Tag>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { col: "id", type: "uuid PK" },
              { col: "email", type: "varchar UNIQUE" },
              { col: "encrypted_password", type: "text" },
              { col: "phone", type: "varchar UNIQUE" },
              { col: "user_metadata", type: "jsonb" },
              { col: "created_at", type: "timestamptz" },
              { col: "last_sign_in_at", type: "timestamptz" },
              { col: "confirmed_at", type: "timestamptz" },
            ].map((f) => (
              <div key={f.col} className="flex items-baseline gap-1.5 border border-foreground/10 rounded px-2 py-1">
                <span className="text-[10px] font-mono text-foreground/70">{f.col}</span>
                <span className="text-[9px] text-foreground/30">{f.type}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[9px] text-foreground/30 font-mono">
            ⚠ Таблица public.users отсутствует. Вся пользовательская информация хранится в KV-хранилище.
          </div>
        </Box>
      </div>

      <Arrow label="KV-ключи" dir="down" />

      {/* KV store */}
      <Box className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[10px] uppercase tracking-widest font-mono text-foreground/40">KV Store</div>
          <div className="flex-1 h-px bg-foreground/10" />
          <Tag>kv_store_59141208</Tag>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {kvKeys.map((kv) => (
            <div key={kv.key} className="border border-foreground/10 rounded p-2">
              <div className="flex items-start gap-1 mb-1.5">
                <div className="text-[10px] font-mono text-foreground/80 break-all leading-tight">{kv.key}</div>
              </div>
              <div className="text-[9px] text-foreground/30 font-mono mb-1.5 border-b border-foreground/10 pb-1">
                [{kv.type}]
              </div>
              {kv.fields.map((f) => (
                <div key={f.name} className="flex items-baseline gap-1.5">
                  <span className="text-[9px] font-mono text-foreground/60">{f.name}</span>
                  <span className="text-[8px] text-foreground/25">{f.type}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Box>
    </div>
  );
}

// ── Tab 4 — Route Map ─────────────────────────────────────────────────────────

function RouteMap() {
  const groups = [
    {
      label: "NeutralLayout",
      desc: "Загрузка не блокирует навигацию",
      tag: "auth" as const,
      routes: [{ path: "/login", page: "LoginPage", note: "email/pass + 2FA OTP" }],
    },
    {
      label: "PublicLayout",
      desc: "Только для гостей (если авторизован → /)",
      tag: "public" as const,
      routes: [{ path: "/register", page: "RegisterPage", note: "Создание аккаунта" }],
    },
    {
      label: "OpenLayout",
      desc: "Доступно всем (гости и пользователи)",
      tag: "public" as const,
      routes: [
        { path: "/", page: "HomePage", note: "Главная, тренды" },
        { path: "/search", page: "SearchPage", note: "Поиск фильмов/сериалов" },
        { path: "/movie/:id", page: "MovieDetailPage", note: "Детали фильма" },
        { path: "/tv/:id", page: "TVDetailPage", note: "Детали сериала" },
        { path: "/person/:id", page: "PersonPage", note: "Страница персоны" },
        { path: "/collections", page: "CollectionsPage", note: "Все коллекции" },
        { path: "/collections/:id", page: "CollectionDetailPage", note: "Детали коллекции" },
        { path: "/diploma", page: "DiplomaDownloadPage", note: "Диплом для скачивания" },
      ],
    },
    {
      label: "ProtectedLayout",
      desc: "Только авторизованные пользователи",
      tag: "protected" as const,
      routes: [
        { path: "/library", page: "LibraryPage", note: "Просмотренные фильмы" },
        { path: "/watchlist", page: "WatchlistPage", note: "Буду смотреть" },
        { path: "/recommendations", page: "RecommendationsPage", note: "Рекомендации" },
        { path: "/friends", page: "FriendsPage", note: "Список друзей" },
        { path: "/friends/:id", page: "FriendProfilePage", note: "Профиль друга" },
        { path: "/ai", page: "AiChatPage", note: "AI-чат о фильмах" },
        { path: "/profile", page: "ProfilePage", note: "Мой профиль" },
        { path: "/my-collection", page: "MyCollectionPage", note: "Мои коллекции" },
        { path: "/ai-recommendations", page: "AiRecommendationsPage", note: "AI-рекомендации" },
        { path: "/admin/bootstrap", page: "AdminBootstrapPage", note: "Первый admin-доступ" },
        { path: "/admin/check", page: "AdminCheckPage", note: "Список администраторов" },
      ],
    },
    {
      label: "AdminLayout",
      desc: "Только администраторы (проверка через KV: admins:list)",
      tag: "admin" as const,
      routes: [
        { path: "/admin/dashboard", page: "AdminDashboardPage", note: "Обзор системы" },
        { path: "/admin/users", page: "AdminUsersPage", note: "Управление пользователями" },
        { path: "/admin/user-search", page: "AdminUserSearchPage", note: "Быстрый поиск" },
        { path: "/admin/collections", page: "AdminCollectionsPage", note: "Коллекции" },
        { path: "/admin/content", page: "AdminContentPage", note: "Контент" },
        { path: "/admin/analytics", page: "AdminAnalyticsPage", note: "Аналитика" },
        { path: "/admin/settings", page: "AdminSettingsPage", note: "Настройки" },
      ],
    },
  ];

  const tagColors: Record<string, string> = {
    auth: "border-foreground/30",
    public: "border-foreground/15",
    protected: "border-foreground/40",
    admin: "border-foreground/60",
  };

  return (
    <div className="w-full space-y-4">
      {groups.map((group) => (
        <Box key={group.label} className={`p-4 ${tagColors[group.tag]}`}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant={group.tag}>{group.label}</Tag>
            <span className="text-[10px] text-foreground/40">{group.desc}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {group.routes.map((r) => (
              <div key={r.path} className="flex items-start gap-2 border border-foreground/8 rounded px-2 py-1.5">
                <code className="text-[10px] font-mono text-foreground/70 flex-shrink-0">{r.path}</code>
                <span className="text-[9px] text-foreground/30 flex-shrink-0">→</span>
                <span className="text-[9px] font-mono text-foreground/50">{r.page}</span>
                <span className="text-[9px] text-foreground/30 ml-auto flex-shrink-0">{r.note}</span>
              </div>
            ))}
          </div>
        </Box>
      ))}
    </div>
  );
}

// ── Tab 5 — API Endpoints ─────────────────────────────────────────────────────

function ApiEndpoints() {
  const base = "/make-server-59141208";

  const groups = [
    {
      title: "System",
      endpoints: [
        { method: "GET", path: "/health", auth: false, desc: "Проверка состояния сервера" },
      ],
    },
    {
      title: "Auth",
      endpoints: [
        { method: "POST", path: "/signup", auth: false, desc: "Создание аккаунта (email + password + name)" },
        { method: "POST", path: "/otp/send", auth: true, desc: "Отправка OTP (WhatsApp → SMS fallback)" },
        { method: "POST", path: "/otp/verify", auth: true, desc: "Верификация OTP-кода" },
      ],
    },
    {
      title: "TMDB Proxy",
      endpoints: [
        { method: "GET", path: "/tmdb/*", auth: false, desc: "Прокси ко всему TMDB API (фильмы, сериалы, поиск, тренды)" },
      ],
    },
    {
      title: "Library (Watched)",
      endpoints: [
        { method: "GET", path: "/watched", auth: true, desc: "Список просмотренных" },
        { method: "POST", path: "/watched", auth: true, desc: "Добавить/обновить (movieId, rating, review)" },
        { method: "DELETE", path: "/watched/:movieId", auth: true, desc: "Удалить из просмотренных" },
      ],
    },
    {
      title: "Watchlist",
      endpoints: [
        { method: "GET", path: "/watchlist", auth: true, desc: "Список «буду смотреть»" },
        { method: "POST", path: "/watchlist", auth: true, desc: "Добавить в список" },
        { method: "DELETE", path: "/watchlist/:movieId", auth: true, desc: "Удалить из списка" },
      ],
    },
    {
      title: "Friends",
      endpoints: [
        { method: "GET", path: "/friends", auth: true, desc: "Список друзей с профилями" },
        { method: "POST", path: "/friends/request", auth: true, desc: "Отправить заявку (по email)" },
        { method: "GET", path: "/friends/requests", auth: true, desc: "Входящие заявки" },
        { method: "POST", path: "/friends/accept", auth: true, desc: "Принять заявку" },
        { method: "POST", path: "/friends/reject", auth: true, desc: "Отклонить заявку" },
        { method: "DELETE", path: "/friends/:friendId", auth: true, desc: "Удалить из друзей" },
        { method: "GET", path: "/friends/:friendId/watched", auth: true, desc: "Просмотренные друга" },
      ],
    },
    {
      title: "Profile & Avatar",
      endpoints: [
        { method: "GET", path: "/profile", auth: true, desc: "Мой профиль (из KV)" },
        { method: "PUT", path: "/profile", auth: true, desc: "Обновить профиль (name, phone)" },
        { method: "POST", path: "/profile/avatar", auth: true, desc: "Загрузить аватар → Storage Bucket" },
        { method: "GET", path: "/users/:userId/profile", auth: false, desc: "Публичный профиль пользователя" },
      ],
    },
    {
      title: "Collections",
      endpoints: [
        { method: "GET", path: "/collections", auth: false, desc: "Все коллекции" },
        { method: "POST", path: "/collections", auth: true, desc: "Создать коллекцию" },
        { method: "GET", path: "/collections/:id", auth: false, desc: "Детали коллекции" },
        { method: "PUT", path: "/collections/:id", auth: true, desc: "Обновить коллекцию" },
        { method: "DELETE", path: "/collections/:id", auth: true, desc: "Удалить коллекцию" },
      ],
    },
    {
      title: "Reviews",
      endpoints: [
        { method: "GET", path: "/reviews/global", auth: false, desc: "Глобальный список отзывов" },
        { method: "POST", path: "/reviews/:reviewId/like", auth: true, desc: "Лайк отзыва" },
      ],
    },
    {
      title: "AI",
      endpoints: [
        { method: "POST", path: "/ai/chat", auth: true, desc: "AI-чат о фильмах (OpenAI)" },
        { method: "POST", path: "/ai/recommend", auth: true, desc: "AI-рекомендации по вкусам" },
      ],
    },
    {
      title: "Admin",
      endpoints: [
        { method: "GET", path: "/admin/check", auth: true, desc: "Проверка статуса администратора" },
        { method: "POST", path: "/admin/bootstrap", auth: true, desc: "Получить права первого администратора" },
        { method: "GET", path: "/admin/users", auth: true, desc: "Список всех пользователей (admin only)" },
        { method: "POST", path: "/admin/users/:userId/toggle-admin", auth: true, desc: "Выдать/забрать права admin" },
      ],
    },
  ];

  const methodColor: Record<string, string> = {
    GET: "text-foreground/70",
    POST: "text-foreground/80",
    PUT: "text-foreground/70",
    DELETE: "text-foreground/50",
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-[10px] font-mono text-foreground/30 border border-foreground/10 rounded px-3 py-2">
        Base URL: <span className="text-foreground/60">https://ozqwuskwusqsghkvqdux.supabase.co/functions/v1/server</span>
        &nbsp;+&nbsp;<span className="text-foreground/60">{base}</span>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-foreground/30 mb-1.5">{group.title}</div>
          <div className="border border-foreground/10 rounded overflow-hidden">
            {group.endpoints.map((ep, i) => (
              <div
                key={ep.path + ep.method}
                className={`flex items-start gap-3 px-3 py-2 ${i > 0 ? "border-t border-foreground/8" : ""} hover:bg-foreground/3 transition-colors`}
              >
                <span className={`text-[10px] font-mono w-12 flex-shrink-0 ${methodColor[ep.method]}`}>{ep.method}</span>
                <code className="text-[10px] font-mono text-foreground/60 flex-shrink-0">{base}{ep.path}</code>
                <span className="text-[9px] text-foreground/35 flex-1">{ep.desc}</span>
                <span className="text-[8px] font-mono flex-shrink-0">
                  {ep.auth ? (
                    <span className="text-foreground/50 border border-foreground/20 rounded px-1">🔒 auth</span>
                  ) : (
                    <span className="text-foreground/25 border border-foreground/10 rounded px-1">public</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; en: string }[] = [
  { id: "architecture", label: "Архитектура", en: "Architecture" },
  { id: "auth", label: "Auth Flow", en: "Auth Flow" },
  { id: "datamodel", label: "Модель данных", en: "Data Model" },
  { id: "routes", label: "Маршруты", en: "Route Map" },
  { id: "api", label: "API", en: "API Endpoints" },
];

export function UmlDiagramPage() {
  const [active, setActive] = useState<Tab>("architecture");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-5">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/30">qaradakor.kz</span>
              <span className="text-foreground/15">·</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/30">UML / System Diagram</span>
            </div>
            <h1 className="font-mono mt-0.5">Диаграмма системы</h1>
            <p className="text-[11px] text-foreground/40 mt-1 font-mono">
              Полная архитектура приложения — React · Supabase Edge Functions · TMDB · OpenAI · Wazzup · Mobizon
            </p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest">Stack</div>
            {["React 18", "Hono (Deno)", "Supabase", "i18n: RU/EN/KZ"].map((s) => (
              <div key={s} className="text-[9px] font-mono text-foreground/40 border border-foreground/10 rounded px-1.5 py-0.5">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-foreground/10 px-6 flex gap-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-[11px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/35 hover:text-foreground/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-5xl">
        {active === "architecture" && <ArchitectureDiagram />}
        {active === "auth" && <AuthFlow />}
        {active === "datamodel" && <DataModelDiagram />}
        {active === "routes" && <RouteMap />}
        {active === "api" && <ApiEndpoints />}
      </div>

      {/* Footer legend */}
      <div className="border-t border-foreground/10 px-6 py-4 flex flex-wrap gap-4 items-center">
        <span className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest">Legend</span>
        {[
          { label: "Public", tag: "public" as const },
          { label: "Authenticated", tag: "protected" as const },
          { label: "Admin only", tag: "admin" as const },
          { label: "Auth flow", tag: "auth" as const },
        ].map((l) => (
          <Tag key={l.label} variant={l.tag}>{l.label}</Tag>
        ))}
        <span className="text-[9px] font-mono text-foreground/20 ml-auto">
          Сгенерировано: 2026-03-26
        </span>
      </div>
    </div>
  );
}
