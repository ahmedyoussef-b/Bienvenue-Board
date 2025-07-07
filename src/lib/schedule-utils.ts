// src/lib/schedule-utils.ts
import type { WizardData, Day, TeacherConstraint, Subject, Lesson, TeacherAssignment, TeacherWithDetails } from '@/types';
import { type Lesson as PrismaLesson } from '@prisma/client';

type SchedulableLesson = Omit<PrismaLesson, 'id' | 'createdAt' | 'updatedAt'>;

const formatTimeSimple = (date: string | Date): string => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

export const generateTimeSlots = (startTime: string, endTime: string, sessionDuration: number): string[] => {
    const slots: string[] = [];
    if (!startTime || !endTime || !sessionDuration) return [];

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDate = new Date(Date.UTC(2000, 0, 1, startHour, startMinute));
    const endDate = new Date(Date.UTC(2000, 0, 1, endHour, endMinute));

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
        const currentHour = currentTime.getUTCHours();
        
        // N'ajoute pas de créneaux pendant la pause déjeuner (12:xx or 13:xx)
        if (currentHour < 12 || currentHour >= 14) {
            slots.push(
                `${currentHour.toString().padStart(2, '0')}:${currentTime.getUTCMinutes().toString().padStart(2, '0')}`
            );
        }
        
        currentTime.setUTCHours(currentTime.getUTCHours(), currentTime.getUTCMinutes() + sessionDuration);
    }
    return slots;
};

export const findConflictingConstraint = (
    teacherId: string,
    day: Day,
    lessonStartTime: string, // 'HH:mm'
    lessonEndTime: string, // 'HH:mm'
    constraints: TeacherConstraint[]
): TeacherConstraint | null => {
    const lessonStartMinutes = parseInt(lessonStartTime.split(':')[0]) * 60 + parseInt(lessonStartTime.split(':')[1]);
    const lessonEndMinutes = parseInt(lessonEndTime.split(':')[0]) * 60 + parseInt(lessonEndTime.split(':')[1]);

    for (const constraint of constraints) {
        if (constraint.teacherId === teacherId && constraint.day === day) {
            const constraintStartMinutes = parseInt(constraint.startTime.split(':')[0]) * 60 + parseInt(constraint.startTime.split(':')[1]);
            const constraintEndMinutes = parseInt(constraint.endTime.split(':')[0]) * 60 + parseInt(constraint.endTime.split(':')[1]);

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            if (lessonStartMinutes < constraintEndMinutes && lessonEndMinutes > constraintStartMinutes) {
                return constraint; // Return the conflicting constraint
            }
        }
    }
    return null; // No conflicting constraints found
};


export const calculateAvailableSlots = (
    selectedSubject: Subject,
    selectedClassId: string,
    schedule: Lesson[],
    wizardData: WizardData,
    ignoreTimePreference: boolean = false
): Set<string> => {
    const slots = new Set<string>();
    const { school, teachers, teacherConstraints = [], teacherAssignments = [], subjectRequirements = [] } = wizardData;

    if (!selectedClassId || !school || !teachers) {
        return slots;
    }

    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const timeSlots = generateTimeSlots(school.startTime, school.endTime, school.sessionDuration);
    const classIdNum = parseInt(selectedClassId, 10);
    if (isNaN(classIdNum)) return slots;
    
    // 1. Find the specific teacher assigned to this subject for this class
    const assignment = teacherAssignments.find(a => a.subjectId === selectedSubject.id && a.classIds.includes(classIdNum));
    if (!assignment) return slots; // No teacher assigned, so no slots are available
    
    const teacher = teachers.find(t => t.id === assignment.teacherId);
    if (!teacher) return slots; // Teacher not found
    
    // 2. Iterate over all possible slots
    schoolDays.forEach(day => {
        
        const subjectReq = subjectRequirements.find(r => r.subjectId === selectedSubject.id);
        
        let applicableTimeSlots = timeSlots;
        if (!ignoreTimePreference) {
            const amSlots = timeSlots.filter(slot => parseInt(slot.split(':')[0]) < 12);
            const pmSlots = timeSlots.filter(slot => parseInt(slot.split(':')[0]) >= 14);
            if (subjectReq?.timePreference === 'AM') applicableTimeSlots = amSlots;
            if (subjectReq?.timePreference === 'PM') applicableTimeSlots = pmSlots;
        }
        
        applicableTimeSlots.forEach(time => {
            const [hour, minute] = time.split(':').map(Number);
            const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
            const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;


            // 3. Check for conflicts
            const isClassBusy = schedule.some(l => l.classId === classIdNum && l.day === day && formatTimeSimple(l.startTime) === time);
            const isTeacherBusy = schedule.some(l => l.teacherId === teacher.id && l.day === day && formatTimeSimple(l.startTime) === time);
            const teacherIsConstrained = findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, teacherConstraints);
            
            let isRoomUnavailable = false;
            const requiredRoomId = subjectReq?.requiredRoomId;
            if (requiredRoomId && requiredRoomId !== null) {
                isRoomUnavailable = schedule.some(l => l.classroomId === requiredRoomId && l.day === day && formatTimeSimple(l.startTime) === time);
            }

            if (!isClassBusy && !isTeacherBusy && !teacherIsConstrained && !isRoomUnavailable) {
                slots.add(`${day}-${time}`);
            }
        });
    });

    return slots;
};

export const mergeConsecutiveLessons = (lessons: PrismaLesson[], wizardData: WizardData): PrismaLesson[] => {
    if (!lessons || lessons.length === 0) return [];
    const dayOrder: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const lessonsByDay: { [key in Day]?: PrismaLesson[] } = {};
    for (const lesson of lessons) {
        if (!lessonsByDay[lesson.day]) {
            lessonsByDay[lesson.day] = [];
        }
        lessonsByDay[lesson.day]!.push(lesson);
    }
    const finalMergedLessons: PrismaLesson[] = [];
    for (const day of dayOrder) {
        const dailyLessons = lessonsByDay[day];
        if (!dailyLessons || dailyLessons.length === 0) continue;
        const sortedDailyLessons = [...dailyLessons].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        const mergedDailyLessons: PrismaLesson[] = [];
        let i = 0;
        while (i < sortedDailyLessons.length) {
            let currentLesson = { ...sortedDailyLessons[i] };
            let j = i + 1;
            while (j < sortedDailyLessons.length && sortedDailyLessons[j].classId === currentLesson.classId && sortedDailyLessons[j].subjectId === currentLesson.subjectId && sortedDailyLessons[j].teacherId === currentLesson.teacherId && new Date(sortedDailyLessons[j].startTime).getTime() === new Date(currentLesson.endTime).getTime()) {
                currentLesson.endTime = sortedDailyLessons[j].endTime;
                j++;
            }
            mergedDailyLessons.push(currentLesson);
            i = j;
        }
        finalMergedLessons.push(...mergedDailyLessons);
    }
    return finalMergedLessons;
};

// Helper for time conversion
const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};


/**
 * Calculates a fitness score for placing a lesson in a specific slot.
 * Higher scores are better. A negative score indicates a hard conflict.
 */
function calculateSlotFitness(
  lessonToPlace: { classItem: typeof wizardData.classes[0], subject: Subject },
  day: Day,
  time: string,
  schedule: SchedulableLesson[],
  wizardData: WizardData
): number {
  const { school, teachers, teacherConstraints = [], subjectRequirements = [], teacherAssignments = [] } = wizardData;
  const { classItem, subject } = lessonToPlace;

  const assignment = teacherAssignments.find(a => a.subjectId === subject.id && a.classIds.includes(classItem.id));
  if (!assignment) return -1000;
  const teacher = teachers.find(t => t.id === assignment.teacherId);
  if (!teacher) return -1000;

  const [hour, minute] = time.split(':').map(Number);
  const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
  const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;

  // --- Hard Constraints (Teacher/Class) ---
  if (schedule.some(l => l.classId === classItem.id && l.day === day && formatTimeSimple(l.startTime) === time)) return -1;
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && formatTimeSimple(l.startTime) === time)) return -1;
  if (findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, teacherConstraints)) return -1;

  // --- Soft Constraints ---
  let score = 100;
  const lessonsOnSameDay = schedule.filter(l => l.classId === classItem.id && l.day === day);
  if (lessonsOnSameDay.some(l => l.subjectId === subject.id)) {
    score -= 50;
  }
  const timeInMinutes = hour * 60 + minute;
  const prevSlotInMinutes = timeInMinutes - school.sessionDuration;
  const nextSlotInMinutes = timeInMinutes + school.sessionDuration;
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && timeToMinutes(formatTimeSimple(l.endTime)) === timeInMinutes)) {
    score -= 15;
  }
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && timeToMinutes(formatTimeSimple(l.startTime)) === nextSlotInMinutes)) {
    score -= 15;
  }
  const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);
  if (subjectReq) {
    if (subjectReq.timePreference === 'AM' && hour >= 12) score -= 25;
    if (subjectReq.timePreference === 'PM' && hour < 14) score -= 25;
  }
  score += Math.random() * 5;
  return score;
}

/**
 * Generates a school schedule using a heuristic-based approach.
 * It prioritizes placing more constrained lessons first and evaluates the "fitness"
 * of each potential slot to create a more balanced and realistic schedule.
 */
export const generateSchedule = (wizardData: WizardData): { schedule: SchedulableLesson[], unplacedLessons: any[] } => {
    const { school, classes, subjects, rooms, subjectRequirements, teacherAssignments } = wizardData;
    const newSchedule: SchedulableLesson[] = [];
    const unplacedLessons: any[] = [];
    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const allTimeSlots = generateTimeSlots(school.startTime, school.endTime, school.sessionDuration);

    let lessonSlotsToFill: { classItem: typeof classes[0], subject: Subject }[] = [];
    classes.forEach(classItem => {
        subjects.forEach(subject => {
            const requirement = wizardData.lessonRequirements.find(r => r.classId === classItem.id && r.subjectId === subject.id);
            const hoursToSchedule = requirement ? requirement.hours : (subject.weeklyHours || 0);
            for (let i = 0; i < hoursToSchedule; i++) {
                lessonSlotsToFill.push({ classItem, subject });
            }
        });
    });

    // Prioritize lessons that require a specific room
    lessonSlotsToFill.sort((a, b) => {
        const reqA = subjectRequirements?.find(r => r.subjectId === a.subject.id);
        const reqB = subjectRequirements?.find(r => r.subjectId === b.subject.id);
        const scoreA = reqA?.requiredRoomId ? 100 : 0;
        const scoreB = reqB?.requiredRoomId ? 100 : 0;
        return scoreB - scoreA;
    });

    for (const lessonSlot of lessonSlotsToFill) {
        let bestSlot: { day: Day, time: string, score: number, roomId: number | null } | null = null;
        
        for (const day of schoolDays) {
            for (const time of allTimeSlots) {
                const score = calculateSlotFitness(lessonSlot, day, time, newSchedule, wizardData);
                if (score < 0) continue; // Skip if there's a hard conflict with teacher or class

                // Now, handle room logic
                const { classItem, subject } = lessonSlot;
                const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);
                const requiredRoomId = subjectReq?.requiredRoomId;
                let potentialRoomId: number | null = null;
                
                const occupiedRoomIds = new Set(
                    newSchedule
                        .filter(l => l.day === day && formatTimeSimple(l.startTime) === time && l.classroomId != null)
                        .map(l => l.classroomId!)
                );
                
                if (requiredRoomId) {
                    if (!occupiedRoomIds.has(requiredRoomId)) {
                        potentialRoomId = requiredRoomId;
                    }
                } else {
                    const studentCount = classItem._count.students || 0;
                    // Find a general room
                    const availableGeneralRooms = rooms.filter(room => 
                        !room.name.toLowerCase().includes('labo') &&
                        !room.name.toLowerCase().includes('gymnase') &&
                        !occupiedRoomIds.has(room.id) &&
                        room.capacity >= studentCount
                    );
                    if (availableGeneralRooms.length > 0) {
                        potentialRoomId = availableGeneralRooms[0].id; // Just take the first one
                    }
                }
                
                // If a suitable room was found (or none was needed and we can proceed without one),
                // consider this a valid slot.
                if (potentialRoomId !== null || (rooms.length === 0 && !requiredRoomId)) {
                    if (!bestSlot || score > bestSlot.score) {
                        bestSlot = { day, time, score, roomId: potentialRoomId };
                    }
                }
            }
        }

        if (bestSlot) {
            const { day, time, roomId } = bestSlot;
            const { classItem, subject } = lessonSlot;
            const [hour, minute] = time.split(':').map(Number);
            const assignment = teacherAssignments.find(a => a.subjectId === subject.id && a.classIds.includes(classItem.id))!;

            newSchedule.push({
                name: `${subject.name} - ${classItem.name}`,
                day,
                startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
                endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
                subjectId: subject.id,
                teacherId: assignment.teacherId,
                classId: classItem.id,
                classroomId: roomId,
            });
        } else {
            unplacedLessons.push({ ...lessonSlot, reason: 'Aucun créneau ou salle disponible trouvé.' });
        }
    }

    if (unplacedLessons.length > 0) {
        console.warn(`Impossible de placer ${unplacedLessons.length} cours.`, unplacedLessons);
    }

    return { schedule: newSchedule, unplacedLessons };
};

export const adjustScheduleToCurrentWeek = (
  scheduleData: Lesson[]
): { title: string; start: Date; end: Date; }[] => {
  if (!scheduleData || scheduleData.length === 0) {
    return [];
  }

  const today = new Date();
  // Get the start of the current week, starting on Monday.
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });

  const dayMapping: { [key in Day]: number } = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6, // Should not happen in this app
  };

  const adjustedSchedule: { title: string; start: Date; end: Date; }[] = [];

  scheduleData.forEach(lesson => {
    // Check if the day exists in our mapping
    if (dayMapping[lesson.day] === undefined) return;

    const lessonDayIndex = dayMapping[lesson.day];
    
    // Calculate the date for the lesson in the current week
    const lessonDate = addDays(startOfThisWeek, lessonDayIndex); 

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
