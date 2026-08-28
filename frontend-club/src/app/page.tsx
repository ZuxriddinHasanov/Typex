"use client";
import React, { useEffect, useState } from "react";
import { useProgressStore } from "../store/progressStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Lesson {
  level: number;
  name: string;
  text: string;
}

export default function LevelMap() {
  const { unlockedLevels, levelScores } = useProgressStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:5005/club/lessons")
      .then(res => res.json())
      .then(data => {
        if(data.data) setLessons(data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-background flex flex-col items-center">
      <h1 className="text-4xl font-extrabold tracking-tight mb-12 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
        TypeUZ Club
      </h1>
      
      <div className="flex flex-col items-center relative w-full max-w-lg pb-32">
        <div className="absolute top-0 bottom-0 w-2 bg-secondary/50 rounded-full -z-10" />

        {lessons.map((lesson, i) => {
          const isUnlocked = unlockedLevels.includes(lesson.level);
          const score = levelScores[lesson.level];
          const isCurrent = isUnlocked && !score;

          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={lesson.level} 
              className={`w-full flex ${i % 2 === 0 ? "justify-start" : "justify-end"} mb-12 relative`}
            >
              <div 
                onClick={() => isUnlocked && router.push(`/lesson/${lesson.level}`)}
                className={`w-64 p-4 rounded-3xl border-4 cursor-pointer transition-transform hover:scale-105 shadow-lg flex flex-col items-center justify-center gap-2
                  ${isUnlocked 
                    ? "bg-background border-primary hover:border-primary/80" 
                    : "bg-secondary/50 border-secondary-foreground/20 opacity-60 cursor-not-allowed"}
                  ${isCurrent ? "ring-4 ring-primary/30 ring-offset-4 ring-offset-background" : ""}
                `}
              >
                <h3 className="font-bold text-lg">{lesson.name}</h3>
                
                {isUnlocked ? (
                  <div className="flex gap-1 text-xl">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={score && star <= score.stars ? "text-yellow-500" : "text-secondary-foreground/20"}>★</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">Locked 🔒</span>
                )}
                
                {score && (
                  <div className="text-xs font-semibold text-muted-foreground">
                    {score.wpm} WPM &bull; {score.acc}%
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
