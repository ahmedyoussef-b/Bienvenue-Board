// src/components/student/StudentShortcuts.tsx
import Link from "next/link";
import type { StudentWithDetails } from "@/types/index";

interface StudentShortcutsProps {
  student: StudentWithDetails;
  locale: string;
}

export default function StudentShortcuts({ student, locale }: StudentShortcutsProps) {
  if (!student.classId) {
    return null;
  }
  return (
    <div className="bg-white p-4 rounded-md">
      <h1 className="text-xl font-semibold">Raccourcis</h1>
      <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
        <Link
          className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/lessons?classId=${student.classId}`}
        >
          Cours de l'étudiant
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaPurpleLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/teachers?classId=${student.classId}`}
        >
          Enseignants de l'étudiant
        </Link>
        <Link
          className="p-3 rounded-md bg-pink-50 shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/exams?classId=${student.classId}`}
        >
          Examens de l'étudiant
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/assignments?classId=${student.classId}`}
        >
          Devoirs de l'étudiant
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaYellowLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/results?studentId=${student.id}`}
        >
          Résultats de l'étudiant
        </Link>
      </div>
    </div>
  );
}
