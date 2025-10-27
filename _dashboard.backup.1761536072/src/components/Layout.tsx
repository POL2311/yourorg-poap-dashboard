import React, { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useLocation();
  const Nav = ({ to, label }: { to: string; label: string }) => (
    <Link className={`px-3 py-2 rounded ${pathname === to ? 'bg-black text-white' : 'hover:bg-gray-200'}`} to={to}>
      {label}
    </Link>
  );
  return (
    <div className="min-h-screen">
      <header className="border-b px-4 py-3 flex gap-2">
        <Nav to="/" label="Dashboard" />
        <Nav to="/services" label="Services" />
        <Nav to="/permits" label="Permits" />
        <Nav to="/relayers" label="Relayers" />
        <Nav to="/analytics" label="Analytics" />
        <Nav to="/settings" label="Settings" />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
};
