// src/app/[locale]/(dashboard)/list/teachers/[id]/page.tsx
import Announcements from "@/components/Announcements";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { type TeacherWithDetails, type WizardData, type ClassWithGrade, type Subject, type Classroom, type Lesson } from "@/types/index";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import TeacherProfileCard from "@/components/teacher/TeacherProfileCard";
import TeacherStatsCards from "@/components/teacher/TeacherStatsCards";
import TeacherShortcuts from "@/components/teacher/TeacherShortcuts";

const SingleTeacherPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const id = params.id;
  const locale = 'fr'; // Locale fixe

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined;
  const currentUserId = session?.userId;

  if (!session) redirect(`/${locale}/login`);

  if (userRole !== Role.ADMIN && (userRole !== Role.TEACHER || currentUserId !== id)) {
    redirect(session ? `/${locale}/${session.role.toLowerCase()}` : `/${locale}/login`);
  }

  const teacher: Omit<TeacherWithDetails, 'lessons'> & { lessons?: Lesson[] } | null =
    await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        subjects: true,
        classes: true,
        _count: {
          select: {
            classes: true,
            subjects: true,
          }
        }
      },
  });

  if (!teacher) {
    return notFound();
  }

  // --- REFACTORED DATA FETCHING ---
  const lessons = await prisma.lesson.findMany({
    where: { teacherId: id },
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
  });
  
  const classIds = [...new Set(lessons.map(l => l.classId))];

  const teacherClasses = await prisma.class.findMany({
    where: { id: { in: classIds } },
    include: { grade: true },
  }) as ClassWithGrade[];

  const [allSubjects, allClassrooms] = await Promise.all([
    prisma.subject.findMany(),
    prisma.classroom.findMany(),
  ]);

  const wizardData: WizardData = {
    school: {
      name: `Emploi du temps de ${teacher.name} ${teacher.surname}`,
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: teacherClasses,
    subjects: allSubjects as Subject[],
    teachers: [teacher] as TeacherWithDetails[],
    rooms: allClassrooms as Classroom[],
  };
  // --- END REFACTORED DATA FETCHING ---

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <TeacherProfileCard teacher={teacher as TeacherWithDetails} userRole={userRole} />
          <TeacherStatsCards stats={teacher._count} />
        </div>
        <div className="mt-4 bg-white rounded-md p-4 h-auto">
          <h1 className="text-xl font-semibold mb-4">{`Horaire de ${teacher.name} ${teacher.surname}`}</h1>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <TeacherShortcuts teacherId={teacher.id} locale={locale} />
        <Performance title="Performance" />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
