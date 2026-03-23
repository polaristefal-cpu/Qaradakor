import { useState, useRef, useEffect } from "react";
import { aiChat, TMDB_IMG } from "../lib/api";
import { Bot, Send, Loader2, User, Film, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  movies?: any[];
}

const SUGGESTIONS = [
  "Посоветуй что-нибудь для вечера с друзьями",
  "Хочу что-то мрачное и психологическое",
  "Какие фильмы похожи на Интерстеллар?",
  "Лучшие фильмы Дени Вильнёва",
  "Что посмотреть, чтобы поднять настроение?",
  "Порекомендуй хорроры, от которых реально страшно",
];

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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
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
    <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
          <Bot className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-foreground">Qaradakor AI</h1>
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              GPT-5.4 mini
            </span>
          </div>
          <p className="text-muted-foreground text-xs">Кино-ассистент, знающий вашу библиотеку</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 min-h-0 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-foreground font-bold text-lg mb-1">Спросите что угодно о кино</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Я знаю вашу библиотеку и вкусы. Опишите настроение — подберу идеальный фильм.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-muted-foreground hover:text-foreground bg-card hover:bg-muted rounded-xl px-3.5 py-2.5 transition-all border border-border hover:border-primary/30"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}

            <div className="max-w-[82%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-foreground rounded-bl-md border border-border shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <span>{msg.content}</span>
                ) : (
                  <ReactMarkdown components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Movie cards */}
              {msg.movies && msg.movies.length > 0 && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {msg.movies.map((m: any) => (
                    <div
                      key={m.id}
                      onClick={() => navigate(`/movie/${m.id}`)}
                      className="shrink-0 w-24 cursor-pointer group"
                    >
                      {m.poster_path ? (
                        <img
                          src={`${TMDB_IMG}/w185${m.poster_path}`}
                          alt={m.title}
                          className="w-24 h-[144px] object-cover rounded-xl border border-border group-hover:border-primary/50 group-hover:shadow-lg transition-all"
                        />
                      ) : (
                        <div className="w-24 h-[144px] bg-muted border border-border rounded-xl flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 group-hover:text-foreground transition-colors leading-tight">
                        {m.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card rounded-2xl rounded-bl-md px-4 py-2.5 border border-border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Думаю...
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Опишите, что хотите посмотреть..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground rounded-xl px-4 py-2.5 transition-all shadow-sm"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
