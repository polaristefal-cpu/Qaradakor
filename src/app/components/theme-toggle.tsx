import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="
        relative w-9 h-9 rounded-xl flex items-center justify-center
        text-muted-foreground hover:text-foreground
        bg-transparent hover:bg-muted
        border border-transparent hover:border-border
        transition-all duration-200
      "
    >
      {theme === "dark" ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Moon className="w-4.5 h-4.5" />
      )}
    </button>
  );
}
