import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ChefHat,
  LayoutGrid,
  UtensilsCrossed,
  Boxes,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SoundToggle } from '../ui/SoundToggle';
import { Role } from '../../types';

interface NavItem {
  name: string;
  path: string;
  icon: typeof CreditCard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Kassa', path: '/pos', icon: CreditCard, roles: ['admin', 'cashier'] },
  { name: 'Oshxona', path: '/kitchen', icon: ChefHat, roles: ['admin', 'chef'] },
  { name: 'Stollar', path: '/tables', icon: LayoutGrid, roles: ['admin', 'cashier', 'chef'] },
  { name: 'Menyu', path: '/menu', icon: UtensilsCrossed, roles: ['admin'] },
  { name: 'Ombor', path: '/inventory', icon: Boxes, roles: ['admin'] },
  { name: 'Moliya', path: '/finance', icon: BarChart3, roles: ['admin'] },
  { name: 'Xodimlar', path: '/staff', icon: Users, roles: ['admin'] },
  { name: 'Sozlamalar', path: '/settings', icon: Settings, roles: ['admin'] },
];

export function AppShell() {
  const { user, logout, login } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const userRole: Role = user?.role || 'cashier';
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = async (targetRole: Role, username: string) => {
    await login(username, username);
    setUserMenuOpen(false);
    if (targetRole === 'cashier') navigate('/pos');
    else if (targetRole === 'chef') navigate('/kitchen');
    else navigate('/finance');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FFF8F0] dark:bg-[#121212] text-stone-900 dark:text-stone-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#18181B] transition-all duration-300 relative z-20 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5A1F] to-[#FF8A48] flex items-center justify-center text-white shadow-md shadow-[#FF5A1F]/20 shrink-0">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-heading font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
                  Taom<span className="text-[#FF5A1F]">Go</span>
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 truncate font-medium">
                  {user?.tenant?.name || 'Rayhon Milliy'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Yon panelni yoyish" : "Yon panelni yig'ish"}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-white'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Role Switcher (Admin/Reviewer Tool) */}
        {!collapsed && (
          <div className="mx-3 my-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1.5">
              Rolni almashtirish
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleSwitchRole('admin', 'admin')}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  userRole === 'admin'
                    ? 'bg-[#FF5A1F] text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRole('cashier', 'kassir')}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  userRole === 'cashier'
                    ? 'bg-[#FF5A1F] text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                Kassir
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRole('chef', 'oshpaz')}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  userRole === 'chef'
                    ? 'bg-[#FF5A1F] text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                Oshpaz
              </button>
            </div>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-3 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.username ? user.username.slice(0, 2) : 'TG'}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {user?.full_name || 'Foydalanuvchi'}
                  </p>
                  <p className="text-[10px] text-stone-400 capitalize">
                    {userRole === 'admin' ? 'Boshqaruvchi' : userRole === 'cashier' ? 'Kassir' : 'Oshpaz'}
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Tizimdan chiqish"
                title="Chiqish"
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-6 bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF5A1F] flex items-center justify-center text-white">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <span className="font-heading font-extrabold text-stone-900 dark:text-white">
                Taom<span className="text-[#FF5A1F]">Go</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/60 text-xs font-medium text-stone-600 dark:text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{user?.tenant?.name || 'Rayhon Milliy Taomlar'}</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <SoundToggle />
            <ThemeToggle />

            {/* Quick role badge & drop */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 text-xs font-medium hover:border-[#FF5A1F]/50 transition-colors shadow-xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF5A1F]"></span>
                <span className="capitalize font-semibold">
                  {userRole === 'admin' ? 'Boshqaruvchi' : userRole === 'cashier' ? 'Kassir' : 'Oshpaz'}
                </span>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 p-2 z-50 text-xs"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                    <p className="font-bold text-stone-800 dark:text-stone-100">{user?.full_name}</p>
                    <p className="text-stone-400 text-[11px]">@{user?.username}</p>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400">Rolni almashtirish:</p>
                    <button
                      type="button"
                      onClick={() => handleSwitchRole('admin', 'admin')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#FF5A1F]" /> Admin (Barcha sahifalar)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchRole('cashier', 'kassir')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Kassir (Kassa, Stollar)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchRole('chef', 'oshpaz')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Oshpaz (Oshxona, Stollar)
                    </button>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Chiqish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <div className="md:hidden h-16 bg-white dark:bg-[#18181B] border-t border-stone-200 dark:border-stone-800 flex items-center justify-around px-2 shrink-0 z-20">
          {visibleNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-medium transition-colors ${
                    isActive ? 'text-[#FF5A1F]' : 'text-stone-500 dark:text-stone-400'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[60px]">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
