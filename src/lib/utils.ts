// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Day as DayEnum } from "@prisma/client";
import { startOfWeek, set, addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define a type for the lesson data coming from the API
interface LessonData {
  id: number;
  name: string;
  day: DayEnum;
  startTime: Date;
  endTime: Date;
  subject: { name: string };
  class: { name: string };
}

// Helper to map Prisma Day enum to date-fns day index (Sunday=0, Monday=1,...)
const dayMapping: { [key in DayEnum]: number } = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};


export function adjustScheduleToCurrentWeek(
  scheduleData: LessonData[]
): { title: string; start: Date; end: Date; }[] {
  if (!scheduleData || scheduleData.length === 0) {
    return [];
  }

  const today = new Date();
  // Get the start of the current week, starting on Monday.
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });

  const adjustedSchedule: { title: string; start: Date; end: Date; }[] = [];

  scheduleData.forEach(lesson => {
    // Check if the day exists in our mapping
    if (dayMapping[lesson.day] === undefined) return;

    const lessonDayIndex = dayMapping[lesson.day];
    
    // Calculate the date for the lesson in the current week
    const lessonDate = addDays(startOfThisWeek, lessonDayIndex - 1); // -1 because our week starts on Monday(1), but addDays from Sunday base

    // startTime and endTime from Prisma are full Date objects, but we only care about the time part.
    // The seed stores time in UTC, so we use getUTCHours/Minutes.
    const startHour = new Date(lesson.startTime).getUTCHours();
    const startMinute = new Date(lesson.startTime).getUTCMinutes();
    const endHour = new Date(lesson.endTime).getUTCHours();
    const endMinute = new Date(lesson.endTime).getUTCMinutes();
    
    // Create the final start and end Date objects for the calendar event
    const startDateTime = set(lessonDate, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
    const endDateTime = set(lessonDate, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

    adjustedSchedule.push({
      title: lesson.subject.name, // Use subject name for the event title
      start: startDateTime,
      end: endDateTime,
    });
  });

  return adjustedSchedule;
}
