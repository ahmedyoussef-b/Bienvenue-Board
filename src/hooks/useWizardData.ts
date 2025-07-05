import { useAppSelector } from '@/hooks/redux-hooks';
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
    // This hook just aggregates data from the redux store.
    // No useMemo is needed here as useAppSelector handles re-renders correctly.
    return {
        school: useAppSelector(selectSchoolConfig),
        classes: useAppSelector(selectAllClasses),
        subjects: useAppSelector(selectAllMatieres),
        teachers: useAppSelector(selectAllProfesseurs),
        rooms: useAppSelector(selectAllSalles),
        grades: useAppSelector(selectAllGrades),
        lessonRequirements: useAppSelector(selectLessonRequirements),
        teacherConstraints: useAppSelector(selectTeacherConstraints),
        subjectRequirements: useAppSelector(selectSubjectRequirements),
        teacherAssignments: useAppSelector(selectTeacherAssignments),
    };
}
