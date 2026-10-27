import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore, getDefaultRouteForRole } from '../stores/authStore';

export function ForbiddenPage() {
  const { user } = useAuthStore();
  const returnPath = getDefaultRouteForRole(user?.role);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-500 mb-6 shadow-xl">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-stone-900 dark:text-white mb-2">
        Kirish cheklangan (403)
      </h1>
      <p className="text-stone-500 dark:text-stone-400 max-w-md mb-8 text-sm md:text-base">
        Sizning <span className="font-semibold text-[#FF5A1F] uppercase">{user?.role}</span> rolingiz ushbu boshqaruv
        sahifasiga kirishga ruxsat bermaydi.
      </p>
      <Link
        to={returnPath}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-semibold text-sm shadow-md shadow-[#FF5A1F]/25 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Asosiy ish joyimga qaytish
      </Link>
    </div>
  );
}
