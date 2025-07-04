// src/app/[locale]/(dashboard)/parent/page.tsx
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import type { WizardData, ClassWithGrade, TeacherWithDetails } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Announcements from "@/components/Announcements";

const ParentPage = async () => {
  const locale = 'fr';
  const session = await getServerSession();
  
  if (!session || session.role !== Role.PARENT) { 
    redirect(session ? `/${locale}/${session.role.toLowerCase()}` : `/${locale}/login`);
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.userId }
  });

  if (!parent) {
     return (
        <div className="p-4 md:p-6 text-center">
            <Card className="inline-block p-8">
                <CardHeader>
                    <CardTitle>Profil Parent Non Trouvé</CardTitle>
                    <CardDescription>
                      Aucun profil de parent n'est associé à ce compte. Veuillez contacter l'administration.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }
  
  const children = await prisma.student.findMany({
    where: {
      parentId: parent.id,
    },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });

  if (children.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold mb-4">Tableau de Bord Parent</h1>
        <p>Aucun étudiant associé à ce compte parent.</p>
        <Announcements />
      </div>
    );
  }

  const childrenClassIds = [...new Set(children.map(child => child.classId).filter(id => id !== null))] as number[];
  
  const [lessons, allSubjects, allTeachers, allClassrooms] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        classId: {
          in: childrenClassIds,
        },
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
  
  const childrenClasses = children.map(c => c.class).filter((c): c is ClassWithGrade => c !== null);
  const uniqueChildrenClasses = Array.from(new Map(childrenClasses.map(item => [item['id'], item])).values());


  const wizardData: WizardData = {
    school: {
      name: "Emplois du temps de mes enfants",
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: uniqueChildrenClasses,
    subjects: allSubjects,
    teachers: allTeachers as TeacherWithDetails[],
    rooms: allClassrooms,
  };

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps des Enfants</CardTitle>
          <CardDescription>
            Consultez les emplois du temps pour chaque classe de vos enfants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentPage;
