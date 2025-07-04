
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { subjectSchema } from '@/lib/formValidationSchemas';

const updateSubjectSchema = subjectSchema.partial();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  console.log(`➡️ PUT /api/subjects/${id}: Received request`);

  if (isNaN(id)) {
    console.error(`❌ PUT /api/subjects/${id}: Invalid ID`);
    return NextResponse.json({ message: 'ID de matière invalide' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log(`📝 PUT /api/subjects/${id}: Request body:`, body);
    const validatedData = updateSubjectSchema.parse(body);
    console.log(`✅ PUT /api/subjects/${id}: Validation successful:`, validatedData);
    
    const { teachers: teacherIds, ...subjectData } = validatedData;

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
          ...subjectData,
          teachers: teacherIds !== undefined ? {
              set: teacherIds.map((id: string) => ({ id })),
          } : undefined,
      },
    });
    console.log(`⬅️ PUT /api/subjects/${id}: Successfully updated subject:`, updatedSubject);
    return NextResponse.json(updatedSubject);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error(`❌ PUT /api/subjects/${id}: Validation error:`, error.errors);
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    console.error(`❌ PUT /api/subjects/${id}: Error updating subject:`, error);
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ message: 'Erreur lors de la mise à jour de la matière', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    console.log(`➡️ DELETE /api/subjects/${id}: Received request`);

    if (isNaN(id)) {
        console.error(`❌ DELETE /api/subjects/${id}: Invalid ID`);
        return NextResponse.json({ message: 'ID de matière invalide' }, { status: 400 });
    }

    try {
        // Check for dependencies before deleting
        const lessonCount = await prisma.lesson.count({
            where: { subjectId: id },
        });

        if (lessonCount > 0) {
            return NextResponse.json({ message: `Impossible de supprimer cette matière. Elle est utilisée dans ${lessonCount} cours.` }, { status: 409 });
        }

        const deletedSubject = await prisma.subject.delete({
            where: { id },
        });
        console.log(`⬅️ DELETE /api/subjects/${id}: Successfully deleted subject:`, deletedSubject);
        return NextResponse.json(deletedSubject);
    } catch (error: any) {
        if (error instanceof prisma.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                console.error(`❌ DELETE /api/subjects/${id}: Subject not found`);
                return NextResponse.json({ message: 'Matière non trouvée' }, { status: 404 });
            }
             if (error.code === 'P2003') { // Fallback for other relations
                return NextResponse.json({ message: "Impossible de supprimer cette matière, elle est utilisée par d'autres enregistrements." }, { status: 409 });
            }
        }
        console.error(`❌ DELETE /api/subjects/${id}: Error deleting subject:`, error);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
        return NextResponse.json({ message: "Erreur lors de la suppression de la matière", error: String(error) }, { status: 500 });
    }
}
