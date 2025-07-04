// src/app/[locale]/(dashboard)/list/classes/page.tsx
import FormContainer from "@/components/FormContainer";
import prisma from "@/lib/prisma";
import { type Class, type Grade, type Teacher, Role as AppRole } from "@/types/index";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers3 } from "lucide-react";
import GradeCard from "@/components/classes/GradeCard";
import ClassCard from "@/components/classes/ClassCard";

type GradeWithClassCount = Grade & {
  _count: { classes: number };
};

type ClassWithDetails = Class & {
  supervisor: Pick<Teacher, 'name' | 'surname'> | null;
  _count: { students: number };
};

const ClassesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const locale = 'fr'; 
  const session = await getServerSession();
  const userRole = session?.role as AppRole | undefined;

  const viewGradeId = searchParams?.viewGradeId ? Number(searchParams.viewGradeId as string) : null;

  if (viewGradeId) {
    const selectedGrade = await prisma.grade.findUnique({
      where: { id: viewGradeId },
    });

    if (!selectedGrade) {
      return <div className="p-6 text-center text-destructive">Niveau sélectionné non trouvé.</div>; 
    }

    const classesInGrade: ClassWithDetails[] = await prisma.class.findMany({
      where: { gradeId: viewGradeId },
      include: {
        supervisor: { select: { name: true, surname: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }) as ClassWithDetails[];

    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/list/classes`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux Niveaux 
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {`Classes du Niveau ${selectedGrade.level}`} 
          </h1>
          {userRole === AppRole.ADMIN && (
            <FormContainer
              table="class"
              type="create"
              data={{ gradeId: selectedGrade.id }} 
            />
          )}
        </div>

        {classesInGrade.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aucune classe trouvée dans ce niveau.</p> 
            {userRole === AppRole.ADMIN && <p className="text-sm mt-2 text-muted-foreground">Vous pouvez en ajouter une avec le bouton ci-dessus.</p>} 
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {classesInGrade.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} locale={locale} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const grades: GradeWithClassCount[] = await prisma.grade.findMany({
    include: {
      _count: { select: { classes: true } },
    },
    orderBy: { level: 'asc' },
  }) as GradeWithClassCount[];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers3 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Niveaux Scolaires</h1> 
              <p className="text-muted-foreground text-sm">Organisez et gérez les niveaux et les classes de votre établissement.</p>
            </div>
        </div>
        {userRole === AppRole.ADMIN && (
          <FormContainer table="grade" type="create" />
        )}
      </div>

      {grades.length === 0 ? (
         <div className="text-center py-16 bg-muted/50 rounded-lg">
            <p className="text-lg text-muted-foreground">Aucun niveau trouvé.</p> 
            {userRole === AppRole.ADMIN && <p className="text-sm mt-2 text-muted-foreground">Pensez à ajouter le premier niveau pour commencer.</p>} 
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {grades.map((grade) => ( 
            <GradeCard key={grade.id} grade={grade} locale={locale} userRole={userRole} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
