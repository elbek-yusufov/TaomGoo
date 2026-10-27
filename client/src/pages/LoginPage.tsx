import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore, getDefaultRouteForRole } from '../stores/authStore';
import { FoodHeroScene } from '../components/three/FoodHeroScene';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await login(username, password);
    if (res.success && res.role) {
      navigate(getDefaultRouteForRole(res.role));
    } else {
      setErrorMsg(res.error || "Noto'g'ri login yoki parol kiritildi");
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FFF8F0] dark:bg-[#121212] text-stone-900 dark:text-stone-100">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16 z-10">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-lg shadow-[#FF5A1F]/30">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight text-stone-900 dark:text-white">
              Taom<span className="text-[#FF5A1F]">Go</span>
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-stone-900 dark:text-white tracking-tight mb-2">
              Tizimga kirish
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
              Kassa, oshxona yoki boshqaruv panelingizga kirish uchun login va parolingizni kiriting.
            </p>

            {errorMsg && (
              <div className="p-3.5 mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Foydalanuvchi nomi
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="admin / kassir / oshpaz"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-600 dark:text-stone-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-300 text-[#FF5A1F] focus:ring-[#FF5A1F]"
                  />
                  <span>Eslab qolish</span>
                </label>
                <span className="text-stone-400 hover:text-stone-600 cursor-pointer">Parolni unutdingizmi?</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-sm shadow-lg shadow-[#FF5A1F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Kirish <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
              <p className="text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" /> Tezkor demo akkauntlar:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:border-[#FF5A1F] transition-all cursor-pointer text-left"
                >
                  <p className="text-[#FF5A1F] font-bold">Admin</p>
                  <p className="text-[10px] text-stone-400">admin / admin</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('kassir', 'kassir')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:border-[#FF5A1F] transition-all cursor-pointer text-left"
                >
                  <p className="text-emerald-500 font-bold">Kassir</p>
                  <p className="text-[10px] text-stone-400">kassir / kassir</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('oshpaz', 'oshpaz')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:border-[#FF5A1F] transition-all cursor-pointer text-left"
                >
                  <p className="text-blue-500 font-bold">Oshpaz</p>
                  <p className="text-[10px] text-stone-400">oshpaz / oshpaz</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-400 pt-6">
          Rayhon Milliy Taomlar • Xavfsiz tizim v2.4.0
        </div>
      </div>

      {/* Right Column: Warm Gradient + Floating 3D Food Showcase */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-tr from-stone-900 via-stone-900 to-[#2A160E] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,90,31,0.22),transparent_70%)] pointer-events-none" />

        <div className="w-full h-full flex flex-col justify-between z-10">
          <div className="text-right">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium backdrop-blur-md">
              🇺🇿 Oʻzbekiston Restoran Tizimi
            </span>
          </div>

          <div className="h-[440px] relative">
            <FoodHeroScene />
          </div>

          <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-2xl border border-stone-800/80 text-white/90">
            <p className="font-heading font-bold text-lg mb-1">
              "Kassir va oshpaz oʻrtasida mukammal sinxronlik"
            </p>
            <p className="text-xs text-stone-400">
              Buyurtmalar real-time oshxonaga uzatiladi, xomashyo avtomatik hisobdan chiqariladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
