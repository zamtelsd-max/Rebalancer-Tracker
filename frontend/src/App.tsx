import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
// Rebalancer
import { RebalancerHome } from './pages/rebalancer/RebalancerHome';
import { RebalancerRoute } from './pages/rebalancer/RebalancerRoute';
import { AgentVisit } from './pages/rebalancer/AgentVisit';
import { ScanPage } from './pages/rebalancer/ScanPage';
import { DispensePage } from './pages/rebalancer/DispensePage';
import { OtpPage } from './pages/rebalancer/OtpPage';
import { ReceiptPage } from './pages/rebalancer/ReceiptPage';
import { HistoryPage } from './pages/rebalancer/HistoryPage';
// TDE
import { TdeDashboard } from './pages/tde/TdeDashboard';
import { AgentsList } from './pages/tde/AgentsList';
import { AgentDetail } from './pages/tde/AgentDetail';
// MA
import { MaDashboard } from './pages/ma/MaDashboard';
import { CommissionPage } from './pages/ma/CommissionPage';
import { DisputesPage } from './pages/ma/DisputesPage';
// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAgents } from './pages/admin/AdminAgents';
import { IntegrationPage } from './pages/admin/IntegrationPage';
import { AdminCommissions } from './pages/admin/AdminCommissions';
import { AdminConfig } from './pages/admin/AdminConfig';

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    // Redirect to role's home
    const roleHome: Record<string, string> = {
      SUPER_ADMIN: '/admin',
      TDE: '/tde',
      MASTER_AGENT: '/ma',
      REBALANCER: '/rebalancer',
    };
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
  }
  return <>{children}</>;
}

function AuthedLayout({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  return (
    <RequireAuth roles={roles}>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  );
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            isAuthenticated && user ? (
              <Navigate to={
                user.role === 'SUPER_ADMIN' ? '/admin' :
                user.role === 'TDE' ? '/tde' :
                user.role === 'MASTER_AGENT' ? '/ma' : '/rebalancer'
              } replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Rebalancer routes */}
        <Route path="/rebalancer" element={<AuthedLayout roles={['REBALANCER']}><RebalancerHome /></AuthedLayout>} />
        <Route path="/rebalancer/route" element={<AuthedLayout roles={['REBALANCER']}><RebalancerRoute /></AuthedLayout>} />
        <Route path="/rebalancer/agent/:id" element={<AuthedLayout roles={['REBALANCER']}><AgentVisit /></AuthedLayout>} />
        <Route path="/rebalancer/scan" element={<AuthedLayout roles={['REBALANCER']}><ScanPage /></AuthedLayout>} />
        <Route path="/rebalancer/dispense" element={<AuthedLayout roles={['REBALANCER']}><DispensePage /></AuthedLayout>} />
        <Route path="/rebalancer/otp" element={<AuthedLayout roles={['REBALANCER']}><OtpPage /></AuthedLayout>} />
        <Route path="/rebalancer/receipt" element={<AuthedLayout roles={['REBALANCER']}><ReceiptPage /></AuthedLayout>} />
        <Route path="/rebalancer/history" element={<AuthedLayout roles={['REBALANCER']}><HistoryPage /></AuthedLayout>} />

        {/* TDE routes */}
        <Route path="/tde" element={<AuthedLayout roles={['TDE', 'SUPER_ADMIN']}><TdeDashboard /></AuthedLayout>} />
        <Route path="/tde/agents" element={<AuthedLayout roles={['TDE', 'SUPER_ADMIN']}><AgentsList /></AuthedLayout>} />
        <Route path="/tde/agent/:id" element={<AuthedLayout roles={['TDE', 'SUPER_ADMIN']}><AgentDetail /></AuthedLayout>} />

        {/* Master Agent routes */}
        <Route path="/ma" element={<AuthedLayout roles={['MASTER_AGENT', 'SUPER_ADMIN']}><MaDashboard /></AuthedLayout>} />
        <Route path="/ma/commission" element={<AuthedLayout roles={['MASTER_AGENT', 'SUPER_ADMIN']}><CommissionPage /></AuthedLayout>} />
        <Route path="/ma/disputes" element={<AuthedLayout roles={['MASTER_AGENT', 'SUPER_ADMIN']}><DisputesPage /></AuthedLayout>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AuthedLayout roles={['SUPER_ADMIN']}><AdminDashboard /></AuthedLayout>} />
        <Route path="/admin/agents" element={<AuthedLayout roles={['SUPER_ADMIN']}><AdminAgents /></AuthedLayout>} />
        <Route path="/admin/integration" element={<AuthedLayout roles={['SUPER_ADMIN']}><IntegrationPage /></AuthedLayout>} />
        <Route path="/admin/commissions" element={<AuthedLayout roles={['SUPER_ADMIN']}><AdminCommissions /></AuthedLayout>} />
        <Route path="/admin/config" element={<AuthedLayout roles={['SUPER_ADMIN']}><AdminConfig /></AuthedLayout>} />

        {/* Default redirect */}
        <Route path="/" element={
          isAuthenticated && user ? (
            <Navigate to={
              user.role === 'SUPER_ADMIN' ? '/admin' :
              user.role === 'TDE' ? '/tde' :
              user.role === 'MASTER_AGENT' ? '/ma' : '/rebalancer'
            } replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">🔍</p>
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <a href="/" className="btn-primary mt-4 inline-block">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
