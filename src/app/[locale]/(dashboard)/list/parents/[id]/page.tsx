// src/app/[locale]/(dashboard)/list/parents/[id]/page.tsx
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { Role as AppRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, Calendar as CalendarIcon, ArrowLeft, Mail, Phone, Home } from "lucide-react";
import Link from "next/link";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import DynamicAvatar from "@/components/DynamicAvatar";
import type { WizardData, ClassWithGrade, TeacherWithDetails, Parent, Student, Subject, Classroom } from '@/types';

const SingleParentPage = async ({ params }: { params: { id: string } }) => {
  const locale = 'fr'; 
  const { id } = params;

  const session = await getServerSession();
  const userRole = session?.role as AppRole | undefined;
  const currentUserId = session?.userId;
  
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const parent = await prisma.parent.findUnique({
    where: { id },
    include: {
      user: true,
      students: {
        include: {
          class: {
            include: {
              grade: true
            }
          }
        },
        orderBy: [{ surname: 'asc' }, { name: 'asc' }],
      },
    },
  });

  if (!parent) {
    notFound();
  }

  // --- Access Control ---
  let canView = false;
  if (userRole === AppRole.ADMIN) {
    canView = true;
  } else if (userRole === AppRole.PARENT && parent.userId === currentUserId) {
    canView = true;
  } else if (userRole === AppRole.TEACHER && currentUserId) {
    const studentIds = parent.students.map(s => s.id);
    if (studentIds.length > 0) {
        const teacherClassesCount = await prisma.class.count({
            where: {
                students: { some: { id: { in: studentIds } } },
                OR: [
                    { supervisorId: currentUserId },
                    { lessons: { some: { teacherId: currentUserId } } }
                ]
            }
        });
        if (teacherClassesCount > 0) canView = true;
    }
  }

  if (!canView) {
    redirect(`/${locale}/${userRole?.toLowerCase() || 'login'}`);
  }
  // --- End Access Control ---

  const childrenClassIds = [...new Set(parent.students.map(child => child.classId).filter((id): id is number => id !== null))];

  const [lessons, allSubjects, allTeachers, allClassrooms] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        classId: { in: childrenClassIds },
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

  const childrenClasses = parent.students.map(c => c.class).filter((c): c is ClassWithGrade => !!c);
  const uniqueChildrenClasses = Array.from(new Map(childrenClasses.map(item => [item.id, item])).values());
  
  const wizardData: WizardData = {
    school: {
      name: `Emploi du temps des enfants de ${parent.name} ${parent.surname}`,
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: uniqueChildrenClasses,
    subjects: allSubjects as Subject[],
    teachers: allTeachers as TeacherWithDetails[],
    rooms: allClassrooms as Classroom[],
  };


  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/list/parents`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste des Parents
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Profil Parent: {parent.name} {parent.surname}
        </h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de Gauche: Infos & Enfants */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <DynamicAvatar 
                            imageUrl={parent.user?.img || parent.img}
                            seed={parent.id}
                        />
                         <div className="flex-1">
                            <p className="font-semibold text-lg">{parent.name} {parent.surname}</p>
                            <p className="text-sm text-muted-foreground">{parent.user?.username}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.user?.email || "Non fourni"}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.phone || "Non fourni"}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.address || "Non fourni"}</span>
                     </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users /> 
                        <span>Enfants ({parent.students.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {parent.students.map(student => (
                            <Link key={student.id} href={`/${locale}/list/students/${student.id}`} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                                <DynamicAvatar
                                  imageUrl={student.img}
                                  seed={student.id}
                                />
                                <div>
                                    <p className="text-sm font-medium text-foreground">{student.name} {student.surname}</p>
                                    <p className="text-xs text-muted-foreground">Classe: {student.class?.name || 'N/A'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Colonne de Droite: Emploi du Temps des Enfants */}
        <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CalendarIcon />
                        <span>Emplois du Temps des Enfants</span>
                    </CardTitle>
                    <CardDescription>
                        Vue combinée de l'horaire des cours pour tous les enfants.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow min-h-[700px]">
                    <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleParentPage;
