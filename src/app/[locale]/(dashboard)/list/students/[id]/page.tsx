// src/app/[locale]/(dashboard)/list/students/[id]/page.tsx
import Announcements from "@/components/Announcements";
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { type StudentWithDetails, type WizardData, type ClassWithGrade, type TeacherWithDetails, type Subject, type Classroom } from "@/types/index";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import  {Role} from "@prisma/client";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import StudentWeeklyAttendanceChart from "@/components/attendance/StudentWeeklyAttendanceChart";
import StudentProfileCard from "@/components/student/StudentProfileCard";
import StudentStatsCards from "@/components/student/StudentStatsCards";
import StudentShortcuts from "@/components/student/StudentShortcuts";

const SingleStudentPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;
  const locale = 'fr'; // Locale fixe

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined;
  const currentUserId = session?.userId;

  if (!session) redirect(`/${locale}/login`);

  const student: StudentWithDetails | null =
    await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: { include: { _count: { select: { lessons: true } }, grade: true } },
        parent: true,
        grade: true,
      },
  });

  if (!student || !student.class) {
    return notFound();
  }

  let canView = false;
  if (userRole === Role.ADMIN) {
    canView = true;
  } else if (userRole === Role.TEACHER && currentUserId) {
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { supervisorId: currentUserId },
          { lessons: { some: { teacherId: currentUserId } } }
        ],
        students: { some: { id: student.id } }
      },
      select: { id: true }
    });
    if (teacherClasses.length > 0) canView = true;
  } else if (userRole === Role.PARENT && currentUserId) {
    if (student.parentId === currentUserId) canView = true;
  } else if (userRole === Role.STUDENT && currentUserId) {
    if (student.id === currentUserId) canView = true;
  }

  if (!canView) {
     redirect(`/${locale}/${userRole?.toLowerCase() || 'login'}`);
  }

  // Fetch data for TimetableDisplay
  const [lessons, allSubjects, allTeachers, allClassrooms] = await Promise.all([
    prisma.lesson.findMany({
      where: { classId: student.classId },
      select: {
        id: true,
        name: true,
        day: true,
        startTime: true,
        endTime: true,
        subjectId: true,
        classId: true,
        teacherId: true,
        classroomId: true,
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    }),
    prisma.subject.findMany(),
    prisma.teacher.findMany({ 
        include: { 
            user: true, 
            subjects: true, 
            classes: true,
            _count: { select: { classes: true, subjects: true } } 
        } 
    }),
    prisma.classroom.findMany(),
  ]);

  const studentClass = student.class as ClassWithGrade;

  const wizardData: WizardData = {
    school: {
      name: `Classe ${student.class.name}`,
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: [studentClass], 
    subjects: allSubjects,
    teachers: allTeachers as TeacherWithDetails[],
    rooms: allClassrooms,
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
            <StudentProfileCard student={student} userRole={userRole} />
            <StudentStatsCards student={student} />
        </div>
        <div className="mt-4 bg-white rounded-md p-4 h-auto">
          <h1 className="text-xl font-semibold mb-4">{`Horaire de ${student.name} ${student.surname}`}</h1>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <StudentShortcuts student={student} locale={locale} />
        <Suspense fallback={<p>Chargement de la présence...</p>}>
            <StudentWeeklyAttendanceChart studentId={student.id} />
        </Suspense>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;