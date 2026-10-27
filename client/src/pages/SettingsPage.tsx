import { useState } from 'react';
import { Settings, User, Building, Volume2, Moon, Sun, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSoundStore } from '../stores/soundStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SoundToggle } from '../components/ui/SoundToggle';

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { soundEnabled } = useSoundStore();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Tenant state
  const [tenantName, setTenantName] = useState(user?.tenant?.name || 'Rayhon Milliy Taomlar');
  const [tenantAddress, setTenantAddress] = useState(
    user?.tenant?.address || 'Toshkent sh., Chilonzor tumani, 9-mavze, 24-uy'
  );
  const [tenantPhone, setTenantPhone] = useState(user?.tenant?.phone || '+998 71 200 45 45');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212] max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 dark:text-white flex items-center gap-2">
          Tizim Sozlamalari
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Restoran maʼlumotlari, interfeys rejimi va audio xabarnomalar
        </p>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Restoran maʼlumotlari */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Building className="w-5 h-5 text-[#FF5A1F]" />
            <h3 className="font-heading font-bold text-base text-stone-900 dark:text-white">Restoran rekvizitlari</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Muassasa nomi
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Telefon</label>
              <input
                type="text"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Manzil</label>
            <input
              type="text"
              value={tenantAddress}
              onChange={(e) => setTenantAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
            />
          </div>
        </div>

        {/* Profil va Kirish */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <User className="w-5 h-5 text-[#FF5A1F]" />
            <h3 className="font-heading font-bold text-base text-stone-900 dark:text-white">Joriy profil</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-base text-stone-900 dark:text-white">{user?.full_name}</p>
              <p className="text-xs text-stone-400">@{user?.username}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Interfeys va bildirishnomalar */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Settings className="w-5 h-5 text-[#FF5A1F]" />
            <h3 className="font-heading font-bold text-base text-stone-900 dark:text-white">Interfeys va Ovoz</h3>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Kunduzgi / Tungi mavzu</p>
              <p className="text-[11px] text-stone-400">Koʻzlarga qulay qorongʻu rejim</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Ovozli xabarnomalar</p>
              <p className="text-[11px] text-stone-400">Yangi buyurtma va oshxona signallari</p>
            </div>
            <SoundToggle />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Tizimdan chiqish
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs shadow-md shadow-[#FF5A1F]/30 cursor-pointer"
          >
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
}
