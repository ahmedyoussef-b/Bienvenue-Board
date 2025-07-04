// src/components/wizard/ShuddleInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Loader2 } from 'lucide-react';
import ShuddlePageClient from './ShuddlePageClient';
import type { ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement } from '@/types';
import { fetchScheduleDraft, selectDraftStatus } from '@/lib/redux/features/scheduleDraftSlice';
import { setAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { setAllSubjects } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllTeachers } from '@/lib/redux/features/teachers/teachersSlice';
import { setAllClassrooms } from '@/lib/redux/features/classrooms/classroomsSlice';
import { setInitialSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { setAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { setAllRequirements as setAllLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { setAllTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { setAllSubjectRequirements } from '@/lib/redux/features/subjectRequirementsSlice';
import { setAllTeacherAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { setSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';
import type { SchoolData } from '@/lib/redux/features/schoolConfigSlice';


interface ShuddleInitializerProps {
    initialData: {
        classes: ClassWithGrade[];
        subjects: Subject[];
        teachers: TeacherWithDetails[];
        classrooms: Classroom[];
        lessons: Lesson[];
        grades: Grade[];
        lessonRequirements: LessonRequirement[];
        teacherConstraints: TeacherConstraint[];
        subjectRequirements: SubjectRequirement[];
    };
}

const defaultSchoolConfig: SchoolData = {
    name: 'Collège Riadh 5',
    startTime: '08:00',
    endTime: '17:00',
    schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    sessionDuration: 60,
};

export default function ShuddleInitializer({ initialData }: ShuddleInitializerProps) {
    const dispatch = useAppDispatch();
    const draftStatus = useAppSelector(selectDraftStatus);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (draftStatus === 'idle') {
            dispatch(fetchScheduleDraft()).unwrap()
                .then((draft) => {
                    console.log("Successfully fetched schedule draft from server. Hydrating store.");
                    dispatch(setSchoolConfig(draft.schoolConfig || defaultSchoolConfig));
                    dispatch(setAllClasses(draft.classes || []));
                    dispatch(setAllSubjects(draft.subjects || []));
                    dispatch(setAllTeachers(draft.teachers || []));
                    dispatch(setAllClassrooms(draft.classrooms || []));
                    dispatch(setAllGrades(draft.grades || []));
                    dispatch(setInitialSchedule(draft.schedule || []));
                    dispatch(setAllLessonRequirements(draft.lessonRequirements || []));
                    dispatch(setAllTeacherConstraints(draft.teacherConstraints || []));
                    dispatch(setAllSubjectRequirements(draft.subjectRequirements || []));
                    dispatch(setAllTeacherAssignments(draft.teacherAssignments || []));
                    setIsInitialized(true);
                })
                .catch((error) => {
                    console.log("No schedule draft found or failed to fetch. Initializing from server props.", error);
                    dispatch(setAllClasses(initialData.classes));
                    dispatch(setAllSubjects(initialData.subjects));
                    dispatch(setAllTeachers(initialData.teachers));
                    dispatch(setAllClassrooms(initialData.classrooms));
                    dispatch(setInitialSchedule(initialData.lessons));
                    dispatch(setAllGrades(initialData.grades));
                    dispatch(setAllLessonRequirements(initialData.lessonRequirements));
                    dispatch(setAllTeacherConstraints(initialData.teacherConstraints));
                    dispatch(setAllSubjectRequirements(initialData.subjectRequirements));
                    dispatch(setAllTeacherAssignments([]));
                    dispatch(setSchoolConfig(defaultSchoolConfig));
                    setIsInitialized(true);
                });
        } else if (draftStatus === 'succeeded' || draftStatus === 'failed') {
            // Already attempted fetch, so we are initialized
            setIsInitialized(true);
        }
    }, [dispatch, draftStatus, initialData]);

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Chargement de votre brouillon...</p>
            </div>
        );
    }

    return <ShuddlePageClient />;
}
