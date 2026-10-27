import { FileQuestion, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-[#FF5A1F] mb-6 shadow-xl">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="font-heading font-extrabold text-3xl md:text-5xl text-stone-900 dark:text-white mb-3">
        Sahifa topilmadi (404)
      </h1>
      <p className="text-stone-500 dark:text-stone-400 max-w-md mb-8 text-sm md:text-base">
        Siz qidirayotgan sahifa ko'chirilgan, o'chirilgan yoki manzili noto'g'ri kiritilgan bo'lishi mumkin.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-semibold text-sm shadow-md shadow-[#FF5A1F]/25 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
      </Link>
    </div>
  );
}

export function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 mb-6 shadow-xl">
        <RefreshCw className="w-10 h-10 animate-spin" />
      </div>
      <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-stone-900 dark:text-white mb-3">
        Internet aloqasi uzildi
      </h1>
      <p className="text-stone-500 dark:text-stone-400 max-w-md mb-8 text-sm md:text-base">
        TaomGo oflayn rejimida lokal xotiradagi ma'lumotlarni ko'rsatishda davom etadi. Qayta ulanish kutilmoqda.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
      >
        Qayta tekshirish
      </button>
    </div>
  );
}
