import { useState, useRef, useEffect } from "react";
import { aiChat, TMDB_IMG } from "../lib/api";
import { Bot, Send, Loader2, User, Film, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { useLang } from "../lib/lang-context";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  movies?: any[];
}

// Markdown renderer components for AI messages
const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold" style={{ color: "var(--color-primary)" }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="not-italic font-medium opacity-70">{children}</em>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 my-2 pl-0 list-none" style={{ counterReset: "ai-counter" }}>
      {children}
    </ol>
  ),
  ul: ({ children }) => (
    <ul className="space-y-2 my-2 pl-0 list-none">{children}</ul>
  ),
  li: ({ children, ordered, index }: any) => (
    <li className="text-sm leading-relaxed flex gap-2 items-start">
      <span
        className="shrink-0 mt-0.5 min-w-[1.4em] text-xs font-mono"
        style={{ color: "var(--color-primary)", opacity: 0.8 }}
      >
        {ordered ? `${(index ?? 0) + 1}.` : "•"}
      </span>
      <span>{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <h1 className="font-bold text-base mb-2" style={{ color: "var(--color-primary)" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-bold text-sm mb-1.5" style={{ color: "var(--color-primary)" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-semibold text-sm mb-1">{children}</h3>
  ),
  code: ({ children }) => (
    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 pl-3 italic my-2 opacity-70"
      style={{ borderColor: "var(--color-primary)" }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-3" />,
};

export function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useLang();

  const SUGGESTIONS = [
    t("aiSuggestion1"),
    t("aiSuggestion2"),
    t("aiSuggestion3"),
    t("aiSuggestion4"),
    t("aiSuggestion5"),
    t("aiSuggestion6"),
  ];

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await aiChat(msg, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, movies: data.movies },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Ошибка: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100svh-11rem)] min-h-[520px] w-full max-w-3xl flex-col mx-auto lg:h-screen lg:min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-black text-foreground">{t("aiChatTitle")}</h1>
            <p className="text-xs text-muted-foreground">{t("aiChatSubtitle")}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:border-primary/30 transition-all"
          >
            {t("aiNewChat")}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground mb-1">{t("aiChatTitle")}</h2>
              <p className="text-muted-foreground text-sm">{t("aiChatSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); handleSend(s); }}
                  className="text-left text-sm bg-muted border border-border hover:border-primary/30 hover:bg-accent rounded-xl px-4 py-3 text-muted-foreground hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-primary/10 border border-primary/20"}`}>
              {msg.role === "user"
                ? <User className="w-4 h-4 text-primary-foreground" />
                : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border text-foreground"}`}>
                {msg.role === "assistant"
                  ? <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                  : msg.content}
              </div>
              {msg.movies && msg.movies.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {msg.movies.map((movie: any) => (
                    <button
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="shrink-0 w-20 group"
                    >
                      {movie.poster_path ? (
                        <img
                          src={`${TMDB_IMG}/w185${movie.poster_path}`}
                          alt={movie.title}
                          className="w-20 h-28 object-cover rounded-xl border border-border group-hover:border-primary/40 transition-colors"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-xl bg-muted border border-border flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 text-left leading-tight">{movie.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">{t("aiThinking")}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-background/80 backdrop-blur-sm shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("aiInputPlaceholder")}
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
