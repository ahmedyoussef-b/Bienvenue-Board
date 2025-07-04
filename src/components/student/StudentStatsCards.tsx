// src/components/student/StudentStatsCards.tsx
import type { StudentWithDetails } from "@/types/index";
import Image from "next/image";

interface StudentStatsCardsProps {
  student: StudentWithDetails;
}

export default function StudentStatsCards({ student }: StudentStatsCardsProps) {
  return (
    <div className="flex-1 flex gap-4 justify-between flex-wrap">
      <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
        <Image src="/singleBranch.png" alt="niveau" width={24} height={24} className="w-6 h-6" />
        <div>
          <h1 className="text-xl font-semibold">
            {student.grade?.level || 'N/A'}e
          </h1>
          <span className="text-sm text-gray-400">Niveau</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
        <Image src="/singleLesson.png" alt="cours" width={24} height={24} className="w-6 h-6" />
        <div>
          <h1 className="text-xl font-semibold">
            {student.class?._count.lessons || 'N/A'}
          </h1>
          <span className="text-sm text-gray-400">Cours</span>
        </div>
      </div>
      <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
        <Image src="/singleClass.png" alt="classe" width={24} height={24} className="w-6 h-6" />
        <div>
          <h1 className="text-xl font-semibold">{student.class?.name || 'N/A'}</h1>
          <span className="text-sm text-gray-400">Classe</span>
        </div>
      </div>
    </div>
  );
}
