import { useAppSelector } from '@/hooks/redux-hooks';
import { useMemo } from 'react';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllSalles } from '@/lib/redux/features/classrooms/classroomsSlice';
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { selectTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { selectSubjectRequirements } from '@/lib/redux/features/subjectRequirementsSlice';
import { selectTeacherAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { selectSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';

export default function useWizardData() {
    const school = useAppSelector(selectSchoolConfig);
    const classes = useAppSelector(selectAllClasses);
    const subjects = useAppSelector(selectAllMatieres);
    const teachers = useAppSelector(selectAllProfesseurs);
    const rooms = useAppSelector(selectAllSalles);
    const grades = useAppSelector(selectAllGrades);
    const lessonRequirements = useAppSelector(selectLessonRequirements);
    const teacherConstraints = useAppSelector(selectTeacherConstraints);
    const subjectRequirements = useAppSelector(selectSubjectRequirements);
    const teacherAssignments = useAppSelector(selectTeacherAssignments);

    return useMemo(() => ({
        school,
        classes,
        subjects,
        teachers,
        rooms,
        grades,
        lessonRequirements,
        teacherConstraints,
        subjectRequirements,
        teacherAssignments,
    }), [
        school, classes, subjects, teachers, rooms, grades, 
        lessonRequirements, teacherConstraints, subjectRequirements, teacherAssignments
    ]);
}
