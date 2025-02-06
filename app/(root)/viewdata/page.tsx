// "use client";

// import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import { useEffect, useState } from "react";

// type DataItem = {
//   Ride_Comfort_Index: number;
//   latitude: number;
//   longitude: number;
// };

// const getColorByIndex = (Ride_Comfort_Index: number): string => {
//   if (Ride_Comfort_Index < 5) return "blue";
//   if (Ride_Comfort_Index < 10) return "green"; // 快適
//   if (Ride_Comfort_Index < 20) return "yellow"; // やや快適
//   if (Ride_Comfort_Index < 50) return "orange"; // 不快
//   return "red"; // 非常に不快
// };

// const ViewData = () => {
//   const [data, setData] = useState<DataItem[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     // アップロードされたCSVファイルの読み込み
//     fetch('/api/uploaded-data')
//       .then((response) => {
//         if (!response.ok) {
//           throw new Error("ファイルの読み込みに失敗しました。");
//         }
//         return response.text();
//       })
//       .then((csvData) => {
//         const rows = csvData.split("\n").slice(1); // ヘッダーをスキップ
//         const parsedData: DataItem[] = rows
//           .map((row: string) => {
//             const [Ride_Comfort_Index, latitude, longitude] = row.split(",");
//             // すべての値が存在することを確認
//             if (Ride_Comfort_Index && latitude && longitude) {
//               return {
//                 Ride_Comfort_Index: parseFloat(Ride_Comfort_Index),
//                 latitude: parseFloat(latitude),
//                 longitude: parseFloat(longitude),
//               };
//             }
//             return null; // 不正な行は null を返す
//           })
//           .filter((item): item is DataItem => item !== null); // null を除外

//         if (parsedData.length === 0) {
//           throw new Error("有効なデータが見つかりませんでした。");
//         }

//         setData(parsedData);
//         setError(null); // エラーをクリア
//       })
//       .catch((error) => {
//         console.error("Error loading CSV data:", error);
//         setError(error.message); // エラーメッセージを設定
//       });
//   }, []);

//   return (
//     <div className="h-96 w-full">
//       {error && <p className="text-red-500">{error}</p>}
//       <MapContainer center={[-7.56853294, 110.87451935]} zoom={15} className="h-full w-full">
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         {data.map((item, index) => (
//           <CircleMarker
//             key={index}
//             center={[item.latitude, item.longitude]}
//             radius={5} // 点のサイズを設定
//             color={getColorByIndex(item.Ride_Comfort_Index)}
//             fillColor={getColorByIndex(item.Ride_Comfort_Index)}
//             fillOpacity={0.7}
//           >
//             <Popup>
//               <strong>Ride Comfort Index:</strong> {item.Ride_Comfort_Index.toFixed(2)}
//             </Popup>
//           </CircleMarker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default ViewData; 

"use client"; // クライアントコンポーネントであることを明示

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

type DataItem = {
  Ride_Comfort_Index: number;
  latitude: number;
  longitude: number;
};

const getColorByIndex = (Ride_Comfort_Index: number): string => {
  if (Ride_Comfort_Index < 5) return "blue";
  if (Ride_Comfort_Index < 10) return "green"; // 快適
  if (Ride_Comfort_Index < 20) return "yellow"; // やや快適
  if (Ride_Comfort_Index < 50) return "orange"; // 不快
  return "red"; // 非常に不快
};

const ViewData = () => {
  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    // Fetch map data from Flask backend
    fetch("http://localhost:5000/api/map-data") // Replace with your Flask server URL
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        setData(jsonData); // Set the fetched data
      })
      .catch((error) => console.error("Error loading map data:", error));
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Boxes */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
        <div className="bg-blue-900 h-24 rounded-md col-span-1"></div>
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
              radius={2.5} // 点のサイズを設定
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
