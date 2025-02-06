import React, { ReactNode } from "react";

interface SpeedBoxProps {
    title: ReactNode;
    value?: number | string;
    unit?: string;
}

const SpeedBox: React.FC<SpeedBoxProps> = ({ title, value, unit }) => {
    return(
        <div className="bg-blue-300 rounded-2xl h-24 col-span-1 p-4 drop-shadow-md flex flex-col justify-center items-center">
      <div className="text-blue-900 font-semibold flex items-center  text-lg gap-3">{title}</div>
      <div className="bg-blue-900 text-white  px-4 py-2 rounded-xl shadow-md">
        {value !== undefined ? `${value} ${unit}` : "N/A"}
      </div>
    </div>
  
    );
};

export default SpeedBox