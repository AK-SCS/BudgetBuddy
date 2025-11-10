import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <main className="bb-app">
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
        <Outlet />
      </div>
    </main>
  );
}
