import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './authContext';

export default function RedirectIfAuthed() {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : <Outlet />;
}
