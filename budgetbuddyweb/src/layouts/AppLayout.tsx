import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
