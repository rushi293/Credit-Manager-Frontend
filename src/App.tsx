import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/context/ThemeContext';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const CustomersPage = React.lazy(() => import('@/pages/Customers'));
const CustomerDetailsPage = React.lazy(() => import('@/pages/Customers/CustomerDetails'));
const BillsPage = React.lazy(() => import('@/pages/Bills'));
const BillDetailsPage = React.lazy(() => import('@/pages/Bills/BillDetails'));
const PaymentsPage = React.lazy(() => import('@/pages/Payments'));
const ReportsPage = React.lazy(() => import('@/pages/Reports'));
const SettingsPage = React.lazy(() => import('@/pages/Settings'));
const DailyBillsPage = React.lazy(() => import('@/pages/DailyBills'));

const LoginPage = React.lazy(() => import('@/pages/Auth/Login'));
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OfflineDetector } from '@/components/pwa/OfflineDetector';
import { SSEProvider } from '@/components/SSEProvider';


//
// When VITE_AUTH_BYPASS=true is set in .env.local the app skips the login
// screen so you can browse all pages without a running backend / database.
//
//     Backend JWT middleware, IDOR protection, and business isolation are
//     completely unchanged and still enforce auth on every API call.
//
// HOW TO RE-ENABLE AUTHENTICATION:
//   1. Open frontend/.env.local
//   2. Set VITE_AUTH_BYPASS=false  (or delete the line)
//   3. Restart the dev server (`npm run dev`)
//
// Production builds should NEVER have VITE_AUTH_BYPASS=true.
const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === 'true';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Bypass mode: show the app shell immediately without requiring login
  if (AUTH_BYPASS) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** In bypass mode, /login and /register redirect back to the dashboard. */
function AuthRoute({ element }: { element: React.ReactElement }) {
  if (AUTH_BYPASS) {
    return <Navigate to="/" replace />;
  }
  return element;
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          
          <OfflineDetector />
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                
                <Route path="/login"    element={<AuthRoute element={<LoginPage />} />} />

                {/* Main application shell */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <SSEProvider>
                        <AppLayout />
                      </SSEProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index                       element={<Dashboard />} />
                  <Route path="customers"            element={<CustomersPage />} />
                  <Route path="customers/:id"        element={<CustomerDetailsPage />} />
                  <Route path="bills"                element={<BillsPage />} />
                  <Route path="bills/:id"            element={<BillDetailsPage />} />
                  <Route path="daily-bills"          element={<DailyBillsPage />} />
                  <Route path="payments"             element={<PaymentsPage />} />
                  <Route path="reports"              element={<ReportsPage />} />
                  <Route path="settings"             element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
