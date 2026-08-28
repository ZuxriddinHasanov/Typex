import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
  ['space']
];

interface VirtualKeyboardProps {
  expectedChar: string;
  pressedChar: string | null;
  isError: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ expectedChar, pressedChar, isError }) => {
  const getExpectedKey = (char: string) => {
    if (char === ' ') return 'space';
    return char.toLowerCase();
  };

  const expectedKey = getExpectedKey(expectedChar);
  
  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-secondary/30 rounded-3xl border shadow-sm">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((key) => {
            const isExpected = key === expectedKey;
            const isPressed = key === (pressedChar === ' ' ? 'space' : pressedChar?.toLowerCase());
            
            let widthClass = 'w-12';
            if (key === 'space') widthClass = 'w-96';
            else if (key === 'backspace' || key === 'tab' || key === 'caps' || key === 'enter' || key === 'shift') widthClass = 'w-24';

            return (
              <motion.div
                key={key}
                initial={{ scale: 1 }}
                animate={{ 
                  scale: isPressed ? 0.9 : isExpected ? 1.05 : 1,
                  backgroundColor: isPressed 
                    ? (isError ? '#ef4444' : '#22c55e') 
                    : isExpected ? 'var(--primary)' : 'var(--background)',
                  color: (isPressed || isExpected) ? '#fff' : 'var(--foreground)',
                  borderColor: isExpected ? 'var(--primary)' : 'var(--border)'
                }}
                transition={{ duration: 0.1 }}
                className={`h-12 ${widthClass} rounded-xl border-2 flex items-center justify-center font-semibold text-sm shadow-sm relative overflow-hidden`}
              >
                {isExpected && (
                  <motion.div
                    layoutId="glow"
                    className="absolute inset-0 bg-white/20"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
                {key === 'space' ? '' : key.toUpperCase()}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
