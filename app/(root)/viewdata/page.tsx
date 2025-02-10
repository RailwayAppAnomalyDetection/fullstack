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
  if (Ride_Comfort_Index < 5) return "blue";
  if (Ride_Comfort_Index < 10) return "green"; 
  if (Ride_Comfort_Index < 20) return "yellow"; 
  if (Ride_Comfort_Index < 50) return "orange"; 
  return "red"; 
};

const ViewData = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [rciCounts, setRciCounts] = useState({
    lessThan5: 0,
    from5To10: 0,
    from10To20: 0,
    from20To50: 0,
    greaterOrEqual50: 0,
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
          lessThan5: jsonData.filter((item: DataItem) => item.Ride_Comfort_Index < 5).length,
          from5To10: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 5 && item.Ride_Comfort_Index < 10
          ).length,
          from10To20: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 10 && item.Ride_Comfort_Index < 20
          ).length,
          from20To50: jsonData.filter(
            (item: DataItem) => item.Ride_Comfort_Index >= 20 && item.Ride_Comfort_Index < 50
          ).length,
          greaterOrEqual50: jsonData.filter((item: DataItem) => item.Ride_Comfort_Index >= 50).length,
        };
        setRciCounts(counts);
      })
      .catch((error) => console.error("Error loading map data:", error));
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-5 gap-4">
        <SpeedBox title="RCI < 5" value={rciCounts.lessThan5} unit="values" />
        <SpeedBox title="5 ≤ RCI < 10" value={rciCounts.from5To10} unit="values" />
        <SpeedBox title="10 ≤ RCI < 20" value={rciCounts.from10To20} unit="values" />
        <SpeedBox title="20 ≤ RCI < 50" value={rciCounts.from20To50} unit="values" />
        <SpeedBox title="RCI ≤ 50" value={rciCounts.greaterOrEqual50} unit="values" />
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
     
    </div>
  );
};

export default ViewData;
