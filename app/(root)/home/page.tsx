// pages/index.tsx
//import Layout from "../layout";
"use client";

import { useEffect, useState } from "react";
// import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet"
import { MapContainer, TileLayer, useMap } from "react-leaflet";

const HeatmapLayer = ({ data }: { data: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;

    const heatLayer = L.heatLayer(data, {
      radius: 25, // Adjust the heatmap point size
      blur: 15,   // Adjust the smoothness
      maxZoom: 17,
      gradient: { 0.4: "blue", 0.65: "lime", 1: "red" }, // Color gradient
    });

    heatLayer.addTo(map);

    // Cleanup on unmount
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data]);

  return null;
};

const Home = () => {
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);

  // Load CSV data
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/path/to/output_select.csv"); // Update the path to your CSV file
      const text = await response.text();

      const rows = text.split("\n").slice(1); // Skip the header
      const data = rows
        .map((row) => {
          const [value, lat, lon] = row.split(",");
          return [parseFloat(lat), parseFloat(lon), parseFloat(value)] as [
            number,
            number,
            number
          ];
        })
        .filter((row) => !isNaN(row[0]) && !isNaN(row[1]) && !isNaN(row[2])); // Filter out invalid rows

      setHeatmapData(data);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
      </div>

      {/* Map Panel */}
      <div className="h-96 rounded-md overflow-hidden">
        <MapContainer
          center={[-7.5685, 110.8745]} // Default position
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {heatmapData.length > 0 && <HeatmapLayer data={heatmapData} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default Home;

// const Home = () => {
//   return (
    
//     <div className="space-y-4">
//       {/* Top Boxes */}
//       <div className="grid grid-cols-4 gap-4">
//         {/* 1つのボックスは4列幅中の3列分を占有 */}
//         <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
//         <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
//         <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
//         {/* 一番右の空白部分（スタイルなし） */}
//       </div>

//       {/* Main Panel */}
//       {/* <div className="bg-gray-300 h-96 rounded-md"></div> */}
//       <div className="h-96 rounded-md overflow-hidden">
//         <iframe
//           width="100%"
//           height="100%"
//           // src="https://www.openstreetmap.org/export/embed.html?bbox=105.29296875%2C-16.13026201203474%2C118.52050781250001%2C-0.19775351362548124&amp;layer=mapnik"
//           // src="https://www.openstreetmap.org/export/embed.html?bbox=110.334%2C-7.825%2C110.406%2C-7.769&amp;layer=mapnik"
//           src="https://www.openstreetmap.org/export/embed.html?bbox=110.360529%2C-7.807068%2C110.380529%2C-7.787068&amp&layer=mapnik"

//           style={{ border: "1px solid black" }}
//         ></iframe>
//         <div className="text-center mt-2">
//           <small>
//             <a
//               // href="https://www.openstreetmap.org/#map=6/-8.24/111.91"
//               // target="_blank"
//               // rel="noopener noreferrer"
//               // className="text-blue-600 hover:underline"
//               href="https://www.openstreetmap.org/#map=15/-7.797068/110.370529"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 hover:underline"
//             >
//               大きな地図を表示
//             </a>
//           </small>
//         </div>
//       </div>

//     </div>

//   );
// };

// export default Home;
