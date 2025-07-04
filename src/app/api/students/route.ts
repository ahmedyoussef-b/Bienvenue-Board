
// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { studentSchema } from '@/lib/formValidationSchemas';
import bcrypt from 'bcryptjs';
import { Role, UserSex } from '@prisma/client'; // Import Prisma enums
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const HASH_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      username,
      email,
      password,
      name,
      surname,
      phone,
      address,
      img,
      bloodType,
      birthday,
      sex,
      gradeId,
      classId,
      parentId,
    } = validation.data;

    // Check for existing user by email or username
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      let message = 'User already exists.';
      if (existingUser.email === email) message = 'User already exists with this email.';
      if (existingUser.username === username) message = 'Username is already taken.';
      return NextResponse.json({ message }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password!, HASH_ROUNDS); // Password is required by schema for create

    const createdStudentWithUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: Role.STUDENT, // Set role to STUDENT
          name: `${name} ${surname}`, // Combine name and surname for User.name
          active: true,
          img: img || null,
        },
      });

      const newStudent = await tx.student.create({
        data: {
          userId: newUser.id,
          name,
          surname,
          phone: phone || null,
          address: address || null,
          img: img || null,
          bloodType,
          birthday: new Date(birthday),
          sex: sex as UserSex, // Cast to Prisma UserSex
          gradeId: Number(gradeId),
          classId: Number(classId),
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              img: true,
            }
          }
        }
      });
      return newStudent;
    });

    return NextResponse.json(createdStudentWithUser, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Unique constraint failed
        // This might be a race condition if not caught by the initial check, or a different unique field
        return NextResponse.json({ message: `A student with some of these details already exists. Details: ${error.meta?.target}` }, { status: 409 });
      }
      // P2003: Foreign key constraint failed (e.g., parentId, classId, gradeId does not exist)
      if (error.code === 'P2003' && error.meta?.field_name) {
         const field = error.meta.field_name as string;
         let friendlyMessage = `Invalid reference for ${field}. Please ensure the selected value exists.`;
         if (field.includes('parentId')) friendlyMessage = 'Invalid Parent ID. The selected parent does not exist.';
         if (field.includes('classId')) friendlyMessage = 'Invalid Class ID. The selected class does not exist.';
         if (field.includes('gradeId')) friendlyMessage = 'Invalid Grade ID. The selected grade does not exist.';
        return NextResponse.json({ message: friendlyMessage, code: error.code }, { status: 400 });
      }
    }
    if (error instanceof Error && error.message.includes("Invalid `prisma.user.create()` invocation")) {
        // More specific error for user creation
        return NextResponse.json({ message: 'Failed to create user part of student profile. Check user fields.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error creating student', error: (error as Error).message }, { status: 500 });
  }
}

// Optional: GET all students (if needed)
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { username: true, email: true, img: true } },
        class: { select: { name: true } },
        grade: { select: { level: true } },
        parent: { select: { name: true, surname: true } },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { surname: 'asc' },
        { name: 'asc' },
      ]
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ message: 'Error fetching students', error: (error as Error).message }, { status: 500 });
  }
}
