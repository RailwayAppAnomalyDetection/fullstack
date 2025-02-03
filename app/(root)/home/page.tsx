"use client"
// pages/index.tsx
//import Layout from "../layout";
import { Gauge } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const Home = () => {
   const pathname = usePathname();
    const isActive = (path:string) => pathname === path;
  return (
    
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1つのボックスは4列幅中の3列分を占有 */}
        <div className="bg-blue-900 h-24 rounded-md col-span-1">
          <div className="flex items-center">
            <Link href="/assessment">
              <button className="w-full flex items-center gap-2 p-3 rounded">
              <Gauge className="w-5 h-5" /> 
              <span className="text-white font-medium">Assessment</span>
              </button>
            </Link>
          </div>
        </div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        {/* 一番右の空白部分（スタイルなし） */}
      </div>

      {/* Main Panel */}
      {/* <div className="bg-gray-300 h-96 rounded-md"></div> */}
      <div className="h-96 rounded-md overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          // src="https://www.openstreetmap.org/export/embed.html?bbox=105.29296875%2C-16.13026201203474%2C118.52050781250001%2C-0.19775351362548124&amp;layer=mapnik"
          // src="https://www.openstreetmap.org/export/embed.html?bbox=110.334%2C-7.825%2C110.406%2C-7.769&amp;layer=mapnik"
          src="https://www.openstreetmap.org/export/embed.html?bbox=110.360529%2C-7.807068%2C110.380529%2C-7.787068&amp&layer=mapnik"

          style={{ border: "1px solid black" }}
        ></iframe>
        <div className="text-center mt-2">
          <small>
            <a
              // href="https://www.openstreetmap.org/#map=6/-8.24/111.91"
              // target="_blank"
              // rel="noopener noreferrer"
              // className="text-blue-600 hover:underline"
              href="https://www.openstreetmap.org/#map=15/-7.797068/110.370529"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              大きな地図を表示
            </a>
          </small>
        </div>
      </div>

    </div>

  );
};

export default Home;