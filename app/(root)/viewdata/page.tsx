"use client"; // Leaflet を動的レンダリングで使用するため

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

type DataItem = {
  Ride_Comfort_Index: number;
  latitude: number;
  longitude: number;
};

const ViewData = () => {
  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    // CSV ファイルの読み込み
    fetch("/output_select.csv")
      .then((response) => response.text())
      .then((csvData) => {
        const rows = csvData.split("\n").slice(1); // ヘッダーをスキップ
        const parsedData: DataItem[] = rows
          .map((row) => {
            const [Ride_Comfort_Index, latitude, longitude] = row.split(",");
            if (Ride_Comfort_Index && latitude && longitude) {
              return {
                Ride_Comfort_Index: parseFloat(Ride_Comfort_Index),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              };
            }
            return null;
          })
          .filter((item): item is DataItem => item !== null); // null を除外
        setData(parsedData);
      })
      .catch((error) => console.error("Error loading CSV data:", error));
  }, []);

  return (
    <div className="h-96 w-full">
      <MapContainer center={[-7.797068, 110.370529]} zoom={15} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((item, index) => (
          <CircleMarker
            key={index}
            center={[item.latitude, item.longitude]}
            radius={1} // 点のサイズを設定
            color="blue"
            fillColor="blue"
            fillOpacity={0.7}
          >
            <Popup>
              <strong>Ride Comfort Index:</strong> {item.Ride_Comfort_Index.toFixed(2)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ViewData;