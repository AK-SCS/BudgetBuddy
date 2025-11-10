import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import RedirectIfAuthed from './auth/RedirectIfAuthed';
import Layout from './components/Layout';
import Header from './components/Header';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AIPage from './pages/AIPage';
import AnalyticsPage from './pages/AnalyticsPage';


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
