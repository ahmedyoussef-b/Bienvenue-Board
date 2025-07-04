// src/lib/schedule-utils.ts
import type { WizardData, Day, TeacherConstraint, Subject, Lesson, TeacherAssignment, TeacherWithDetails } from '@/types';
import { type Lesson as PrismaLesson } from '@prisma/client';

type SchedulableLesson = Omit<PrismaLesson, 'id' | 'createdAt' | 'updatedAt'>;

const formatTimeSimple = (date: string | Date): string => `${new Date(date).getUTCHours().toString().padStart(2, '0')}:00`;

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
    wizardData: WizardData
): Set<string> => {
    const slots = new Set<string>();

    if (!selectedClassId || !wizardData.school || !wizardData.teachers) {
        return slots;
    }

    const { school, teachers, teacherConstraints = [], teacherAssignments = [], subjectRequirements = [] } = wizardData;
    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
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
        const amSlots = ['08:00', '09:00', '10:00', '11:00'];
        const pmSlots = ['12:00', '14:00', '15:00', '16:00', '17:00'];
        let applicableTimeSlots = timeSlots;
        if (subjectReq?.timePreference === 'AM') applicableTimeSlots = amSlots;
        if (subjectReq?.timePreference === 'PM') applicableTimeSlots = pmSlots;

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
            if (requiredRoomId && requiredRoomId !== 'any') {
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

export const generateSchedule = (wizardData: WizardData): SchedulableLesson[] => {
    const newSchedule: SchedulableLesson[] = [];
    const { school, classes, subjects, teachers, rooms, lessonRequirements, teacherConstraints = [], subjectRequirements = [], teacherAssignments = [] } = wizardData;

    if (!school.schoolDays || school.schoolDays.length === 0) return [];

    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const allTimeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const amSlots = ['08:00', '09:00', '10:00', '11:00'];
    const pmSlots = ['12:00', '14:00', '15:00', '16:00', '17:00'];

    const occupancy: { [key: string]: boolean } = {};

    const lessonSlotsToFill: { classItem: typeof classes[0], subject: typeof subjects[0] }[] = [];
    classes.forEach(classItem => {
        subjects.forEach(subject => {
            const requirement = lessonRequirements.find(r => r.classId === classItem.id && r.subjectId === subject.id);
            const hoursToSchedule = requirement ? requirement.hours : (subject.weeklyHours || 0);
            for (let i = 0; i < hoursToSchedule; i++) {
                lessonSlotsToFill.push({ classItem, subject });
            }
        });
    });

    lessonSlotsToFill.sort(() => Math.random() - 0.5);

    lessonSlotsToFill.forEach(slot => {
        const { classItem, subject } = slot;
        let placed = false;
        const shuffledDays = [...schoolDays].sort(() => Math.random() - 0.5);

        for (const day of shuffledDays) {
            const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);
            let applicableTimeSlots = allTimeSlots;
            if (subjectReq?.timePreference === 'AM') applicableTimeSlots = amSlots;
            if (subjectReq?.timePreference === 'PM') applicableTimeSlots = pmSlots;
            
            const shuffledTimes = [...applicableTimeSlots].sort(() => Math.random() - 0.5);

            for (const time of shuffledTimes) {
                if (occupancy[`class-${classItem.id}-${day}-${time}`]) continue;

                // New constraint: A subject cannot be split on the same day.
                const lessonsTodayForThisSubject = newSchedule.filter(
                    l => l.classId === classItem.id && l.subjectId === subject.id && l.day === day
                );

                if (lessonsTodayForThisSubject.length > 0) {
                    // If scheduled, check for consecutiveness.
                    const lastLesson = lessonsTodayForThisSubject.sort(
                        (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
                    )[0];

                    const lastEndTime = new Date(lastLesson.endTime);
                    const [h, m] = time.split(':').map(Number);
                    const newStartTime = new Date(Date.UTC(2000, 0, 1, h, m));

                    // If the new start time doesn't match the last end time, it's not consecutive.
                    if (lastEndTime.getTime() !== newStartTime.getTime()) {
                        continue;
                    }
                }
                
                const assignment = teacherAssignments.find(a => a.subjectId === subject.id && a.classIds.includes(classItem.id));
                let potentialTeachers: TeacherWithDetails[];
                if (assignment) {
                    potentialTeachers = teachers.filter(t => t.id === assignment.teacherId);
                } else {
                    potentialTeachers = teachers.filter(t => t.subjects.some(s => s.id === subject.id));
                }

                const availableTeacher = potentialTeachers.find(t => {
                    if (occupancy[`teacher-${t.id}-${day}-${time}`]) return false;
                    const [hour, minute] = time.split(':').map(Number);
                    const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
                    const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;
                    return !findConflictingConstraint(t.id, day, time, lessonEndTimeStr, teacherConstraints);
                });
                if (!availableTeacher) continue;

                let potentialRooms = rooms.filter(r => !occupancy[`room-${r.id}-${day}-${time}`] && r.capacity >= classItem.capacity);
                if (subjectReq?.requiredRoomId && subjectReq.requiredRoomId !== 'any') {
                    potentialRooms = potentialRooms.filter(r => r.id === subjectReq.requiredRoomId);
                }
                const availableRoom = potentialRooms.length > 0 ? potentialRooms[0] : null;
                if (rooms.length > 0 && subjectReq?.requiredRoomId && subjectReq.requiredRoomId !== 'any' && potentialRooms.length === 0) continue;

                const [hour, minute] = time.split(':').map(Number);
                newSchedule.push({
                    name: `${subject.name} - ${classItem.name}`,
                    day,
                    startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
                    endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
                    subjectId: subject.id,
                    teacherId: availableTeacher.id,
                    classId: classItem.id,
                    classroomId: availableRoom ? availableRoom.id : null,
                });

                occupancy[`teacher-${availableTeacher.id}-${day}-${time}`] = true;
                occupancy[`class-${classItem.id}-${day}-${time}`] = true;
                if (availableRoom) occupancy[`room-${availableRoom.id}-${day}-${time}`] = true;

                placed = true;
                break;
            }
            if (placed) break;
        }
    });

    return newSchedule;
};
