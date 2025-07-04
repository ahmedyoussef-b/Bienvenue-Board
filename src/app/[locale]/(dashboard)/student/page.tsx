// src/app/[locale]/(dashboard)/student/page.tsx
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import type { WizardData, ClassWithGrade, TeacherWithDetails } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";

const StudentPage = async () => {
  const locale = 'fr';
  const session = await getServerSession();

  if (!session || session.role !== Role.STUDENT) { 
     redirect(session ? `/${locale}/${(session.role as string).toLowerCase()}` : `/${locale}/login`);
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
        class: {
            include: {
                grade: true,
            }
        }
    }
  });

  if (!student) {
    return (
        <div className="p-4 md:p-6 text-center">
            <Card className="inline-block p-8">
                <CardHeader>
                    <CardTitle>Profil Étudiant Non Trouvé</CardTitle>
                    <CardDescription>
                      Aucun profil étudiant n'est associé à ce compte. Veuillez contacter l'administration.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  if (!student.class) {
    return (
        <div className="p-4 md:p-6 text-center">
            <Card className="inline-block p-8">
                <CardHeader>
                    <CardTitle>Aucune Classe Assignée</CardTitle>
                    <CardDescription>
                        Vous n'êtes actuellement inscrit dans aucune classe.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  const studentClass = student.class as ClassWithGrade;

  const [lessons, allSubjects, allTeachers, allClassrooms] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        classId: studentClass.id,
      },
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
  
  const wizardData: WizardData = {
    school: {
      name: student.class.name,
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
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Mon Emploi du Temps - Classe {student.class.name}</CardTitle>
          <CardDescription>
            Voici votre emploi du temps pour la semaine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPage;
