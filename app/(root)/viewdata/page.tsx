"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import SpeedBox from "@/app/components/SpeedBox";

type DataItem = {
  Ride_Comfort_Index: number;
  latitude: number;
  longitude: number;
};

const getColorByIndex = (Ride_Comfort_Index: number): string => {
  if (Ride_Comfort_Index < 1) return "blue";
  if (Ride_Comfort_Index < 2) return "green"; 
  if (Ride_Comfort_Index < 3) return "yellow"; 
  if (Ride_Comfort_Index < 4) return "orange"; 
  if (Ride_Comfort_Index < 5) return "red"; 
  return "darkred"; 
};

const ViewData = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [rciCounts, setRciCounts] = useState({
    lessThan1: 0,
    from1To2: 0,
    from2To3: 0,
    from3To4: 0,
    from4To5: 0,
    greaterOrEqua5: 0,
  });

  useEffect(() => {
    // Fetch map data from Flask backend
    fetch("http://localhost:5000/api/map-data")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        setData(jsonData);

        // Calculate counts for RCI ranges
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
        setRciCounts(counts);
      })
      .catch((error) => console.error("Error loading map data:", error));
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-6 gap-4">
        <SpeedBox title="RCI < 1" value={rciCounts.lessThan1} unit="values" />
        <SpeedBox title="1 ≤ RCI < 2" value={rciCounts.from1To2} unit="values" />
        <SpeedBox title="2 ≤ RCI < 3" value={rciCounts.from2To3} unit="values" />
        <SpeedBox title="3 ≤ RCI < 4" value={rciCounts.from3To4} unit="values" />

        <SpeedBox title="4 ≤ RCI < 5" value={rciCounts.from4To5} unit="values" />
        <SpeedBox title="RCI ≤ 5" value={rciCounts.greaterOrEqua5} unit="values" />
      </div>


      {/* Main Panel */}
      <div className="h-96 rounded-md overflow-hidden">
        <MapContainer center={[-7.797068, 110.370529]} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
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
        </MapContainer>
      </div>
      <div>
        <div className="bg-blue-500 h-10 flex items-center justify-center text-2xl font-semibold">{"< 5"}</div>
        <div className="bg-green-500 h-10 flex items-center justify-center text-2xl font-semibold">{"< 10"}</div>
        <div className="bg-yellow-500 h-10 flex items-center justify-center text-2xl font-semibold">{"< 15"}</div>
        <div className="bg-orange-500 h-10 flex items-center justify-center text-2xl font-semibold">{"< 20"}</div>
      </div>
    </div>
  );
};

export default ViewData;
