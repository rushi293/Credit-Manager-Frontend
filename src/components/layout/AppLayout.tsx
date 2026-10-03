import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  Settings, 
  Menu,
  BarChart2,
  LogOut,
  X,
  Building2,
  User as UserIcon,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Credit Manager — Application Shell
//
// Navigation is fixed to the six Credit Manager modules only.
// In AUTH_BYPASS (preview) mode the user panel / logout button is hidden.
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

const navigation = [
  { name: 'Dashboard', href: '/',         icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Bills',     href: '/bills',     icon: Receipt },
  { name: 'Daily Bills', href: '/daily-bills', icon: Receipt },
  { name: 'Payments',  href: '/payments',  icon: CreditCard },
  { name: 'Reports',   href: '/reports',   icon: BarChart2 },
  { name: 'Settings',  href: '/settings',  icon: Settings },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, business, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    if (location.pathname === '/') return business?.name || 'My Business';
    const match = navigation.find(
      (n) => n.href !== '/' && location.pathname.startsWith(n.href)
    );
    return match ? match.name : 'Credit Manager';
  };

  const handleBack = () => {
    if (location.pathname === '/') return;
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row">

      {/* ── Mobile Top Header ───────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {location.pathname !== '/' && (
            <button
              onClick={handleBack}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-base font-semibold text-gray-900 truncate max-w-[140px]">
            {getPageTitle()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 -mr-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Sidebar (desktop permanent / mobile drawer) ─────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        shadow-xl md:shadow-none md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Sidebar brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none truncate max-w-[120px]">
                  {!AUTH_BYPASS && business?.name ? business.name : 'Credit Manager'}
                </p>
                {!AUTH_BYPASS && business?.name && (
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-none">
                    Credit Manager
                  </p>
                )}
              {AUTH_BYPASS && (
                <p className="text-[10px] text-amber-600 mt-0.5 leading-none font-medium">
                  Preview Mode
                </p>
              )}
            </div>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-gray-600 p-1"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={() => `
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`
                  mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors
                  ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}
                `} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User panel / Logout — hidden in bypass / preview mode */}
        {!AUTH_BYPASS && (
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200 flex-shrink-0">
                <UserIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {business?.name || 'Business'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'Admin'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4 text-red-500 flex-shrink-0" />
              Sign out
            </button>
          </div>
        )}

        {/* In bypass mode: subtle note at bottom */}
        {AUTH_BYPASS && (
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Running in <span className="font-semibold text-amber-600">preview mode</span>.<br />
              Set <code className="bg-gray-100 px-0.5 rounded">VITE_AUTH_BYPASS=false</code> to enable login.
            </p>
          </div>
        )}
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Desktop Top Header */}
        <div className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 h-16 shrink-0">
          <div className="flex items-center gap-4">
            {location.pathname !== '/' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-around items-center h-16 px-1">
          {navigation.slice(0, 5).map((item) => {
            const isActive = item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex flex-col items-center justify-center w-full h-full space-y-1"
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className={`text-[10px] truncate w-full text-center px-1 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

