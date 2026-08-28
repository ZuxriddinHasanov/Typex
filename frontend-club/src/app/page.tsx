"use client";
import React, { useEffect, useState } from "react";
import { useProgressStore } from "../store/progressStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, Lock, Star } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col items-center pt-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tight mb-4 text-primary">
          TypeUZ Club
        </h1>
        <p className="text-xl text-muted-foreground font-medium">Learn Touch Typing From Scratch</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-16 max-w-[1000px] px-8 pb-32">
        {lessons.map((lesson, i) => {
          const isUnlocked = unlockedLevels.includes(lesson.level);
          const score = levelScores[lesson.level];
          const isCurrent = isUnlocked && !score;

          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, type: "spring" }}
              key={lesson.level} 
              className="flex flex-col items-center group"
            >
              <div 
                onClick={() => isUnlocked && router.push(`/lesson/${lesson.level}`)}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative
                  ${isUnlocked 
                    ? "cursor-pointer bg-white dark:bg-secondary border-4 border-primary shadow-[0_8px_0_0_hsl(var(--primary))] hover:-translate-y-2 hover:shadow-[0_12px_0_0_hsl(var(--primary))]" 
                    : "cursor-not-allowed bg-secondary/50 border-4 border-muted shadow-none opacity-50"}
                  ${isCurrent ? "ring-8 ring-primary/20 ring-offset-4 ring-offset-background" : ""}
                `}
              >
                <span className="text-3xl font-black mb-1 text-foreground">
                  {lesson.level}
                </span>
                
                {isUnlocked ? (
                  isCurrent ? (
                    <Play className="w-6 h-6 text-primary fill-primary animate-pulse" />
                  ) : (
                    <div className="flex gap-0.5">
                      {[1,2,3].map(star => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${score && Math.ceil((score.stars/5)*3) >= star ? "text-yellow-400 fill-yellow-400" : "text-muted stroke-muted-foreground"}`} 
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="mt-6 text-center w-36">
                <h3 className="font-bold text-sm text-foreground leading-tight">{lesson.name}</h3>
                {score && (
                  <p className="text-xs font-semibold text-primary mt-1">
                    {score.wpm} WPM &bull; {score.acc}%
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
