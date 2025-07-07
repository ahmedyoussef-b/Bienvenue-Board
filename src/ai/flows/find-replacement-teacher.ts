'use server';
/**
 * @fileOverview An AI agent for finding teacher replacements.
 *
 * - findReplacementTeacher - A function that handles finding replacements.
 * - FindReplacementTeacherInput - The input type for the function.
 * - FindReplacementTeacherOutput - The return type for the function.
 */

import { z } from 'zod';
import prisma from '@/lib/prisma';
import type { Day } from '@prisma/client';
import { findConflictingConstraint } from '@/lib/schedule-utils';
import { ai } from '@/ai/genkit';

// Schemas for input and output
export const FindReplacementTeacherInputSchema = z.object({
  absentTeacherId: z.string().describe("The ID of the teacher who is absent."),
  date: z.string().describe("The date of absence in ISO format (e.g., '2024-10-26')."),
});
export type FindReplacementTeacherInput = z.infer<typeof FindReplacementTeacherInputSchema>;

const ReplacementSuggestionSchema = z.object({
  teacherId: z.string(),
  name: z.string(),
  reason: z.string().describe("A brief justification for why this teacher is a good replacement."),
});

const LessonSuggestionSchema = z.object({
  lessonId: z.number(),
  lessonName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  suggestedReplacements: z.array(ReplacementSuggestionSchema).describe("A list of suitable replacement teachers for this specific lesson."),
  alternativeSolution: z.string().optional().describe("If no replacement is found, suggest an alternative like a study hall or combining classes."),
});

export const FindReplacementTeacherOutputSchema = z.object({
  suggestions: z.array(LessonSuggestionSchema),
});
export type FindReplacementTeacherOutput = z.infer<typeof FindReplacementTeacherOutputSchema>;


// Tool definition using ai.defineTool
const getTeacherAvailability = ai.defineTool(
  {
    name: 'getTeacherAvailability',
    description: 'Get a list of available and qualified teachers for a specific lesson slot.',
    inputSchema: z.object({
      day: z.nativeEnum(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
      startTime: z.string().describe("The start time of the lesson in HH:mm format."),
      endTime: z.string().describe("The end time of the lesson in HH:mm format."),
      subjectId: z.number().describe("The ID of the subject for the lesson."),
      absentTeacherId: z.string().describe("The ID of the absent teacher to exclude from results."),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      surname: z.string(),
    })),
  },
  async ({ day, startTime, endTime, subjectId, absentTeacherId }) => {
    // 1. Find teachers qualified for the subject
    const qualifiedTeachers = await prisma.teacher.findMany({
      where: {
        subjects: {
          some: { id: subjectId }
        },
        id: {
          not: absentTeacherId // Exclude the absent teacher
        }
      },
      select: { id: true, name: true, surname: true }
    });
    
    // 2. Find teachers already busy with lessons at that time
    const busyTeacherIds = (await prisma.lesson.findMany({
      where: {
        day: day,
        startTime: {
          lte: new Date(`1970-01-01T${endTime}:00.000Z`)
        },
        endTime: {
          gte: new Date(`1970-01-01T${startTime}:00.000Z`)
        }
      },
      select: { teacherId: true }
    })).map(l => l.teacherId);

    // 3. Find teachers with constraints at that time
    const allConstraints = await prisma.teacherConstraint.findMany({});
    const constrainedTeacherIds = qualifiedTeachers
      .filter(t => findConflictingConstraint(t.id, day, startTime, endTime, allConstraints))
      .map(t => t.id);
    
    // 4. Combine busy and constrained IDs
    const unavailableTeacherIds = new Set([...busyTeacherIds, ...constrainedTeacherIds]);
    
    // 5. Filter qualified teachers to find who is available
    return qualifiedTeachers.filter(t => !unavailableTeacherIds.has(t.id));
  }
);


// Flow definition using ai.defineFlow
const findReplacementTeacherFlow = ai.defineFlow(
  {
    name: 'findReplacementTeacherFlow',
    inputSchema: FindReplacementTeacherInputSchema,
    outputSchema: FindReplacementTeacherOutputSchema,
  },
  async ({ absentTeacherId, date }) => {
    const dayOfWeek = new Date(date).getDay();
    const dayMapping: Day[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const day = dayMapping[dayOfWeek];

    if (!day) {
      throw new Error("Invalid date provided.");
    }

    const absentTeacher = await prisma.teacher.findUnique({ where: { id: absentTeacherId }});
    if (!absentTeacher) throw new Error("Absent teacher not found.");
    
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: absentTeacherId, day },
      include: { subject: true },
      orderBy: { startTime: 'asc' },
    });

    if (lessons.length === 0) {
      return { suggestions: [] };
    }

    const simpleLessons = lessons.map(l => ({
        lessonId: l.id,
        name: l.name,
        subjectId: l.subjectId,
        subjectName: l.subject.name,
        startTime: l.startTime.toISOString().substring(11, 16),
        endTime: l.endTime.toISOString().substring(11, 16)
    }));
    
    // Use ai.generate and new response format
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `You are a helpful school administration assistant. Your task is to find the best possible replacements for an absent teacher's lessons.`,
      prompt: `Teacher ${absentTeacher.name} ${absentTeacher.surname} (ID: ${absentTeacherId}) is absent on ${day}. 
      Their schedule for the day is: ${JSON.stringify(simpleLessons)}.
      
      For each lesson, use the 'getTeacherAvailability' tool to find qualified and available teachers.
      Analyze the list of available teachers and suggest the top 1-2 candidates for each lesson. Provide a brief, logical reason for each suggestion.
      If no suitable teacher is found using the tool for a specific lesson, you MUST suggest a practical alternative solution, such as 'Assign a study hall' or 'Combine this class with another one'. Do not leave any lesson without a suggestion.
      `,
      tools: [getTeacherAvailability],
      output: {
        schema: FindReplacementTeacherOutputSchema
      }
    });

    return response.output!;
  }
);


// Exported server action, directly calls the flow
export async function findReplacementTeacher(input: FindReplacementTeacherInput): Promise<FindReplacementTeacherOutput> {
  return await findReplacementTeacherFlow(input);
}
