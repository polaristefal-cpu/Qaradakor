import { Link } from "react-router";
import { Clapperboard, Heart, Github, Mail, Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  const year = 2026;

  return (
    <footer className="border-t border-border bg-card/40 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Top row: logo + nav */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform shrink-0">
                <Clapperboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-foreground font-black tracking-tight text-sm">
                qaradakor<span className="text-primary">.kz</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Ваша личная библиотека фильмов с поиском, рекомендациями на основе ИИ и системой друзей.
            </p>
            <p className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider">
              Некоммерческий проект
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-2.5 mt-1">
              <a
                href="https://www.instagram.com/qaradakor.kz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/77074623075"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="flex flex-wrap gap-10">
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                Навигация
              </p>
              <FooterLink to="/">Главная</FooterLink>
              <FooterLink to="/search">Поиск фильмов</FooterLink>
              <FooterLink to="/library">Библиотека</FooterLink>
              <FooterLink to="/recommendations">Рекомендации</FooterLink>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                Аккаунт
              </p>
              <FooterLink to="/login">Войти</FooterLink>
              <FooterLink to="/register">Регистрация</FooterLink>
              <FooterLink to="/profile">Профиль</FooterLink>
              <FooterLink to="/friends">Друзья</FooterLink>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">
                Информация
              </p>
              <FooterLink to="/watchlist">Вотчлист</FooterLink>
              <FooterLink to="/ai">AI-чат</FooterLink>
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                TMDB API
              </a>
              <a
                href="mailto:contact@qaradakor.kz"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Контакт
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-8" />

        {/* Diploma block */}
        <div className="bg-muted/40 border border-border rounded-2xl px-5 py-4 mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
            Дипломная работа
          </p>
          <p className="text-sm text-foreground font-bold">Yernat Koptileu <span className="text-muted-foreground font-normal">(SIS-2202)</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">
            International Information Technology University, Almaty — {year}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground/60">
          <p>© {year} qaradakor.kz — Все права защищены</p>

          <div className="flex items-center gap-1.5">
            <span>Данные предоставлены</span>
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary font-semibold transition-colors"
            >
              TMDB
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}