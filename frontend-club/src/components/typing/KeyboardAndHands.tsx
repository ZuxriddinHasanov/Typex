import React from 'react';
import { motion } from 'framer-motion';

const FINGER_COLORS: Record<string, string> = {
  'l-pinky': '#ec4899', // pink-500
  'l-ring': '#3b82f6',  // blue-500
  'l-middle': '#8b5cf6', // violet-500
  'l-index': '#14b8a6',  // teal-500
  'thumb': '#64748b',    // slate-500
  'r-index': '#14b8a6',
  'r-middle': '#8b5cf6',
  'r-ring': '#3b82f6',
  'r-pinky': '#ec4899',
};

const KEY_TO_FINGER: Record<string, string> = {
  '1': 'l-pinky', 'q': 'l-pinky', 'a': 'l-pinky', 'z': 'l-pinky',
  '2': 'l-ring', 'w': 'l-ring', 's': 'l-ring', 'x': 'l-ring',
  '3': 'l-middle', 'e': 'l-middle', 'd': 'l-middle', 'c': 'l-middle',
  '4': 'l-index', '5': 'l-index', 'r': 'l-index', 't': 'l-index', 'f': 'l-index', 'g': 'l-index', 'v': 'l-index', 'b': 'l-index',
  '6': 'r-index', '7': 'r-index', 'y': 'r-index', 'u': 'r-index', 'h': 'r-index', 'j': 'r-index', 'n': 'r-index', 'm': 'r-index',
  '8': 'r-middle', 'i': 'r-middle', 'k': 'r-middle', ',': 'r-middle',
  '9': 'r-ring', 'o': 'r-ring', 'l': 'r-ring', '.': 'r-ring',
  '0': 'r-pinky', '-': 'r-pinky', '=': 'r-pinky', 'p': 'r-pinky', '[': 'r-pinky', ']': 'r-pinky', '\\': 'r-pinky', ';': 'r-pinky', "'": 'r-pinky', '/': 'r-pinky',
  'space': 'thumb'
};

const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
  ['space']
];

interface KeyboardAndHandsProps {
  expectedChar: string;
  pressedChar: string | null;
  isError: boolean;
}

export const KeyboardAndHands: React.FC<KeyboardAndHandsProps> = ({ expectedChar, pressedChar, isError }) => {
  const expectedKey = expectedChar === ' ' ? 'space' : expectedChar.toLowerCase();
  const targetFinger = KEY_TO_FINGER[expectedKey] || 'none';

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-secondary/20 rounded-[40px] shadow-2xl border-4 border-secondary/50 w-full max-w-5xl mx-auto">
      
      {/* Keyboard */}
      <div className="flex flex-col items-center gap-2 w-full">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 w-full justify-center">
            {row.map((key, i) => {
              const isExpected = key === expectedKey;
              const isPressed = key === (pressedChar === ' ' ? 'space' : pressedChar?.toLowerCase());
              const finger = KEY_TO_FINGER[key];
              const keyColor = finger ? FINGER_COLORS[finger] : '#475569'; // default slate-600

              let widthClass = 'w-14';
              if (key === 'space') widthClass = 'w-[450px]';
              else if (key === 'backspace' || key === 'tab' || key === 'caps' || key === 'enter' || key === 'shift') widthClass = 'w-24 flex-grow';

              return (
                <motion.div
                  key={key + i}
                  initial={false}
                  animate={{ 
                    scale: isPressed ? 0.9 : isExpected ? 1.08 : 1,
                    y: isPressed ? 4 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`${widthClass} h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] relative overflow-hidden transition-colors`}
                  style={{
                    backgroundColor: isPressed 
                      ? (isError ? '#ef4444' : '#22c55e') 
                      : (isExpected ? keyColor : 'var(--background)'),
                    color: isExpected || isPressed ? '#fff' : keyColor,
                    border: `2px solid ${isExpected ? keyColor : 'var(--border)'}`,
                    boxShadow: isPressed ? 'none' : `0 4px 0 0 ${isExpected ? keyColor : 'var(--border)'}`
                  }}
                >
                  {/* Subtle color hint on bottom border if not active */}
                  {!isExpected && !isPressed && finger && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 opacity-40" style={{ backgroundColor: keyColor }} />
                  )}
                  {key === 'space' ? '' : key.toUpperCase()}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hands Guide */}
      <div className="relative w-full max-w-[800px] h-48 flex justify-between px-12 mt-4 opacity-90">
        <HandSide side="left" targetFinger={targetFinger} />
        <HandSide side="right" targetFinger={targetFinger} />
      </div>

    </div>
  );
};

const HandSide = ({ side, targetFinger }: { side: 'left'|'right', targetFinger: string }) => {
  const isLeft = side === 'left';
  const prefix = isLeft ? 'l-' : 'r-';
  
  // Custom simple Hand SVG paths (stylized minimalist)
  return (
    <div className={`relative w-[280px] h-full flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl" style={{ transform: isLeft ? 'scaleX(1)' : 'scaleX(-1)' }}>
        {/* Palm */}
        <path d="M 50 120 C 30 140, 40 200, 100 200 C 160 200, 170 140, 150 120 Z" fill="var(--secondary)" stroke="var(--border)" strokeWidth="4" />
        
        {/* Fingers: Thumb, Index, Middle, Ring, Pinky */}
        <Finger id={isLeft ? 'thumb' : 'thumb'} cx={150} cy={120} rx={25} ry={45} angle={50} isActive={targetFinger === 'thumb'} color={FINGER_COLORS['thumb']} />
        <Finger id={prefix+'index'} cx={115} cy={60} rx={22} ry={65} angle={10} isActive={targetFinger === prefix+'index'} color={FINGER_COLORS[prefix+'index']} />
        <Finger id={prefix+'middle'} cx={70} cy={45} rx={23} ry={70} angle={-5} isActive={targetFinger === prefix+'middle'} color={FINGER_COLORS[prefix+'middle']} />
        <Finger id={prefix+'ring'} cx={30} cy={65} rx={21} ry={60} angle={-15} isActive={targetFinger === prefix+'ring'} color={FINGER_COLORS[prefix+'ring']} />
        <Finger id={prefix+'pinky'} cx={5} cy={95} rx={18} ry={50} angle={-30} isActive={targetFinger === prefix+'pinky'} color={FINGER_COLORS[prefix+'pinky']} />
      </svg>
    </div>
  );
};

const Finger = ({ id, cx, cy, rx, ry, angle, isActive, color }: any) => {
  return (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={isActive ? color : 'var(--secondary)'}
      stroke="var(--border)"
      strokeWidth="4"
      style={{ transformOrigin: `${cx}px ${cy + ry}px` }}
      animate={{ 
        rotate: angle, 
        scale: isActive ? 1.05 : 1,
        y: isActive ? -15 : 0 
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    />
  );
};
