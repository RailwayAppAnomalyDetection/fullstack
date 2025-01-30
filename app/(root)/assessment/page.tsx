"use client"
// pages/index.tsx
//import Layout from "../layout";
import React from "react";
import Button from "@/app/components/button";

const Home = () => {
  const handleClick = () => {
    console.log('Button clicked');
  }
  return (
    
    <div className="space-y-4">
      {/* Top Boxes */}
      <Button onClick={handleClick} color="#003C7C">Click Me</Button>
      
      {/* Main Panel */}
      {/* <div className="bg-gray-300 h-96 rounded-md"></div> */}
    </div>

  );
};

export default Home;
