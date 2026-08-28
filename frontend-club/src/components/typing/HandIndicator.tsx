import React from 'react';
import { motion } from 'framer-motion';

// Maps characters to specific fingers
const FINGER_MAP: Record<string, string> = {
  'q': 'l-pinky', 'a': 'l-pinky', 'z': 'l-pinky', '1': 'l-pinky',
  'w': 'l-ring', 's': 'l-ring', 'x': 'l-ring', '2': 'l-ring',
  'e': 'l-middle', 'd': 'l-middle', 'c': 'l-middle', '3': 'l-middle',
  'r': 'l-index', 'f': 'l-index', 'v': 'l-index', '4': 'l-index', 't': 'l-index', 'g': 'l-index', 'b': 'l-index', '5': 'l-index',
  'y': 'r-index', 'h': 'r-index', 'n': 'r-index', '6': 'r-index', 'u': 'r-index', 'j': 'r-index', 'm': 'r-index', '7': 'r-index',
  'i': 'r-middle', 'k': 'r-middle', ',': 'r-middle', '8': 'r-middle',
  'o': 'r-ring', 'l': 'r-ring', '.': 'r-ring', '9': 'r-ring',
  'p': 'r-pinky', ';': 'r-pinky', '/': 'r-pinky', '0': 'r-pinky', '-': 'r-pinky', '=': 'r-pinky', '[': 'r-pinky', ']': 'r-pinky', "'": 'r-pinky',
  ' ': 'thumb'
};

interface HandIndicatorProps {
  expectedChar: string;
}

export const HandIndicator: React.FC<HandIndicatorProps> = ({ expectedChar }) => {
  const targetFinger = FINGER_MAP[expectedChar.toLowerCase()] || 'none';

  const fingers = [
    { id: 'l-pinky', x: 20, y: 40, height: 40 },
    { id: 'l-ring', x: 45, y: 20, height: 60 },
    { id: 'l-middle', x: 70, y: 10, height: 70 },
    { id: 'l-index', x: 95, y: 25, height: 55 },
    { id: 'thumb', x: 130, y: 80, height: 30 }, // Left thumb
    { id: 'thumb', x: 230, y: 80, height: 30 }, // Right thumb
    { id: 'r-index', x: 265, y: 25, height: 55 },
    { id: 'r-middle', x: 290, y: 10, height: 70 },
    { id: 'r-ring', x: 315, y: 20, height: 60 },
    { id: 'r-pinky', x: 340, y: 40, height: 40 },
  ];

  return (
    <div className="relative w-[380px] h-[150px] mx-auto opacity-70">
      {/* Base Hands SVG outline could go here, for now we use abstract pills */}
      <svg width="380" height="150" viewBox="0 0 380 150">
        {/* Left Hand Palm */}
        <path d="M 20 80 Q 70 120 130 110 L 110 150 L 20 150 Z" fill="var(--secondary)" stroke="var(--border)" strokeWidth="2" />
        {/* Right Hand Palm */}
        <path d="M 360 80 Q 310 120 250 110 L 270 150 L 360 150 Z" fill="var(--secondary)" stroke="var(--border)" strokeWidth="2" />
        
        {fingers.map((f, i) => {
          const isActive = f.id === targetFinger;
          return (
            <motion.rect
              key={i}
              x={f.x}
              y={f.y}
              width="20"
              height={f.height}
              rx="10"
              fill={isActive ? "var(--primary)" : "var(--secondary)"}
              stroke="var(--border)"
              strokeWidth="2"
              animate={{ 
                fill: isActive ? "var(--primary)" : "var(--secondary)",
                y: isActive ? f.y - 10 : f.y
              }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          );
        })}
      </svg>
    </div>
  );
};
