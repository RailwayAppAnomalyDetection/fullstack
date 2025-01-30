"use client";

import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  color?: string; // Accepts hex, rgb, etc.
  className?: string;
}

const Button = ({ children, onClick, color = "#3498db", className = "" }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      data-color={color} // Store the original color in a custom attribute
      className={`text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${className}`}
      style={{ backgroundColor: color }} // Set initial color dynamically
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "black")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = color || "#3498db")}
    >
      {children}
    </button>
  );
};

export default Button;
