"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet's CSS for styling
import { useEffect, useState } from "react"; // React hooks for state and side effects
import SpeedBox from "@/app/components/SpeedBox"; // Custom component for displaying RCI counts
import { Crosshair } from "lucide-react"; // Icon

// Defining type of data for a single data item in the dataset
type DataItem = {
  Ride_Comfort_Index: number; // ride comfort index value
  latitude: number; // latitude of the location
  longitude: number; // Longitude of the location
};

// Function to determine the color of marker based on the value of Ride Comfort Index
const getColorByIndex = (Ride_Comfort_Index: number): string => {
  console.log(`getColorByIndex called with RCI: ${Ride_Comfort_Index}`);
  if (Ride_Comfort_Index < 1) return "blue";
  if (Ride_Comfort_Index < 2) return "green";
  if (Ride_Comfort_Index < 3) return "yellow";
  if (Ride_Comfort_Index < 4) return "orange";
  if (Ride_Comfort_Index < 5) return "red";
  return "darkred";
};

// Custom component to handle map interactions like zooming and focusing
const MapController = ({ data, focusHighest }: { data: DataItem[], focusHighest: boolean }) => {
  const map = useMap();
  useEffect(() => {
    
    console.log("MapController useEffect triggered");
    if (data.length > 0) {
      if (focusHighest) {
        console.log("Focusing on the highest RCI location");
        // Find the location with highest RCI
        const highestRCI = data.reduce((prev, current) => {
          console.log(`Comparing RCI: prev=${prev.Ride_Comfort_Index}, current=${current.Ride_Comfort_Index}`);
          return prev.Ride_Comfort_Index > current.Ride_Comfort_Index ? prev : current;
        });
        console.log(`Highest RCI found: ${highestRCI.Ride_Comfort_Index} at [${highestRCI.latitude}, ${highestRCI.longitude}]`);
        
        // Zoom to the highest RCI location
        map.setView([highestRCI.latitude, highestRCI.longitude], 18);
      } else {
        console.log("Fitting bounds to include all data points");
        const latitudes = data.map((item) => item.latitude);
        const longitudes = data.map((item) => item.longitude);
        const southWest: [number, number] = [Math.min(...latitudes), Math.min(...longitudes)];
        const northEast: [number, number] = [Math.max(...latitudes), Math.max(...longitudes)];
        console.log(`Calculated bounds: SouthWest=${southWest}, NorthEast=${northEast}`);
        map.fitBounds([southWest, northEast], { padding: [50, 50] });
      }
    } else {
      console.log("No data available to adjust map view");
    }
  }, [data, map, focusHighest]); // Rerun effect when data or focusHighest changes
  return null; // This component does not render anything
};

const ViewData = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [focusHighest, setFocusHighest] = useState(false);
  const [rciCounts, setRciCounts] = useState({
    lessThan1: 0,
    from1To2: 0,
    from2To3: 0,
    from3To4: 0,
    from4To5: 0,
    greaterOrEqua5: 0,
  });

  // Fetch data from the backend API on component mount
  useEffect(() => {
    console.log("useEffect triggered: Fetching map data from API");
  fetch(`http://localhost:5000/api/map-data?t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
    .then((response) => {
      console.log(`API response received with status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((jsonData) => {
      console.log("Raw data received:", JSON.stringify(jsonData).substring(0, 200));
      console.log("Number of points:", jsonData.length);
      console.log("Sample of first few points:", jsonData.slice(0, 3));
      setData(jsonData);


        // Calculate counts of RCI values in different ranges
        const counts = {
          lessThan1: jsonData.filter((item: DataItem) => item.Ride_Comfort_Index < 1).length,
          from1To2: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 1 && item.Ride_Comfort_Index < 2
          ).length,
          from2To3: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 2 && item.Ride_Comfort_Index < 3
          ).length,
          from3To4: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 3 && item.Ride_Comfort_Index < 4
          ).length,
          from4To5: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 4 && item.Ride_Comfort_Index < 5
          ).length,
          greaterOrEqua5: jsonData.filter((item: DataItem) => item.Ride_Comfort_Index >= 5).length,
        };
        console.log("RCI counts calculated:", counts);
        setRciCounts(counts); // Update RCI counts
      })
      .catch((error) => {
        console.error("Error loading map data:", error);
      });
  }, []);

  const handleFocusHighest = () => {
    console.log("handleFocusHighest called. Toggling focusHighest state.");
    setFocusHighest(prev => !prev);
  };

  const refreshData = () => {
    fetch(`http://localhost:5000/api/map-data?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        // Recalculate counts...
      })
      .catch(error => console.error("Error refreshing data:", error));
  };

  return (
    <div className="space-y-4">
      {/* Display boxes showing counts for different RCI ranges */}
      <div className="grid grid-cols-6 gap-4">
        <SpeedBox title="RCI < 1" value={rciCounts.lessThan1} unit="values" />
        <SpeedBox title="1 ≤ RCI < 2" value={rciCounts.from1To2} unit="values" />
        <SpeedBox title="2 ≤ RCI < 3" value={rciCounts.from2To3} unit="values" />
        <SpeedBox title="3 ≤ RCI < 4" value={rciCounts.from3To4} unit="values" />
        <SpeedBox title="4 ≤ RCI < 5" value={rciCounts.from4To5} unit="values" />
        <SpeedBox title="RCI > 5" value={rciCounts.greaterOrEqua5} unit="values" />
      </div>

      {/* Button to toggle focus on the highest RCI location */}
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

      {/* Map container to display the data points */}
      <div className="h-96 rounded-md overflow-hidden">
        <MapContainer center={[-7.797068, 110.370529]} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {/* Render a CircleMarker for each data point */}
          {data.map((item, index) => {
            console.log(`Rendering CircleMarker for data point ${index}:`, item);
            return (
              <CircleMarker
                key={index}
                center={[item.latitude, item.longitude]}
                radius={2.5}
                color={getColorByIndex(item.Ride_Comfort_Index)}
                fillColor={getColorByIndex(item.Ride_Comfort_Index)}
                fillOpacity={0.7}
              >
                <Popup>
                  <strong>Ride Comfort Index:</strong> {item.Ride_Comfort_Index.toFixed(2)}
                </Popup>
              </CircleMarker>
            );
          })}
          {/* Include the MapController to handle map interactions */}
          <MapController data={data} focusHighest={focusHighest} />
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