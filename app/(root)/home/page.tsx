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

interface PapaParseError {
  message: string;
  type: string;
  code: string;
  row?: number;
}

const Home = () => {
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  const [maxComfortIndex, setMaxComfortIndex] = useState<number | null>(null);
  const [minComfortCoord, setMinComfortCoord] = useState<string | null>(null);
  const [maxComfortCoord, setMaxComfortCoord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    setIsProcessing(true);
    setError(null);
  
    try {
      // Add file type validation
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }
  
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('http://localhost:5000/calculate-rci', {
        method: 'POST',
        body: formData,
      });
  
      // Add detailed error logging
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
  
      const processedBlob = await response.blob();
      const text = await processedBlob.text();
      
      Papa.parse<DataRow>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<DataRow>) => {
          if (results.data && results.data.length > 0) {
            calculateStatistics(results.data);
          } else {
            setError('No valid data found in the file');
          }
        },
        error: (error: PapaParseError) => {
          console.error('Parse Error:', error);
          setError(`Failed to parse CSV: ${error.message}`);
        }
      } as Papa.ParseConfig<DataRow>);
  
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
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
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        {/* 1つのボックスは4列幅中の3列分を占有 */}
        <div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isProcessing}/>
          {isProcessing && <span>Processing...</span>}
          {error && <span className="text-red-500">{error}</span>}
        </div>
        
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