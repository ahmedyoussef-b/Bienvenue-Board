// src/app/[locale]/(dashboard)/shuddle/page.tsx
import prisma from '@/lib/prisma';
import ShuddleInitializer from '@/components/wizard/ShuddleInitializer';
import type { ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement } from '@/types';

export default async function ShuddlePage() {
    const classesData = await prisma.class.findMany({ 
        include: { grade: true, _count: { select: { students: true, lessons: true } } }, 
        orderBy: { name: 'asc' } 
    });
    const subjectsData = await prisma.subject.findMany({ 
        orderBy: { name: 'asc' } 
    });
    const teachersData = await prisma.teacher.findMany({ 
        include: { 
            user: true, 
            subjects: true, 
            _count: { 
                select: { subjects: true } 
            } 
        }, 
        orderBy: { name: 'asc' } 
    });
    const classroomsData = await prisma.classroom.findMany({ 
        orderBy: { name: 'asc' } 
    });
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
    
    // Safely fetch constraints, now that the models are in the schema
    const lessonRequirementsData = await prisma.lessonRequirement.findMany();
    const teacherConstraintsData = await prisma.teacherConstraint.findMany();
    const subjectRequirementsData = await prisma.subjectRequirement.findMany();

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
