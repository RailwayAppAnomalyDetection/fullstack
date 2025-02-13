"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import SpeedBox from "@/app/components/SpeedBox";
import { Crosshair } from "lucide-react";

type DataItem = {
  Ride_Comfort_Index: number;
  latitude: number;
  longitude: number;
};

type GridCell = {
  avgRCI: number;
  centerLat: number;
  centerLng: number;
  count: number;
};

const getColorByIndex = (Ride_Comfort_Index: number): string => {
  if (Ride_Comfort_Index < 1) return "blue";
  if (Ride_Comfort_Index < 2) return "green";
  if (Ride_Comfort_Index < 3) return "yellow";
  if (Ride_Comfort_Index < 4) return "orange";
  if (Ride_Comfort_Index < 5) return "red";
  return "darkred";
};

// Function to convert meters to degrees (approximate)
const metersToDegreesLat = (meters: number): number => {
  return meters / 111111; // 1 degree of latitude is approximately 111,111 meters
};

const metersToDegreesLng = (meters: number, lat: number): number => {
  return meters / (111111 * Math.cos(lat * Math.PI / 180));
};

const groupDataIntoGrid = (data: DataItem[], gridSize: number = 100): GridCell[] => {
  const gridCells: Map<string, GridCell> = new Map();
  
  data.forEach(point => {
    // Calculate grid cell size in degrees
    const latStep = metersToDegreesLat(gridSize);
    const lngStep = metersToDegreesLng(gridSize, point.latitude);
    
    // Calculate grid cell indices
    const latIndex = Math.floor(point.latitude / latStep);
    const lngIndex = Math.floor(point.longitude / lngStep);
    const cellKey = `${latIndex}-${lngIndex}`;
    
    // Calculate cell center coordinates
    const centerLat = (latIndex * latStep) + (latStep / 2);
    const centerLng = (lngIndex * lngStep) + (lngStep / 2);
    
    if (gridCells.has(cellKey)) {
      const cell = gridCells.get(cellKey)!;
      cell.avgRCI = (cell.avgRCI * cell.count + point.Ride_Comfort_Index) / (cell.count + 1);
      cell.count += 1;
    } else {
      gridCells.set(cellKey, {
        avgRCI: point.Ride_Comfort_Index,
        centerLat,
        centerLng,
        count: 1
      });
    }
  });
  
  return Array.from(gridCells.values());
};

const MapController = ({ data, focusHighest }: { data: GridCell[], focusHighest: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (data.length > 0) {
      if (focusHighest) {
        const highestRCI = data.reduce((prev, current) => 
          prev.avgRCI > current.avgRCI ? prev : current
        );
        map.setView([highestRCI.centerLat, highestRCI.centerLng], 18);
      } else {
        const latitudes = data.map((item) => item.centerLat);
        const longitudes = data.map((item) => item.centerLng);
        const southWest: [number, number] = [Math.min(...latitudes), Math.min(...longitudes)];
        const northEast: [number, number] = [Math.max(...latitudes), Math.max(...longitudes)];
        map.fitBounds([southWest, northEast], { padding: [50, 50] });
      }
    }
  }, [data, map, focusHighest]);
  
  return null;
};

const ViewData = () => {
  const [gridData, setGridData] = useState<GridCell[]>([]);
  const [focusHighest, setFocusHighest] = useState(false);
  const [rciCounts, setRciCounts] = useState({
    lessThan1: 0,
    from1To2: 0,
    from2To3: 0,
    from3To4: 0,
    from4To5: 0,
    greaterOrEqua5: 0,
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/map-data?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(jsonData => {
        const gridCells = groupDataIntoGrid(jsonData);
        setGridData(gridCells);

        // Calculate counts based on grid cell averages
        const counts = {
          lessThan1: gridCells.filter(cell => cell.avgRCI < 1).length,
          from1To2: gridCells.filter(cell => cell.avgRCI >= 1 && cell.avgRCI < 2).length,
          from2To3: gridCells.filter(cell => cell.avgRCI >= 2 && cell.avgRCI < 3).length,
          from3To4: gridCells.filter(cell => cell.avgRCI >= 3 && cell.avgRCI < 4).length,
          from4To5: gridCells.filter(cell => cell.avgRCI >= 4 && cell.avgRCI < 5).length,
          greaterOrEqua5: gridCells.filter(cell => cell.avgRCI >= 5).length,
        };
        setRciCounts(counts);
      })
      .catch(error => console.error("Error loading map data:", error));
  }, []);

  const handleFocusHighest = () => setFocusHighest(prev => !prev);

  const refreshData = () => {
    fetch(`http://localhost:5000/api/map-data?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => response.json())
      .then(jsonData => {
        const gridCells = groupDataIntoGrid(jsonData);
        setGridData(gridCells);
      })
      .catch(error => console.error("Error refreshing data:", error));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-4">
        <SpeedBox title="RCI < 1" value={rciCounts.lessThan1} unit="areas" />
        <SpeedBox title="1 ≤ RCI < 2" value={rciCounts.from1To2} unit="areas" />
        <SpeedBox title="2 ≤ RCI < 3" value={rciCounts.from2To3} unit="areas" />
        <SpeedBox title="3 ≤ RCI < 4" value={rciCounts.from3To4} unit="areas" />
        <SpeedBox title="4 ≤ RCI < 5" value={rciCounts.from4To5} unit="areas" />
        <SpeedBox title="RCI > 5" value={rciCounts.greaterOrEqua5} unit="areas" />
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleFocusHighest}
          className="
            flex items-center px-4 py-2 
            bg-blue-600 text-white 
            rounded-lg shadow-lg 
            hover:bg-blue-700 
            active:bg-blue-800 
            transform hover:scale-105 
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          "
        >
          <Crosshair/>
          <span>{focusHighest ? "Show Full Map" : "Focus on Highest RCI"}</span>
        </button>
      </div>

      <div className="h-96 rounded-md overflow-hidden">
        <MapContainer center={[-7.797068, 110.370529]} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {gridData.map((cell, index) => (
            <CircleMarker
              key={index}
              center={[cell.centerLat, cell.centerLng]}
              radius={5} // Increased radius for better visibility of grid cells
              color={getColorByIndex(cell.avgRCI)}
              fillColor={getColorByIndex(cell.avgRCI)}
              fillOpacity={0.7}
            >
              <Popup>
                <div>
                  <strong>Average RCI:</strong> {cell.avgRCI.toFixed(2)}<br/>
                  <strong>Number of readings:</strong> {cell.count}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <MapController data={gridData} focusHighest={focusHighest} />
        </MapContainer>
      </div>
      <button 
        onClick={refreshData}
        className="px-4 py-2 bg-green-600 text-white rounded-lg"
      >
        Refresh Data
      </button>
    </div>
  );
};

export default ViewData;