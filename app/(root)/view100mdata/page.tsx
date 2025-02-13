"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import SpeedBox from "@/app/components/SpeedBox";
import { Crosshair, Filter } from "lucide-react";

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

// Function to calculate circle radius based on count
const getRadiusByCount = (count: number): number => {
  // Min radius is 3, max is 12, logarithmic scale
  return Math.max(3, Math.min(12, 3 * Math.log2(count + 1)));
};

// Function to calculate opacity based on count
const getOpacityByCount = (count: number): number => {
  // Min opacity is 0.3, max is 0.9, linear scale
  return Math.min(0.9, 0.3 + (count / 50));
};

const metersToDegreesLat = (meters: number): number => {
  return meters / 111111;
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
  const [filteredData, setFilteredData] = useState<GridCell[]>([]);
  const [focusHighest, setFocusHighest] = useState(false);
  const [minReadings, setMinReadings] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [rciCounts, setRciCounts] = useState({
    lessThan1: 0,
    from1To2: 0,
    from2To3: 0,
    from3To4: 0,
    from4To5: 0,
    greaterOrEqua5: 0,
  });

  // Function to apply filters
  const applyFilters = (data: GridCell[]) => {
    const filtered = data.filter(cell => cell.count >= minReadings);
    setFilteredData(filtered);
    
    // Update counts based on filtered data
    const counts = {
      lessThan1: filtered.filter(cell => cell.avgRCI < 1).length,
      from1To2: filtered.filter(cell => cell.avgRCI >= 1 && cell.avgRCI < 2).length,
      from2To3: filtered.filter(cell => cell.avgRCI >= 2 && cell.avgRCI < 3).length,
      from3To4: filtered.filter(cell => cell.avgRCI >= 3 && cell.avgRCI < 4).length,
      from4To5: filtered.filter(cell => cell.avgRCI >= 4 && cell.avgRCI < 5).length,
      greaterOrEqua5: filtered.filter(cell => cell.avgRCI >= 5).length,
    };
    setRciCounts(counts);
  };

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
        applyFilters(gridCells);
      })
      .catch(error => console.error("Error loading map data:", error));
  }, []);

  // Apply filters when minReadings changes
  useEffect(() => {
    applyFilters(gridData);
  }, [minReadings, gridData]);

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
        applyFilters(gridCells);
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

      <div className="flex justify-between items-center">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          <Filter className="mr-2"/>
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
        </button>

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
          <Crosshair className="mr-2"/>
          <span>{focusHighest ? "Show Full Map" : "Focus on Highest RCI"}</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span>Minimum Readings:</span>
              <input
                type="number"
                min="1"
                value={minReadings}
                onChange={(e) => setMinReadings(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-1 border rounded"
              />
            </label>
            <div className="flex-grow"></div>
            <div className="text-sm text-gray-600">
              Showing {filteredData.length} of {gridData.length} areas
            </div>
          </div>
        </div>
      )}

      <div className="h-96 rounded-md overflow-hidden">
        <MapContainer center={[-7.797068, 110.370529]} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredData.map((cell, index) => (
            <CircleMarker
              key={index}
              center={[cell.centerLat, cell.centerLng]}
              radius={getRadiusByCount(cell.count)}
              color={getColorByIndex(cell.avgRCI)}
              fillColor={getColorByIndex(cell.avgRCI)}
              fillOpacity={getOpacityByCount(cell.count)}
            >
              <Popup>
                <div>
                  <strong>Average RCI:</strong> {cell.avgRCI.toFixed(2)}<br/>
                  <strong>Number of readings:</strong> {cell.count}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <MapController data={filteredData} focusHighest={focusHighest} />
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