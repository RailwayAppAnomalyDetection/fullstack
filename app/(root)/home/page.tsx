"use client";
// pages/index.tsx
//import Layout from "../layout";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const Home = () => {
  const position:[number,number] = [51.505, -0.09];
  return (
    
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1つのボックスは4列幅中の3列分を占有 */}
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        {/* 一番右の空白部分（スタイルなし） */}
      </div>

      {/* Main Panel */}
      <div className="bg-gray-300 h-96 rounded-md"></div>
    </div>

  );
};

export default Home;
