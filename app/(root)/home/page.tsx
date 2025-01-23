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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900 h-24 rounded-md"></div>
        <div className="bg-blue-900 h-24 rounded-md"></div>
        <div className="bg-blue-900 h-24 rounded-md"></div>
      </div>

      {/* Main Panel */}
      <div className="bg-gray-300 h-96 rounded-md overflow-hidden">
        <MapContainer center={position} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>
          <Marker position={position}>
            <Popup>
              A sample popup for this location
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>

  );
};

export default Home;
