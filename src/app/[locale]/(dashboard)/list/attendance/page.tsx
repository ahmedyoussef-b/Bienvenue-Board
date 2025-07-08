// src/app/[locale]/(dashboard)/list/attendance/page.tsx
import prisma from "@/lib/prisma";
import AttendanceManager from "@/components/attendance/AttendanceManager";

const AttendancePage = async () => {
  // Fetch all data needed for the form wizard in a single pass
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
      capacity: true,
      gradeId: true,
      students: { // Select students for the AttendanceManager component
        select: {
          id: true,
          name: true,
          surname: true,
          classId: true, // Include classId in student selection if needed in AttendanceManager
        },
      },
      grade: true, // Include grade if needed in AttendanceManager
      _count: { // Include student count if needed
        select: { students: true },
      }
    },
    orderBy: { name: "asc" },
  });

  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      classId: true,
      name: true, // Assuming lesson has a name field
      day: true,
      startTime: true,
      endTime: true,
      subjectId: true,
      subject: {
        select: {
          id: true,
          name: true
        }
      },
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  });

  console.log("Fetched lessons:", lessons);

  return (
    <div className="p-4 md:p-6">
      <AttendanceManager classes={classes} lessons={lessons} />
    </div>
  );
};

export default AttendancePage;
