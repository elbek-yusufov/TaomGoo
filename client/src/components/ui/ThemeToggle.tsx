import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('taomgo_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('taomgo_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('taomgo_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      aria-label="Mavzuni almashtirish"
      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:text-[#FF5A1F] hover:border-[#FF5A1F]/40 transition-colors shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#FF5A1F]"
      title={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
