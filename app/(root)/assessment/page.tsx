"use client"
// pages/index.tsx
//import Layout from "../layout";
import React from "react";
import Button from "@/app/components/button";
import { Plus } from "lucide-react"

const Home = () => {
  const handleClick = () => {
    console.log('Button clicked');
  }
  return (
    
    <div className="items-center space-x-4">
      {/* Top Boxes */}
      <Button onClick={handleClick} color="#003C7C" className="flex items-center">
        <Plus size={15} className="text-white hover:text-green-500 transition-colors"/>
        Add Assessment</Button>
      
      {/* Main Panel */}
      {/* <div className="bg-gray-300 h-96 rounded-md"></div> */}
    </div>

  );
};

export default Home;
