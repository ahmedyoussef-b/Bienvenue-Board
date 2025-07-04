// src/app/[locale]/(dashboard)/list/attendance/page.tsx
import prisma from "@/lib/prisma";
import AttendanceManager from "@/components/attendance/AttendanceManager";

const AttendancePage = async () => {
  // Fetch all data needed for the form wizard in a single pass
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      students: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
        orderBy: [{ surname: "asc" }, {name: "asc"}],
      },
    },
    orderBy: { name: "asc" },
  });

  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      classId: true,
      day: true,
      startTime: true,
      subject: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  });

  return (
    <div className="p-4 md:p-6">
      <AttendanceManager classes={classes} lessons={lessons} />
    </div>
  );
};

export default AttendancePage;
