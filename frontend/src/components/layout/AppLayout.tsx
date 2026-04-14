import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { IntegrationBanner } from './IntegrationBanner';
import { useIntegrationMode } from '../../hooks/useIntegrationMode';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { path: '/admin', icon: '📊', label: 'Dashboard' },
  { path: '/admin/agents', icon: '👥', label: 'Agents' },
  { path: '/admin/integration', icon: '🔗', label: 'Integration' },
  { path: '/admin/commissions', icon: '💰', label: 'Commissions' },
  { path: '/admin/config', icon: '⚙️', label: 'Config' },
];

const tdeNav: NavItem[] = [
  { path: '/tde', icon: '📊', label: 'Dashboard' },
  { path: '/tde/agents', icon: '👥', label: 'Agents' },
];

const maNav: NavItem[] = [
  { path: '/ma', icon: '🏦', label: 'Overview' },
  { path: '/ma/commission', icon: '💰', label: 'Commission' },
  { path: '/ma/disputes', icon: '⚖️', label: 'Disputes' },
];

const rebalancerNav: NavItem[] = [
  { path: '/rebalancer', icon: '🏠', label: 'Home' },
  { path: '/rebalancer/route', icon: '🗺️', label: 'Route' },
  { path: '/rebalancer/history', icon: '📋', label: 'History' },
];

function getNav(role: string): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN': return adminNav;
    case 'TDE': return tdeNav;
    case 'MASTER_AGENT': return maNav;
    case 'REBALANCER': return rebalancerNav;
    default: return [];
  }
}

interface Props {
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const mode = useIntegrationMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = getNav(user?.role || '');
  const isRebalancer = user?.role === 'REBALANCER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Integration mode banner */}
      <IntegrationBanner mode={mode} />

      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #00843D, #E4007C)' }}>
                Z
              </div>
              <span className="font-bold text-zamtel-green hidden sm:block">ZLMS</span>
            </div>

            {/* Desktop nav */}
            {!isRebalancer && (
              <nav className="hidden md:flex items-center gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                        ? 'bg-zamtel-green text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>{item.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right: user + logout */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600">
                {user?.name} <span className="text-xs text-gray-400">({user?.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-2"
              >
                Logout
              </button>
              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 px-4 py-2 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === item.path
                    ? 'bg-zamtel-green text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Rebalancer bottom nav */}
      {isRebalancer && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex md:hidden">
          {rebalancerNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-zamtel-green'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Main content */}
      <main className={`flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 ${isRebalancer ? 'pb-20' : ''}`}>
        {children}
      </main>
    </div>
  );
};
