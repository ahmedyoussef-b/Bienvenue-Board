/*
  Warnings:

  - You are about to drop the column `teacherHostId` on the `ChatroomSession` table. All the data in the column will be lost.
  - You are about to drop the column `chatroomSessionId` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `votes` on the `PollOption` table. All the data in the column will be lost.
  - You are about to drop the column `chatroomSessionId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `QuizAnswer` table. All the data in the column will be lost.
  - The primary key for the `ScheduleDraft` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ScheduleDraft` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `SessionParticipant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `joinedAt` on the `SessionParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `leftAt` on the `SessionParticipant` table. All the data in the column will be lost.
  - The primary key for the `SubjectRequirement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `requiredRoomId` column on the `SubjectRequirement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_ClassToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubjectToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,lessonId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,chatroomSessionId]` on the table `SessionParticipant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subjectId]` on the table `SubjectRequirement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `QuizAnswer` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `SessionParticipant` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ChatroomMessage" DROP CONSTRAINT "ChatroomMessage_chatroomSessionId_fkey";

-- DropForeignKey
ALTER TABLE "ChatroomSession" DROP CONSTRAINT "ChatroomSession_teacherHostId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Poll" DROP CONSTRAINT "Poll_chatroomSessionId_fkey";

-- DropForeignKey
ALTER TABLE "PollOption" DROP CONSTRAINT "PollOption_pollId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_chatroomSessionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAnswer" DROP CONSTRAINT "QuizAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAnswer" DROP CONSTRAINT "QuizAnswer_quizId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_chatroomSessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "_ClassToTeacher" DROP CONSTRAINT "_ClassToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClassToTeacher" DROP CONSTRAINT "_ClassToTeacher_B_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_B_fkey";

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ChatroomSession" DROP COLUMN "teacherHostId";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "chatroomSessionId",
DROP COLUMN "createdAt",
DROP COLUMN "endedAt",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PollOption" DROP COLUMN "votes";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "chatroomSessionId",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuizAnswer" DROP COLUMN "studentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuizQuestion" ALTER COLUMN "timeLimit" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ScheduleDraft" DROP CONSTRAINT "ScheduleDraft_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ScheduleDraft_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_pkey",
DROP COLUMN "joinedAt",
DROP COLUMN "leftAt",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "joinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leaveTime" TIMESTAMP(3),
ADD CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "bloodType" DROP NOT NULL,
ALTER COLUMN "birthday" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "gradeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "weeklyHours" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SubjectRequirement" DROP CONSTRAINT "SubjectRequirement_pkey",
DROP COLUMN "requiredRoomId",
ADD COLUMN     "requiredRoomId" INTEGER;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "sex" DROP NOT NULL,
ALTER COLUMN "birthday" DROP NOT NULL,
ALTER COLUMN "birthday" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherConstraint" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ALTER COLUMN "role" SET DEFAULT 'VISITOR',
ALTER COLUMN "active" SET DEFAULT true;

-- DropTable
DROP TABLE "_ClassToTeacher";

-- DropTable
DROP TABLE "_SubjectToTeacher";

-- CreateTable
CREATE TABLE "PollAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pollOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherSubjects" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeacherSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeacherClasses" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeacherClasses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TeacherSubjects_B_index" ON "_TeacherSubjects"("B");

-- CreateIndex
CREATE INDEX "_TeacherClasses_B_index" ON "_TeacherClasses"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_lessonId_date_key" ON "Attendance"("studentId", "lessonId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_name_key" ON "Classroom"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_userId_chatroomSessionId_key" ON "SessionParticipant"("userId", "chatroomSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectRequirement_subjectId_key" ON "SubjectRequirement"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_chatroomSessionId_fkey" FOREIGN KEY ("chatroomSessionId") REFERENCES "ChatroomSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatroomMessage" ADD CONSTRAINT "ChatroomMessage_chatroomSessionId_fkey" FOREIGN KEY ("chatroomSessionId") REFERENCES "ChatroomSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatroomSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollAnswer" ADD CONSTRAINT "PollAnswer_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatroomSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherClasses" ADD CONSTRAINT "_TeacherClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherClasses" ADD CONSTRAINT "_TeacherClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
