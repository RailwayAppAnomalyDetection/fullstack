"use client"
// import React from 'react';
import Link from "next/link"; 
import { House, Gauge, Grid3x3, LogOut, Microchip, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = (path:string) => pathname === path;
  return (
    <div className="flex h-screen overflow-hidden">
      {/* サイドバー */}
      <aside className="bg-blue-900 text-white w-1/6 p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-center">Railway Comfort Indicator</h1>
        <nav className="flex flex-col gap-4">
          <Link href="/home">
            <button className={`w-full text-left hover:bg-blue-700 p-2 rounded flex items-center gap-x-4 ${isActive("/home") ? "bg-blue-600" : "hover:bg-blue-700"}`}><House/>Home</button>
          </Link>
          <details className="group">
            <summary className="cursor-pointer hover:bg-blue-700 p-2 rounded flex items-center gap-x-4"><Gauge/>Measurement</summary>
            <div className="pl-4 space-y-2 flex flex-col">
              <Link href="/assessment">
                <button className={`w-full text-left hover:bg-blue-700 p-2 rounded ${isActive("/assessment") ? "bg-blue-600" : "hover:bg-blue-700"}`}>Assessment</button>
              </Link>

              <Link href='/viewdata'>
              <button className="text-left hover:bg-blue-700 p-2 rounded">View Data</button>
              </Link>
              <button className="text-left hover:bg-blue-700 p-2 rounded">Regular Train</button>
              <Link href='/training'>
              <button className="text-left hover:bg-blue-700 p-2 rounded">Training</button>
              </Link>
            </div>
          </details>
          <details className="group">
            <summary className="cursor-pointer hover:bg-blue-700 p-2 rounded flex items-center gap-x-4"><Grid3x3/> Data & Analytics</summary>
            <div className="pl-4 space-y-2 flex flex-col">
              <button className="text-left hover:bg-blue-700 p-2 rounded">Analytics Maps</button>
              <button className="text-left hover:bg-blue-700 p-2 rounded">Search Data</button>
              <button className="text-left hover:bg-blue-700 p-2 rounded">Station</button>
            </div>
          </details>
          <button className="text-left hover:bg-blue-700 p-2 rounded flex items-center gap-x-4"><Microchip/>Device</button>
          <button className="text-left hover:bg-blue-700 p-2 rounded flex items-center gap-x-4"><Settings/>Setting</button>
        </nav>
      </aside>

      {/* メインエリア */}
      <div className="flex flex-1 flex-col">
        {/* 上部ヘッダー */}
        <header className="bg-blue-900 text-white flex items-center justify-end p-4">
          {/* アイコンメニュー */}
          <nav className="flex space-x-6">
            <Link href="/home">
            <button className="hover:bg-blue-700 p-2 rounded">
              <span className="material-icons"><House/></span>
            </button>
            </Link>
            <Link href="/assessment">
            <button className="hover:bg-blue-700 p-2 rounded">
              <span className="material-icons"><Gauge/></span>
            </button>
            </Link>
            <button className="hover:bg-blue-700 p-2 rounded">
              <span className="material-icons"><Grid3x3/></span>
            </button>
            <Link href="/">
            <button className="hover:bg-blue-700 p-2 rounded">
              <span className="material-icons"><LogOut/></span>
            </button>
            </Link>
          </nav>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
