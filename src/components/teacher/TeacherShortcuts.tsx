// src/components/teacher/TeacherShortcuts.tsx
import Link from "next/link";

interface TeacherShortcutsProps {
  teacherId: string;
  locale: string;
}

export default function TeacherShortcuts({ teacherId, locale }: TeacherShortcutsProps) {
  return (
    <div className="bg-white p-4 rounded-md">
      <h1 className="text-xl font-semibold">Raccourcis</h1>
      <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
        <Link
          className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/classes?supervisorId=${teacherId}`}
        >
          Classes Supervisées
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaPurpleLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/students?teacherId=${teacherId}`}
        >
          Étudiants de l'enseignant
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaYellowLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/lessons?teacherId=${teacherId}`}
        >
          Cours de l'enseignant
        </Link>
        <Link
          className="p-3 rounded-md bg-pink-50 shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/exams?teacherId=${teacherId}`}
        >
          Examens de l'enseignant
        </Link>
        <Link
          className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
          href={`/${locale}/list/assignments?teacherId=${teacherId}`}
        >
          Devoirs de l'enseignant
        </Link>
      </div>
    </div>
  );
}
