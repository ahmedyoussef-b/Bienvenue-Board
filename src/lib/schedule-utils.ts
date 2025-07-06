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

    // Use a fixed date to avoid DST issues
    const startDate = new Date(Date.UTC(2000, 0, 1, startHour, startMinute));
    const endDate = new Date(Date.UTC(2000, 0, 1, endHour, endMinute));

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
        // Skip lunch break from 12:00 to 13:59
        if (currentTime.getUTCHours() === 12 || currentTime.getUTCHours() === 13) {
            currentTime.setUTCHours(14, 0, 0, 0);
            if (currentTime >= endDate) break;
        }

        slots.push(
            `${currentTime.getUTCHours().toString().padStart(2, '0')}:${currentTime.getUTCMinutes().toString().padStart(2, '0')}`
        );
        currentTime.setUTCMinutes(currentTime.getUTCMinutes() + sessionDuration);
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

/**
 * NEW: Calculates a fitness score for placing a lesson in a specific slot.
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
  if (!assignment) return -1000; // Hard conflict: No teacher
  const teacher = teachers.find(t => t.id === assignment.teacherId);
  if (!teacher) return -1000; // Hard conflict: Teacher not found

  const [hour, minute] = time.split(':').map(Number);
  const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
  const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;

  // --- Hard Constraints ---
  if (schedule.some(l => l.classId === classItem.id && l.day === day && formatTimeSimple(l.startTime) === time)) return -1;
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && formatTimeSimple(l.startTime) === time)) return -1;
  if (findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, teacherConstraints)) return -1;

  // --- Soft Constraints (Scoring) ---
  let score = 100;

  // 1. Subject Spacing: Penalize if same subject is already on the same day for this class
  const lessonsOnSameDay = schedule.filter(l => l.classId === classItem.id && l.day === day);
  if (lessonsOnSameDay.some(l => l.subjectId === subject.id)) {
    score -= 50; // High penalty
  }

  // 2. Teacher Load: Penalize back-to-back lessons
  const timeInMinutes = hour * 60 + minute;
  const prevSlotInMinutes = timeInMinutes - school.sessionDuration;
  const nextSlotInMinutes = timeInMinutes + school.sessionDuration;
  
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && timeToMinutes(formatTimeSimple(l.endTime)) === timeInMinutes)) {
    score -= 15; // Penalty for class right before
  }
  if (schedule.some(l => l.teacherId === teacher.id && l.day === day && timeToMinutes(formatTimeSimple(l.startTime)) === nextSlotInMinutes)) {
    score -= 15; // Penalty for class right after
  }

  // 3. Time Preference: Reward respecting AM/PM preference
  const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);
  if (subjectReq) {
    if (subjectReq.timePreference === 'AM' && hour >= 12) score -= 25;
    if (subjectReq.timePreference === 'PM' && hour < 14) score -= 25;
  }
  
  // Add a small random factor to break ties and introduce variety
  score += Math.random() * 5;

  return score;
}


/**
 * Generates a school schedule using a heuristic-based approach.
 * It prioritizes placing more constrained lessons first and evaluates the "fitness"
 * of each potential slot to create a more balanced and realistic schedule.
 */
export const generateSchedule = (wizardData: WizardData): { schedule: SchedulableLesson[], unplacedLessons: { classItem: any, subject: any, reason: string }[] } => {
    const { school, classes, subjects, rooms } = wizardData;
    const newSchedule: SchedulableLesson[] = [];
    const unplacedLessons: { classItem: any, subject: any, reason: string }[] = [];

    if (!school.schoolDays || school.schoolDays.length === 0) {
        return { schedule: [], unplacedLessons: [] };
    }

    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const allTimeSlots = generateTimeSlots(school.startTime, school.endTime, school.sessionDuration);

    // Create a list of all individual lesson hours to be scheduled
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

    // Shuffle for variety in each generation run
    lessonSlotsToFill.sort(() => Math.random() - 0.5);

    for (const lessonSlot of lessonSlotsToFill) {
        let bestSlot: { day: Day, time: string, score: number } | null = null;

        // Iterate through all possible days and time slots to find the best fit
        for (const day of schoolDays) {
            for (const time of allTimeSlots) {
                const score = calculateSlotFitness(lessonSlot, day, time, newSchedule, wizardData);
                if (score >= 0 && (!bestSlot || score > bestSlot.score)) {
                    bestSlot = { day, time, score };
                }
            }
        }
        
        if (bestSlot) {
            const { day, time } = bestSlot;
            const { classItem, subject } = lessonSlot;
            const [hour, minute] = time.split(':').map(Number);
            
            const assignment = wizardData.teacherAssignments.find(a => a.subjectId === subject.id && a.classIds.includes(classItem.id))!;
            const teacher = wizardData.teachers.find(t => t.id === assignment.teacherId)!;

            const newLesson: SchedulableLesson = {
                name: `${subject.name} - ${classItem.name}`,
                day,
                startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
                endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
                subjectId: subject.id,
                teacherId: teacher.id,
                classId: classItem.id,
                classroomId: null, // Room assignment can be a separate optimization pass
            };
            newSchedule.push(newLesson);
        } else {
            unplacedLessons.push({ ...lessonSlot, reason: 'Aucun créneau valide trouvé.' });
        }
    }

    if (unplacedLessons.length > 0) {
        console.warn(`Impossible de placer ${unplacedLessons.length} cours.`, unplacedLessons);
    }

    return { schedule: newSchedule, unplacedLessons };
};
