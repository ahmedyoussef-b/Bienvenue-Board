// src/app/[locale]/(dashboard)/list/classes/[id]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { Role as AppRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DynamicAvatar from "@/components/DynamicAvatar";
import type { Prisma } from "@prisma/client";

// Define arguments for the prisma query to ensure type safety and reusability
const classWithDetailsArgs = {
    include: {
      grade: true,
      supervisor: {
        include: {
          user: true,
        },
      },
      students: {
        include: {
          user: true,
        },
        orderBy: [{ surname: 'asc' }, { name: 'asc' }],
      },
      _count: {
        select: { students: true, lessons: true },
      },
    },
} satisfies Prisma.ClassFindUniqueArgs;

// Infer the type from the query arguments
type ClassWithDetails = Prisma.ClassGetPayload<typeof classWithDetailsArgs>;


const SingleClassPage = async ({ params }: { params: { id: string } }) => {
  const locale = 'fr'; 
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const session = await getServerSession();
  const userRole = session?.role as AppRole | undefined;

  const classData = await prisma.class.findUnique({
    where: { id },
    ...classWithDetailsArgs
  });

  if (!classData) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/list/classes?viewGradeId=${classData.gradeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux Classes du Niveau {classData.grade.level}
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Classe: {classData.name}
        </h1>
        {userRole === AppRole.ADMIN && (
            <FormContainer table="class" type="update" data={classData} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de Gauche: Infos & Étudiants */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Niveau</span>
                        <span className="font-semibold">{classData.grade.level}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Effectif</span>
                        <span className="font-semibold">{classData._count.students} / {classData.capacity}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cours/Semaine</span>
                        <span className="font-semibold">{classData._count.lessons}</span>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Superviseur</CardTitle>
                </CardHeader>
                <CardContent>
                    {classData.supervisor ? (
                         <Link href={`/${locale}/list/teachers/${classData.supervisor.id}`} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted transition-colors">
                            <DynamicAvatar 
                                imageUrl={classData.supervisor.user?.img || classData.supervisor.img}
                                seed={classData.supervisor.id}
                            />
                            <div>
                                <p className="font-semibold text-primary">{classData.supervisor.name} {classData.supervisor.surname}</p>
                                <p className="text-sm text-muted-foreground">{classData.supervisor.user?.email}</p>
                            </div>
                        </Link>
                    ) : (
                        <p className="text-muted-foreground text-sm">Aucun superviseur assigné.</p>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users /> 
                        <span>Liste des Étudiants ({classData._count.students})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto pr-2">
                    <div className="space-y-3">
                        {classData.students.map(student => (
                            <Link key={student.id} href={`/${locale}/list/students/${student.id}`} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                               <Avatar className="h-9 w-9">
                                    <AvatarImage src={student.user?.img || student.img || `https://api.dicebear.com/7.x/identicon/svg?seed=${student.id}`} alt={`${student.name} ${student.surname}`} />
                                    <AvatarFallback>{student.name[0]}{student.surname[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{student.name} {student.surname}</p>
                                    <p className="text-xs text-muted-foreground">{student.user?.email}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Colonne de Droite: Emploi du Temps */}
        <div className="lg:col-span-2">
            <Card className="h-[900px] flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CalendarIcon />
                        <span>Emploi du Temps</span>
                    </CardTitle>
                    <CardDescription>
                        Horaire des cours pour la classe {classData.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <BigCalendarContainer type="classId" id={classData.id} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default SingleClassPage;
