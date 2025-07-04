// src/app/[locale]/(dashboard)/shuddle/page.tsx
import prisma from '@/lib/prisma';
import ShuddleInitializer from '@/components/wizard/ShuddleInitializer';
import type { ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement } from '@/types';

export default async function ShuddlePage() {
    const classesData = await prisma.class.findMany({ 
        include: { grade: true }, 
        orderBy: { name: 'asc' } 
    });
    const subjectsData = await prisma.subject.findMany({ 
        orderBy: { name: 'asc' } 
    });
    const teachersData = await prisma.teacher.findMany({ 
        include: { 
            user: true, 
            subjects: true, 
            classes: true,
            _count: { 
                select: { classes: true, subjects: true } 
            } 
        }, 
        orderBy: { name: 'asc' } 
    });
    const classroomsData = await prisma.classroom.findMany({ 
        orderBy: { name: 'asc' } 
    });
    // Explicitly select fields to avoid asking for non-existent columns like createdAt
    const lessonsData = await prisma.lesson.findMany({
        select: {
            id: true,
            name: true,
            day: true,
            startTime: true,
            endTime: true,
            subjectId: true,
            classId: true,
            teacherId: true,
            classroomId: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
        },
    });
    const gradesData = await prisma.grade.findMany({
        orderBy: { level: 'asc' }
    });
    
    // Safely fetch constraints, in case the models don't exist due to a failed migration
    const lessonRequirementsData = (prisma.lessonRequirement && await prisma.lessonRequirement.findMany()) || [];
    const teacherConstraintsData = (prisma.teacherConstraint && await prisma.teacherConstraint.findMany()) || [];
    const subjectRequirementsData = (prisma.subjectRequirement && await prisma.subjectRequirement.findMany()) || [];

    // Serialize data to convert Date objects to strings, preventing Redux non-serializable errors.
    const serializableData = JSON.parse(JSON.stringify({
        classes: classesData,
        subjects: subjectsData,
        teachers: teachersData,
        classrooms: classroomsData,
        lessons: lessonsData,
        grades: gradesData,
        lessonRequirements: lessonRequirementsData,
        teacherConstraints: teacherConstraintsData,
        subjectRequirements: subjectRequirementsData,
    }));

    const initialData = {
        classes: serializableData.classes as ClassWithGrade[],
        subjects: serializableData.subjects as Subject[],
        teachers: serializableData.teachers as TeacherWithDetails[],
        classrooms: serializableData.classrooms as Classroom[],
        lessons: serializableData.lessons as Lesson[],
        grades: serializableData.grades as Grade[],
        lessonRequirements: serializableData.lessonRequirements as LessonRequirement[],
        teacherConstraints: serializableData.teacherConstraints as TeacherConstraint[],
        subjectRequirements: serializableData.subjectRequirements as SubjectRequirement[],
    };

    return <ShuddleInitializer initialData={initialData} />;
}
