
import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";
import type { Attendance } from "@/types/index" // Import Attendance type

// Specific type for the data fetched from Prisma
type AttendanceData = Pick<Attendance, 'date' | 'present'>;

const AttendanceChartContainer = async () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6

  // Calculate days since Sunday, then adjust for Monday start if needed
  // For a week starting Monday:
  // If today is Sunday (0), we want to go back 6 days to get to last Monday.
  // If today is Monday (1), we want to go back 0 days.
  // If today is Saturday (6), we want to go back 5 days.
  const daysToSubtractForMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToSubtractForMonday);
  lastMonday.setHours(0, 0, 0, 0); // Start of last Monday

  // For a 6-day week (Mon-Sat), the end date would be last Saturday or today if within current week
  const endOfPeriod = new Date(lastMonday);
  endOfPeriod.setDate(lastMonday.getDate() + 5); // End of Saturday of that week
  endOfPeriod.setHours(23, 59, 59, 999);


  const resData: AttendanceData[] = await prisma.attendance.findMany({
    where: {
      date: {
        gte: lastMonday,
        lte: endOfPeriod, // Fetch up to the end of Saturday
      },
    },
    select: {
      date: true,
      present: true,
    },
  });


  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const attendanceMap: { [key: string]: { present: number; absent: number } } =
    {
      Lun: { present: 0, absent: 0 },
      Mar: { present: 0, absent: 0 },
      Mer: { present: 0, absent: 0 },
      Jeu: { present: 0, absent: 0 },
      Ven: { present: 0, absent: 0 },
      Sam: { present: 0, absent: 0 },
    };

  resData.forEach((item) => {
    const itemDate = new Date(item.date);
    const dayIndex = itemDate.getDay(); // Sunday - 0, ..., Saturday - 6
    
    // Map Sunday (0) and Monday (1) to Saturday (6) to the correct index in daysOfWeek
    // Monday (1) -> daysOfWeek[0]
    // Tuesday (2) -> daysOfWeek[1]
    // ...
    // Saturday (6) -> daysOfWeek[5]
    if (dayIndex >= 1 && dayIndex <= 6) { // Monday to Saturday
      const dayName = daysOfWeek[dayIndex - 1];

      if (item.present) {
        attendanceMap[dayName].present += 1;
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

  const data: { name: string; present: number; absent: number }[] = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="bg-muted p-4 rounded-lg h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">Présence</h1>
        <Image src="/moreDark.png" alt="more options" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
