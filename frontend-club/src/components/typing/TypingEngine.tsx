import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { HandIndicator } from "./HandIndicator";
import { useProgressStore } from "../../store/progressStore";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

interface TypingEngineProps {
  lessonId: number;
  text: string;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({ lessonId, text }) => {
  const router = useRouter();
  const completeLevel = useProgressStore((state) => state.completeLevel);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<number[]>([]);
  const [pressedChar, setPressedChar] = useState<string | null>(null);
  const [isErrorShake, setIsErrorShake] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComplete) return;

    // Ignore modifier keys
    if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
    
    if (e.key === "Backspace") {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setErrors(prev => prev.filter(i => i !== currentIndex - 1));
      }
      return;
    }

    if (!startTime) setStartTime(Date.now());

    setPressedChar(e.key);
    setTimeout(() => setPressedChar(null), 150); // visual reset

    const expected = text[currentIndex];

    if (e.key === expected) {
      if (currentIndex + 1 === text.length) {
        finishLesson();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setIsErrorShake(true);
      setTimeout(() => setIsErrorShake(false), 200);
      if (!errors.includes(currentIndex)) {
        setErrors(prev => [...prev, currentIndex]);
      }
    }
  };

  const finishLesson = () => {
    setIsComplete(true);
    const timeInMinutes = (Date.now() - (startTime || Date.now())) / 60000;
    const wpm = timeInMinutes > 0 ? Math.round((text.length / 5) / timeInMinutes) : 0;
    const accuracy = Math.max(0, Math.round(((text.length - errors.length) / text.length) * 100));
    
    let stars = 1;
    if (accuracy >= 98) stars = 5;
    else if (accuracy >= 95) stars = 4;
    else if (accuracy >= 90) stars = 3;
    else if (accuracy >= 80) stars = 2;

    completeLevel(lessonId, stars, wpm, accuracy);
  };

  if (isComplete) {
    const accuracy = Math.max(0, Math.round(((text.length - errors.length) / text.length) * 100));
    const timeInMinutes = (Date.now() - (startTime || Date.now())) / 60000;
    const wpm = timeInMinutes > 0 ? Math.round((text.length / 5) / timeInMinutes) : 0;
    let stars = 1;
    if (accuracy >= 98) stars = 5;
    else if (accuracy >= 95) stars = 4;
    else if (accuracy >= 90) stars = 3;
    else if (accuracy >= 80) stars = 2;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex flex-col items-center justify-center p-12 bg-secondary/50 rounded-3xl border shadow-xl"
      >
        <h2 className="text-4xl font-bold mb-4">Level {lessonId} Complete!</h2>
        <div className="flex gap-2 mb-8">
          {[1,2,3,4,5].map(i => (
            <motion.div 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`text-6xl ${i <= stars ? "text-yellow-400" : "text-gray-300 dark:text-gray-700"}`}
            >
              ?
            </motion.div>
          ))}
        </div>
        <div className="flex gap-8 mb-8 text-xl">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-bold text-3xl">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Speed</span>
            <span className="font-bold text-3xl">{wpm} WPM</span>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
          <Button onClick={() => router.push("/")}>Continue</Button>
        </div>
      </motion.div>
    );
  }

  const expectedChar = text[currentIndex];

  return (
    <div 
      className="flex flex-col items-center gap-12 outline-none" 
      onKeyDown={handleKeyDown} 
      tabIndex={0} 
      ref={containerRef}
    >
      <motion.div 
        animate={isErrorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.2 }}
        className="text-4xl font-mono tracking-widest leading-relaxed max-w-4xl p-8 bg-secondary/30 rounded-2xl border"
      >
        {text.split("").map((char, i) => {
          let color = "text-muted-foreground/50";
          if (i < currentIndex) {
            color = errors.includes(i) ? "text-red-500 bg-red-500/20" : "text-primary";
          } else if (i === currentIndex) {
            color = errors.includes(i) ? "text-red-500 bg-red-500/20 underline decoration-red-500 decoration-4" : "text-foreground underline decoration-primary decoration-4";
          }
          return (
            <span key={i} className={`transition-colors ${color} ${i === currentIndex ? 'animate-pulse' : ''}`}>
              {char}
            </span>
          );
        })}
      </motion.div>

      <div className="flex flex-col items-center gap-4">
        <HandIndicator expectedChar={expectedChar} />
        <VirtualKeyboard expectedChar={expectedChar} pressedChar={pressedChar} isError={isErrorShake} />
      </div>
    </div>
  );
};
