// src/app/api/auth/register/route.ts
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { SafeUser } from '@/types/index';
import { Role } from "@prisma/client"; // Role enum from Prisma
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


const JWT_SECRET_KEY_VALUE = process.env.JWT_SECRET_KEY;
const HASH_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'appSessionToken';

export async function POST(req: NextRequest) {
  if (!JWT_SECRET_KEY_VALUE) {
    console.error('JWT_SECRET_KEY is not defined in environment variables.');
    return NextResponse.json({ message: 'Internal server error: JWT secret missing' }, { status: 500 });
  }

  try {
    const { email, password, role, name } = await req.json() as { email: string, password?: string, role: Role, name?: string };

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Email, password, and role are required' }, { status: 400 });
    }

    if (![Role.TEACHER, Role.PARENT].includes(role)) {
        return NextResponse.json({ message: 'Invalid role for registration' }, { status: 400 });
    }

    const username = email;

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
        let message = 'Un utilisateur existe déjà.';
        if (existingUser.email === email) message = 'Un utilisateur existe déjà avec cet email.';
        if (existingUser.username === username) message = 'Ce nom d\'utilisateur est déjà pris.';
        return NextResponse.json({ message }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);
    
    // Use a transaction to create the User and the Profile together
    const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role,
                name: name || email,
                active: true,
            },
        });
        
        const [firstName, ...lastNameParts] = (name || email).split(' ');
        const lastName = lastNameParts.join(' ') || 'Utilisateur';

        if (role === Role.TEACHER) {
            await tx.teacher.create({
                data: { userId: user.id, name: firstName, surname: lastName },
            });
        } else if (role === Role.PARENT) {
            await tx.parent.create({
                data: { userId: user.id, name: firstName, surname: lastName },
            });
        }

        return user;
    });


    const { password: _, ...userWithoutPassword } = newUser;

    const tokenPayload = {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      email: newUser.email,
      name: newUser.name, // Pass the full name to JWT
    };

    const secretKey: Secret = JWT_SECRET_KEY_VALUE;
    const signOptions: SignOptions = {
      expiresIn: 86400 // 1 day in seconds
    };

    const token = jwt.sign(tokenPayload, secretKey, signOptions);

    const safeUserResponse: SafeUser = {
      ...userWithoutPassword,
      name: newUser.name,
    };

    const response = NextResponse.json({ message: 'User registered successfully', user: safeUserResponse }, { status: 201 });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('[REGISTER_API_ERROR]', error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: 'Email or username already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: (error as Error).message }, { status: 500 });
  }
}
