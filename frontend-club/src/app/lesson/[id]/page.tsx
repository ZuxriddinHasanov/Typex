"use client";
import React, { useEffect, useState } from "react";
import { TypingEngine } from "../../../components/typing/TypingEngine";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { useProgressStore } from "../../../store/progressStore";

interface Lesson {
  level: number;
  name: string;
  text: string;
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const { unlockedLevels } = useProgressStore();

  const id = parseInt(params.id, 10);

  useEffect(() => {
    if (!unlockedLevels.includes(id)) {
      router.push("/");
      return;
    }

    fetch("http://localhost:5005/club/lessons")
      .then(res => res.json())
      .then(data => {
        if(data.data) {
          const l = data.data.find((x: any) => x.level === id);
          setLesson(l || null);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [id, router, unlockedLevels]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl animate-pulse">Loading...</div>;
  if (!lesson) return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-3xl font-bold mb-4">Lesson not found</h1><Button onClick={() => router.push("/")}>Go Back</Button></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col p-8">
      <div className="flex justify-between items-center mb-12">
        <Button variant="ghost" onClick={() => router.push("/")}>&lt; Back to Map</Button>
        <h1 className="text-2xl font-extrabold">{lesson.name}</h1>
        <div className="w-32" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-12">
        <TypingEngine lessonId={lesson.level} text={lesson.text} />
      </div>
    </div>
  );
}
