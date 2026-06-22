import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { notificationsApi } from '@/api/resources.api';
import { authApi } from '@/api/auth.api';
import { Notification } from '@/types';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/servicios', label: 'Servicios', icon: Wrench },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const { data: user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignorar error de logout en backend, igual cerramos sesión local
      }
    }
    logout();
    queryClient.clear();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-ink-900 transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400">
            <span className="text-sm font-bold text-ink-900">C</span>
          </div>
          <span className="text-base font-bold text-white">Cotizador CRM</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-ink-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-brand-400 text-ink-900' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-ink-800 p-3">
          <div className="mb-2 px-3 py-1.5">
            <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-400">{user?.organization?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-ink-800 hover:text-white"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-500 lg:hidden">
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative rounded-full p-2 text-ink-500 hover:bg-ink-100"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-ink-100 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-ink-100 p-3">
                  <span className="text-sm font-semibold text-ink-900">Notificaciones</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                      Marcar todas leídas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-ink-400">Sin notificaciones</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className={clsx('border-b border-ink-50 p-3', !n.readAt && 'bg-brand-50/40')}>
                        <p className="text-sm font-medium text-ink-900">{n.title}</p>
                        <p className="text-xs text-ink-500">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
