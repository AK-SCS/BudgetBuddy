import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import RedirectIfAuthed from './auth/RedirectIfAuthed';
import Layout from './components/Layout';
import Header from './components/Header';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const AIPage = lazy(() => import('./pages/AIPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        {/* Public: only show when NOT authed */}
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Private: must be authed */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/ai" element={<AIPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
