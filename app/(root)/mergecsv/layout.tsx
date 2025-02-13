// components/Layout.tsx
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      

      {/* Main Content */}
      <main className="bg-gray-100 flex-1 p-4">{children}</main>
    </div>
  );
};

export default Layout;
