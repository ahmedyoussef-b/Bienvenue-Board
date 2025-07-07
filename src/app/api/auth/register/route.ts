// src/app/api/auth/register/route.ts
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { SafeUser } from '@/types/index';
import { Role, Prisma } from "@prisma/client"; // Role enum from Prisma
import { SESSION_COOKIE_NAME } from '@/lib/constants';


const JWT_SECRET_KEY_VALUE = process.env.JWT_SECRET_KEY;
const HASH_ROUNDS = 10;

export async function POST(req: NextRequest) {
  console.log("➡️ [API] POST /api/auth/register: Request received.");
  if (!JWT_SECRET_KEY_VALUE) {
    console.error("❌ [API] Registration failed: JWT_SECRET_KEY is not defined.");
    return NextResponse.json({ message: 'Internal server error: JWT secret missing' }, { status: 500 });
  }

  try {
    const { email, password, role, name } = await req.json() as { email: string, password?: string, role: Role, name?: string };
    console.log(`[API] Attempting registration for email: ${email}, role: ${role}`);

    if (!email || !password || !role) {
      console.warn('[API] Registration failed: Missing required fields.');
      return NextResponse.json({ message: 'Email, password, and role are required' }, { status: 400 });
    }

    if (![Role.TEACHER, Role.PARENT].includes(role)) {
        console.warn(`[API] Registration failed: Invalid role specified: ${role}`);
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
        console.warn(`[API] Registration failed: ${message}`);
        return NextResponse.json({ message }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);
    console.log("[API] Password hashed. Starting transaction to create user and profile.");
    
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
        console.log(`[API] ✅ User created in DB with ID: ${user.id}`);
        
        const [firstName, ...lastNameParts] = (name || email).split(' ');
        const lastName = lastNameParts.join(' ') || 'Utilisateur';

        if (role === Role.TEACHER) {
            await tx.teacher.create({
                data: { userId: user.id, name: firstName, surname: lastName },
            });
             console.log(`[API] ✅ Teacher profile created for user ID: ${user.id}`);
        } else if (role === Role.PARENT) {
            await tx.parent.create({
                data: { userId: user.id, name: firstName, surname: lastName },
            });
             console.log(`[API] ✅ Parent profile created for user ID: ${user.id}`);
        }

        return user;
    });

    console.log("[API] Transaction successful. Generating session token.");
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

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'none',
    });
    console.log(`[API] 🍪 Session cookie set for new user ${newUser.username}.`);

    return response;

  } catch (error) {
     console.error("[API] ❌ Unexpected error during registration:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: 'Email or username already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: (error as Error).message }, { status: 500 });
  }
}
