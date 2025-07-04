
// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { teacherSchema } from '@/lib/formValidationSchemas';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { TeacherWithDetails } from '@/types';

const HASH_ROUNDS = 10;

export async function GET() {
  try {
    const teachersFromDb = await prisma.teacher.findMany({
      include: {
        user: true,
        subjects: true,
        classes: true, // Include classes to count them
      },
      orderBy: {
        name: 'asc'
      }
    });

    const teachers: TeacherWithDetails[] = teachersFromDb.map(t => ({
      ...t,
      // Manually add the _count property based on included relations
      _count: {
        subjects: t.subjects.length,
        classes: t.classes.length, // Count the classes
      }
    }));

    return NextResponse.json(teachers);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('❌ GET /api/teachers: A required table does not exist. Please run `prisma migrate dev`.');
       return NextResponse.json({ message: "Erreur serveur : Une table requise pour les professeurs est introuvable. Veuillez exécuter les migrations de base de données." }, { status: 500 });
    }
    return NextResponse.json({ message: "Erreur lors de la récupération des professeurs", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("➡️ POST /api/teachers: Received request.");
  try {
    const body = await request.json();
    console.log("📝 POST /api/teachers: Request body:", JSON.stringify(body, null, 2));

    const validation = teacherSchema.safeParse(body);
    if (!validation.success) {
      console.error("❌ POST /api/teachers: Validation error:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    console.log("✅ POST /api/teachers: Validation successful.");
    const {
      username, email, password, name, surname, phone, address, img,
      bloodType, birthday, sex, subjects: subjectIds = []
    } = validation.data;
    
    console.log("🧐 POST /api/teachers: Checking for existing user...");
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      let message = "Un utilisateur existe déjà.";
      if (existingUser.email === email) message = "Un utilisateur existe déjà avec cet email.";
      if (existingUser.username === username) message = "Ce nom d'utilisateur est déjà pris.";
      console.warn(`⚠️ POST /api/teachers: Conflict found - ${message}`);
      return NextResponse.json({ message }, { status: 409 });
    }
    console.log("👍 POST /api/teachers: No existing user found.");

    if (!password) {
      console.error("❌ POST /api/teachers: Password is required but was not provided in validated data.");
      throw new Error("Le mot de passe est manquant pour la création de l'utilisateur.");
    }
    console.log("🔐 POST /api/teachers: Hashing password...");
    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);
    console.log("✅ POST /api/teachers: Password hashed.");
    
    console.log("🔄 POST /api/teachers: Starting database transaction...");
    const newTeacherData = await prisma.$transaction(async (tx) => {
      console.log("  -> Transaction: Creating user...");
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: Role.TEACHER,
          name: `${name} ${surname}`,
          active: true,
          img: img || null,
        },
      });
      console.log(`  -> Transaction: User created with ID: ${newUser.id}`);

      const numericSubjectIds = subjectIds.map(id => Number(id)).filter(id => !isNaN(id));
      console.log(`  -> Transaction: Connecting subjects with IDs: ${numericSubjectIds.join(', ')}`);

      console.log("  -> Transaction: Creating teacher...");
      const newTeacher = await tx.teacher.create({
        data: {
          userId: newUser.id,
          name,
          surname,
          phone: phone || null,
          address: address || null,
          img: img || null,
          bloodType: bloodType || null,
          birthday: birthday ? new Date(birthday) : null,
          sex: sex || null,
          subjects: {
            connect: numericSubjectIds.map(id => ({ id })),
          },
        },
        include: {
            subjects: true
        }
      });
      console.log(`  -> Transaction: Teacher created with ID: ${newTeacher.id}`);
      
      const { password, ...safeUser } = newUser;

      return {
          ...newTeacher,
          user: safeUser,
      };
    });

    if (!newTeacherData) {
        console.error("❌ POST /api/teachers: Transaction completed but returned no data.");
        throw new Error("La création de l'enseignant a échoué après la transaction.");
    }
    console.log("✅ POST /api/teachers: Transaction successful.");

    const responseData: TeacherWithDetails = {
        ...newTeacherData,
        classes: [], // A new teacher has no classes assigned yet
        _count: {
            subjects: newTeacherData.subjects.length,
            classes: 0, 
        }
    };
    
    console.log("⬅️ POST /api/teachers: Sending successful response.");
    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error("❌ POST /api/teachers: An error occurred in the handler:", error);
    if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' && error.meta?.field_name) {
            const field = error.meta.field_name as string;
            return NextResponse.json({ message: `Référence invalide pour ${field}. Assurez-vous que la valeur sélectionnée existe.`, code: error.code }, { status: 400 });
        }
    }
    if(error instanceof Error && error.stack) {
        console.error("Stack Trace:", error.stack);
    }
    return NextResponse.json({ message: "Erreur interne du serveur lors de la création de l'enseignant.", error: (error as Error).message }, { status: 500 });
  }
}
