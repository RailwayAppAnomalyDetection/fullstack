"use client"

import { Gauge } from "lucide-react";
import Papa from "papaparse";
import React, { ChangeEvent, useEffect, useState } from 'react'
import SpeedBox from "@/app/components/SpeedBox";

interface DataRow {
  speed: number;
  Ride_Comfort_Index: number;
  coordinate: string;
}

// interface PapaParseError {
//   message: string;
//   type: string;
//   code: string;
//   row?: number;
// }

const Home = () => {
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  const [maxComfortIndex, setMaxComfortIndex] = useState<number | null>(null);
  const [minComfortIndex, setMinComfortIndex] = useState<number | null>(null);
  const [minComfortCoord, setMinComfortCoord] = useState<string | null>(null);
  const [maxComfortCoord, setMaxComfortCoord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //State for accumulated data
  const [accumulatedData, setAccumulatedData] = useState<DataRow[]>([]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/calculate-rci', {
        method: 'POST',
        body: formData,
      });

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
          console.log("Parsed data sample:", results.data.slice(0, 5));
          if (results.data && results.data.length > 0) {
            //Accumulate the new data with eisting data
            setAccumulatedData(prevData => {
              const newData = [...prevData, ...results.data];
              calculateStatistics(newData); //Calculate statistics on all accumulated data
              return newData;
            });
          } else {
            setError('No valid data found in the file');
          }
        },
        error: (error: Error) => {
          console.error('Parse Error:', error);
          setError(`Failed to parse CSV: ${error.message}`);
        }
      });
      

    } catch (err) {
      console.error('Upload Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  //reset state variables
  const clearData = () => {
    setAccumulatedData([]);
    setMaxSpeed(null);
    setMaxComfortIndex(null);
    setMinComfortIndex(null);
    setMinComfortCoord(null);
    setMaxComfortCoord(null);
  }

  useEffect(() => {
    console.log("Accumulated data updated:", {
      totalRows: accumulatedData.length,
      sampleRow: accumulatedData.slice(0,5)
    });
  }, [accumulatedData]);
  const calculateStatistics = (data: DataRow[]) => {
    if (!data || data.length === 0) {
      console.warn("No data provided to calculateStatistics");
      return;
    }

    // Debug log
    console.log("Processing accumulated data:",{
      totalFiles: "Number of files processed so far",
      totalRows: data.length,
      sampleRows: data.slice(0,5)
    })

    console.log("Processing data for statistics:", {
      totalRows: data.length,
      sampleRow: data[0]
    });

    // Calculate max speed
    const validSpeeds = data
      .map(row => row.speed)
      .filter((speed): speed is number => 
        typeof speed === 'number' && !isNaN(speed) && speed > 0
      );

    if (validSpeeds.length > 0) {
      const maxSpeedValue = Math.max(...validSpeeds);
      setMaxSpeed(maxSpeedValue);
    }

    // Process comfort index data
    const comfortData = data.filter(row => 
      typeof row.Ride_Comfort_Index === 'number' && 
      !isNaN(row.Ride_Comfort_Index) &&
      row.coordinate
    );

    console.log("Filtered comfort data:", {
      totalComfortRows: comfortData.length,
      sample: comfortData.slice(0, 3)
    });

    if (comfortData.length > 0) {
      // Find max comfort index and its coordinate
      const maxRow = comfortData.reduce((max, current) => 
        (current.Ride_Comfort_Index > max.Ride_Comfort_Index) ? current : max
      );
      setMaxComfortIndex(maxRow.Ride_Comfort_Index);
      setMaxComfortCoord(maxRow.coordinate);

      // Find min comfort index and its coordinate
      const minRow = comfortData.reduce((min, current) => 
        (current.Ride_Comfort_Index < min.Ride_Comfort_Index) ? current : min
      );
      setMinComfortIndex(minRow.Ride_Comfort_Index);
      setMinComfortCoord(minRow.coordinate);

      console.log("Calculated comfort indices:", {
        max: {
          value: maxRow.Ride_Comfort_Index,
          coordinate: maxRow.coordinate
        },
        min: {
          value: minRow.Ride_Comfort_Index,
          coordinate: minRow.coordinate
        }
      });
    }
  };

  return (
    
    <div className="space-y-4">
      {/* Top Boxes */} 
      <div>
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileUpload}
          disabled={isProcessing}/>
          {isProcessing && <span>Processing...</span>}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      <div className="grid grid-cols-5 gap-4">
        {/* 1つのボックスは4列幅中の3列分を占有 */}
          <SpeedBox title={<><span className="flex items-center gap-3"><Gauge className="w-5 h-5"/>Max Speed</span></>} value={maxSpeed ?? undefined} unit="m/s" /> 
          <SpeedBox title={<><span className="flex items-center gap-3">Max Comfort Index</span></>} value={maxComfortIndex ?? undefined} unit="" />
          <SpeedBox title={<><span className="flex items-center gap-3">Min Comfort Index</span></>} value={minComfortIndex ?? undefined} unit="" />
          <SpeedBox title={<><span className="flex items-center gap-3">Min Comfort Coord</span></>} value={minComfortCoord ?? undefined} unit="" />
          <SpeedBox title={<><span className="flex items-center gap-3">Max Comfort Coord</span></>} value={maxComfortCoord ?? undefined} unit="" />
        
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
      <div>
      <button onClick={clearData} className="bg-red-500 text-white px-4 py-2 rounded">
        Reset Data
      </button>
      </div>
    </div>

  );
};

export default Home;