
import Image from "next/image";
import CountChart from "./CountChart";
import prisma from "@/lib/prisma";
import type { UserSex } from "@/types/index"; // Import UserSex type

// Specific type for the data from groupBy query
type StudentCountBySex = {
  sex: UserSex;
  _count: { _all: number }; // Prisma 5 uses _all for count with groupBy
};


const CountChartContainer = async () => {
  // Adjusting for Prisma 5 count syntax if that's what you're using.
  // If your Prisma version uses a direct field name like _count: { sex: number }, adjust accordingly.
 const data = await prisma.student.groupBy({
    by: ['sex'],
    _count: {
      _all: true,
    },
  }) as StudentCountBySex[];

  const boys = data.find((d) => d.sex === "MALE")?._count._all || 0;
  const girls = data.find((d) => d.sex === "FEMALE")?._count._all || 0;
  const totalStudents = boys + girls;


  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Étudiants</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-sky-500 rounded-full" /> {/* Updated color */}
          <h1 className="font-bold">{boys}</h1>
          <h2 className="text-xs text-muted-foreground">
             Garçons ({totalStudents > 0 ? Math.round((boys / totalStudents) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="w-5 h-5 bg-pink-500 rounded-full" /> {/* Updated color */}
          <h1 className="font-bold">{girls}</h1>
          <h2 className="text-xs text-muted-foreground">
            Filles ({totalStudents > 0 ? Math.round((girls / totalStudents) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default CountChartContainer;
