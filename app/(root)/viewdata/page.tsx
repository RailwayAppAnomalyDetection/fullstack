"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"; //Import Leaflet's CSS for styling
import { useEffect, useState } from "react"; //React hooks for state and side effects
import SpeedBox from "@/app/components/SpeedBox"; //Custom componenet for displaying RCI counts
import { Crosshair } from "lucide-react"; //Icon

//Defining type of data for a single data item in the dataset
type DataItem = {
  Ride_Comfort_Index: number; //ride comfort index value
  latitude: number; //latitude of the location
  longitude: number; // Longitude of the location
};

//Function to determine the colot of marker based on the value og Ride Comfort Index
// @param Ride_Comfort_Index: number - The value of Ride Comfort Index
// @returns string - The color code for the marker
const getColorByIndex = (Ride_Comfort_Index: number): string => {
  if (Ride_Comfort_Index < 1) return "blue";
  if (Ride_Comfort_Index < 2) return "green";
  if (Ride_Comfort_Index < 3) return "yellow";
  if (Ride_Comfort_Index < 4) return "orange";
  if (Ride_Comfort_Index < 5) return "red";
  return "darkred";
};

// Custom component to handle map interactions like zooming and focusing 
// @param data - Array of data points containing latitude, longitude, and RCI
// @param focusHighest - Boolean flag whether to focus on the location with the highest RCI
const MapController = ({ data, focusHighest }: { data: DataItem[], focusHighest: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (data.length > 0) {
      if (focusHighest) {
        // Find the location with highest RCI
        const highestRCI = data.reduce((prev, current) => {
          return prev.Ride_Comfort_Index > current.Ride_Comfort_Index ? prev : current;
        });
        
        // Zoom to the highest RCI location
        map.setView([highestRCI.latitude, highestRCI.longitude], 18);
      } else {
        const latitudes = data.map((item) => item.latitude);
        const longitudes = data.map((item) => item.longitude);
        const southWest: [number, number] = [Math.min(...latitudes), Math.min(...longitudes)];
        const northEast: [number, number] = [Math.max(...latitudes), Math.max(...longitudes)];
        map.fitBounds([southWest, northEast], { padding: [50, 50] });
      }
    }
  }, [data, map, focusHighest]); //Rerun effect when data or focusHighest changes

  return null; //THis component does not render anything
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

  //Fetch data from the backend API on component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/map-data")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        setData(jsonData);

        //Calculate counts of RCI values in different ranges
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
        setRciCounts(counts);//update RCI counts
      })
      .catch((error) => console.error("Error loading map data:", error));
  }, []);

  const handleFocusHighest = () => {
    setFocusHighest(prev => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Display boxes showing counts for different RCI ranges*/}
      <div className="grid grid-cols-6 gap-4">
        <SpeedBox title="RCI < 1" value={rciCounts.lessThan1} unit="values" />
        <SpeedBox title="1 ≤ RCI < 2" value={rciCounts.from1To2} unit="values" />
        <SpeedBox title="2 ≤ RCI < 3" value={rciCounts.from2To3} unit="values" />
        <SpeedBox title="3 ≤ RCI < 4" value={rciCounts.from3To4} unit="values" />
        <SpeedBox title="4 ≤ RCI < 5" value={rciCounts.from4To5} unit="values" />
        <SpeedBox title="RCI > 5" value={rciCounts.greaterOrEqua5} unit="values" />
      </div>

      
      {/* Button to toggle focus on the highest RCI location*/}
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
          {/*Render a CircleMarker for each data point*/}
          {data.map((item, index) => (
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
          ))}
          {/* Include the MapController to handle map interactions*/}
          <MapController data={data} focusHighest={focusHighest} />
        </MapContainer>
      </div>
    </div>
  );
};

export default ViewData;