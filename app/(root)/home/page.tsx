"use client"
// pages/index.tsx
//import Layout from "../layout";
import { Gauge } from "lucide-react";
import Papa from "papaparse";
import React, { ChangeEvent, useState } from 'react'

interface DataRow {
  speed: number;
  Ride_Comfort_Index: number;
  coordinate: string;
} 

const Home = () => {
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  const [maxComfortIndex, setMaxComfortIndex] = useState<number | null>(null);
  const [minComfortCoord, setMinComfortCoord] = useState<string | null>(null);
  const [maxComfortCoord, setMaxComfortCoord] = useState<string | null>(null);

  const handleFileUpload = (event : ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; // Use optional chaining to safely access files
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const data = results.data as DataRow[];
          calculateStatistics(data);
        },
      });
    }
  };

  const calculateStatistics = (data: DataRow[]) => {
    if (data.length === 0) return;

    // Calculate max speed
    const speeds = data.map(row => row.speed).filter(speed => 
      speed !== undefined && speed !== null
    );
    if (speeds.length > 0) {
      const maxSpeedValue = Math.max(...speeds);
      setMaxSpeed(maxSpeedValue);
    }

    // Calculate max comfort index and related coordinates
    const comfortData = data.filter(row => 
      row.Ride_Comfort_Index !== undefined && 
      row.Ride_Comfort_Index !== null &&
      row.coordinate !== undefined &&
      row.coordinate !== null
    );

    if (comfortData.length > 0) {
      // Find max comfort index
      const maxComfort = Math.max(...comfortData.map(row => row.Ride_Comfort_Index));
      setMaxComfortIndex(maxComfort);

      // Find coordinates for min comfort index
      const minComfortRow = comfortData.reduce((min, row) => 
        row.Ride_Comfort_Index < min.Ride_Comfort_Index ? row : min
      );
      setMinComfortCoord(minComfortRow.coordinate);

      // Find coordinates for max comfort index
      const maxComfortRow = comfortData.reduce((max, row) => 
        row.Ride_Comfort_Index > max.Ride_Comfort_Index ? row : max
      );
      setMaxComfortCoord(maxComfortRow.coordinate);
    }
  };

  return (
    
    <div className="space-y-4">
      <input type="file" accept=".csv" onChange={handleFileUpload}/>
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1つのボックスは4列幅中の3列分を占有 */}
        <div className="bg-blue-900 h-24 rounded-md col-span-1 p-4">
          <div className="flex items-center text-white font-medium"> Max Speed
            
              <button className="w-full flex items-center gap-2 p-3 rounded">
              <Gauge className="w-5 h-5" /> 
              <span className="text-white font-medium">Assessment</span>
              </button>
          
          </div>
          <div className="text-white text-2xl "> {maxSpeed?.toFixed(2) || 'N/A'} m/s </div>
        </div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1 p-4">
          <div className="text-white font-medium">Max Ride Comfort Index</div>
          <div className="text-white"> {maxComfortIndex || 'N/A'} </div>
        </div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1">
          <div className="text-white font-medium">Min Comfort Coordinate</div>
          <div className="text-white"> {minComfortCoord || 'N/A'} </div>
        </div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1">
          <div className="text-white font-medium">Max Comfort Coordinate</div>
          <div className="text-white"> {maxComfortCoord || 'N/A'} </div>
        </div>
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