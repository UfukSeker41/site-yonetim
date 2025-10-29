// Layout Component - Ana sayfa düzeni
import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';
import {
  Building2,
  Home,
  Megaphone,
  Video,
  Users,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, show: true },
    { name: 'Duyurular', href: '/announcements', icon: Megaphone, show: true },
    { name: 'Toplantılar', href: '/meetings', icon: Video, show: true },
    { name: 'Admin Panel', href: '/admin', icon: Settings, show: isAdmin() }
  ];

  const adminQuickActions = [
    { name: 'Yeni Duyuru', href: '/admin/announcements', icon: Megaphone, show: isAdmin() },
    { name: 'Yeni Toplantı', href: '/admin/meetings', icon: Video, show: isAdmin() },
    { name: 'Kullanıcı Yönet', href: '/admin/users', icon: Users, show: isAdmin() }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 fixed w-full top-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            <span className="text-white font-semibold text-lg hidden sm:block">
              Site Yönetim
            </span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <NotificationPanel />

            <div className="flex items-center gap-3 bg-zinc-700 rounded-lg px-3 py-2">
              <div className="text-right hidden sm:block">
                <p className="text-white text-sm font-medium">{user?.fullName}</p>
                <p className="text-zinc-400 text-xs">
                  {user?.role === 'admin' ? 'Yönetici' : 'Sakin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] bg-zinc-800 border-r border-zinc-700
          transition-transform duration-300 z-20 w-64 overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            if (!item.show) return null;

            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Admin Quick Actions */}
          {isAdmin() && (
            <>
              <div className="border-t border-zinc-700 my-4 pt-4">
                <p className="text-xs text-zinc-500 font-semibold px-4 mb-2">HIZLI İŞLEMLER</p>
                <div className="space-y-2">
                  {adminQuickActions.map((action) => {
                    if (!action.show) return null;
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.name}
                        to={action.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{action.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* User Info Card */}
        <div className="absolute bottom-4 left-4 right-4 bg-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.fullName?.charAt(0)}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.fullName}</p>
              <p className="text-zinc-400 text-xs">{user?.apartmentNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="text-xs text-zinc-500 border-t border-zinc-600 pt-2">
            <p>Email: {user?.email}</p>
            {user?.phone && <p>Tel: {user?.phone}</p>}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
