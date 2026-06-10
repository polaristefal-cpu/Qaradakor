# Correct diagrams for Qaradakor.kz

Эти диаграммы построены на основе фактических файлов проекта:

- `src/app/routes.tsx`
- `src/app/lib/api.ts`
- `supabase/functions/server/index.tsx`
- `supabase/functions/server/kv_store.tsx`

Текущая страница `/uml` в приложении в целом полезная, но содержит неточности:

- Использует несуществующий endpoint `/ai/recommend`.
- В Auth Flow указаны `/otp/send` и `/otp/verify`, но в коде реальные маршруты находятся в `/auth/...`.
- В админской модели указан `admins:list`, но фактически admin-флаг хранится в `user:{id}:profile.is_admin`.
- Base URL местами указан неточно.
- Модель данных не включает часть фактических ключей KV.

## Figure 3.1 - Overall architecture of Qaradakor.kz

```mermaid
flowchart TB
    U["User Browser"] --> FE["React SPA / Vite"]

    subgraph FEAPP["Frontend"]
        R["React Router"]
        C["Contexts: Auth, Theme, Lang, Sidebar, UserData"]
        P["Pages: Home, Search, Movie, TV, Library, Friends, AI, Collections, Admin"]
        API["API client: src/app/lib/api.ts"]
    end

    FE --> R
    R --> P
    P --> C
    P --> API

    API -->|"Authorization: public anon key"| EDGE["Supabase Edge Function / Hono"]
    API -->|"x-user-token: session JWT"| EDGE

    subgraph BE["Backend: supabase/functions/server/index.tsx"]
        AUTH["Auth and OTP endpoints"]
        TMDBP["TMDB proxy: /tmdb/*"]
        LIB["Watched and Watchlist CRUD"]
        SOCIAL["Friends, Reviews, Collections"]
        REC["Recommendation engine: /recommendations"]
        AI["AI endpoints: /ai/chat, /ai/explain, /ai/analyze-review"]
        ADMIN["Admin endpoints"]
    end

    EDGE --> AUTH
    EDGE --> TMDBP
    EDGE --> LIB
    EDGE --> SOCIAL
    EDGE --> REC
    EDGE --> AI
    EDGE --> ADMIN

    AUTH --> SAUTH["Supabase Auth"]
    LIB --> KV["Supabase KV Store"]
    SOCIAL --> KV
    REC --> KV
    ADMIN --> KV
    AUTH --> KV

    EDGE --> STORAGE["Supabase Storage: avatars"]

    TMDBP --> TMDB["TMDB API"]
    REC --> TMDB
    AI --> OPENAI["OpenAI API"]
    AUTH --> WAZZUP["Wazzup WhatsApp OTP"]
    AUTH --> MOBIZON["Mobizon SMS fallback"]
```

Recommended text:

```text
Figure 3.1 shows the overall architecture of the Qaradakor.kz platform. The frontend is implemented as a React single-page application and communicates with a Supabase Edge Function through a centralized API client. The backend function is built with Hono and contains modules for authentication, TMDB proxying, user library management, social functionality, recommendations, AI features and administration. Persistent user data is stored in Supabase Auth, Supabase Storage and a PostgreSQL-based KV store, while external functionality is provided through TMDB, OpenAI, Wazzup and Mobizon APIs.
```

## Figure 3.2 - Data storage model

```mermaid
erDiagram
    SUPABASE_AUTH_USER ||--|| USER_PROFILE : "has"
    SUPABASE_AUTH_USER ||--o{ WATCHED_ITEM : "stores"
    SUPABASE_AUTH_USER ||--o{ WATCHLIST_ITEM : "stores"
    SUPABASE_AUTH_USER ||--o{ FRIEND_RELATION : "has"
    SUPABASE_AUTH_USER ||--o{ FRIEND_REQUEST : "receives"
    SUPABASE_AUTH_USER ||--o{ COLLECTION : "creates"
    SUPABASE_AUTH_USER ||--o{ REVIEW : "writes"

    USER_PROFILE {
        string key "user:{id}:profile"
        string name
        string email
        string phone
        boolean twofa_enabled
        boolean is_admin
        boolean is_blocked
    }

    WATCHED_ITEM {
        string key "user:{id}:watched"
        number movieId
        number rating
        string review
        string movieTitle
        string posterPath
        string mediaType
        string addedAt
    }

    WATCHLIST_ITEM {
        string key "user:{id}:watchlist"
        number movieId
        string title
        string poster_path
        string release_date
        number vote_average
        string mediaType
        string addedAt
    }

    REVIEW {
        string key "reviews:global"
        string id
        string userId
        number movieId
        string movieTitle
        number rating
        string review
        number likes
        string createdAt
    }

    COLLECTION {
        string key "coll:{id}"
        string id
        string name
        string ownerId
        array movies
        number likes
        boolean featured
        string createdAt
    }

    FRIEND_RELATION {
        string key "user:{id}:friends"
        string friendId
    }

    FRIEND_REQUEST {
        string key "user:{id}:friend_requests"
        string fromId
        string fromName
        string fromEmail
    }

    OTP_CODE {
        string key "otp:{phone} or otp:login:{phone}"
        string code
        number expiresAt
        number attempts
        string purpose
    }
```

Recommended text:

```text
Figure 3.2 presents the data storage model of the system. The application does not rely on a traditional public users table for domain data. Instead, authentication identities are managed by Supabase Auth, while user-specific application data is stored in the KV store under structured keys. This approach allows the system to store flexible JSON objects for profiles, watched movies, watchlists, friends, reviews, collections and OTP codes while keeping authentication and storage concerns separated.
```

## Figure 3.3 - Authentication and 2FA flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React frontend
    participant API as API client
    participant EF as Supabase Edge Function
    participant Auth as Supabase Auth
    participant KV as KV Store
    participant WZ as Wazzup
    participant SMS as Mobizon

    User->>FE: Enter email and password
    FE->>Auth: signInWithPassword()
    Auth-->>FE: session JWT
    FE->>API: request protected endpoint
    API->>EF: x-user-token = session JWT
    EF->>Auth: getUser(session JWT)
    Auth-->>EF: user identity

    alt 2FA enabled
        FE->>EF: POST /auth/send-otp
        EF->>KV: read user profile and phone
        EF->>WZ: send WhatsApp OTP
        alt WhatsApp failed
            EF->>SMS: send SMS OTP
        end
        EF->>KV: store otp:login:{phone}
        User->>FE: Enter OTP code
        FE->>EF: POST /auth/verify-otp
        EF->>KV: validate code, attempts and expiration
        EF-->>FE: ok
    end
```

Recommended text:

```text
Figure 3.3 illustrates the authentication and two-factor verification flow. The application uses Supabase Auth for the primary email and password login. The resulting session token is passed to the Edge Function through the x-user-token header. If two-factor authentication is enabled, the backend generates a one-time code, stores it in the KV store and attempts delivery through Wazzup WhatsApp first, falling back to Mobizon SMS if needed.
```

## Figure 3.4 - Recommendation pipeline

```mermaid
flowchart LR
    W["User watched list and ratings"] --> P["Build taste profile"]
    P --> G["Genre weights"]
    P --> D["Director weights"]
    P --> A["Actor weights"]
    P --> WR["Writer weights"]

    W --> TOP["Select top-rated watched movies"]
    TOP --> CAND["Collect TMDB recommendations and similar movies"]
    CAND --> FILTER["Remove already watched movies"]

    G --> SCORE["Weighted scoring"]
    D --> SCORE
    A --> SCORE
    WR --> SCORE
    FILTER --> SCORE
    TMDB["TMDB metadata: popularity, vote_average, genres, credits"] --> SCORE

    SCORE --> DIVERSITY["Diversity filtering"]
    DIVERSITY --> RESULT["Top recommended movies"]
```

Recommended text:

```text
Figure 3.4 shows the recommendation pipeline implemented in the backend. The system builds a taste profile from the user's watched movies and ratings, collects candidate movies from TMDB recommendation and similar-movie endpoints, removes already watched items and ranks the remaining candidates using weighted genre, director, actor, writer, popularity and rating signals. A diversity filtering step is then applied to avoid repetitive recommendations.
```

## Figure 3.5 - Backend API groups

```mermaid
flowchart TB
    CLIENT["Frontend API client"] --> BASE["/functions/v1/make-server-59141208"]

    BASE --> SYS["System: /health"]
    BASE --> AUTH["Auth: /signup, /auth/2fa-*, /auth/send-otp, /auth/verify-otp, /auth/sms-login-*"]
    BASE --> TMDB["TMDB: /tmdb/*"]
    BASE --> LIB["Library: /watched, /watchlist"]
    BASE --> PROF["Profile: /profile, /profile/avatar"]
    BASE --> FRIENDS["Friends: /friends, /friends/request, /friends/recommendations"]
    BASE --> REVIEWS["Reviews: /reviews/top, /reviews/movie/:id, /reviews/:id/like"]
    BASE --> RECS["Recommendations: /recommendations"]
    BASE --> AI["AI: /ai/chat, /ai/analyze-review, /ai/explain"]
    BASE --> COLLS["Collections: /collections, /my-collections"]
    BASE --> ADMIN["Admin: /admin/*"]
```

Recommended text:

```text
Figure 3.5 groups the backend API endpoints by functional responsibility. All backend calls are served by a single Supabase Edge Function route prefix. Public endpoints are used for health checks, signup, TMDB proxying and public collection/review views, while protected endpoints require a valid Supabase session token in the x-user-token header. Administrative endpoints additionally require the is_admin flag in the user's profile.
```

## Notes for Word insertion

When adding these diagrams to Word:

1. Render Mermaid diagrams as PNG or SVG.
2. Insert each diagram as an image.
3. Put the caption below the image.
4. Use consistent numbering:
   - `Figure 3.1 - Overall architecture of Qaradakor.kz`
   - `Figure 3.2 - Data storage model of Qaradakor.kz`
   - `Figure 3.3 - Authentication and 2FA flow`
   - `Figure 3.4 - Recommendation pipeline`
   - `Figure 3.5 - Backend API endpoint groups`
5. Reference each figure before it appears in the text.

