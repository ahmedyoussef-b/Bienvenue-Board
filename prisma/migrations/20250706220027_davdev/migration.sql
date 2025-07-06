/*
  Warnings:

  - The primary key for the `LessonRequirement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `PollAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `pollOptionId` on the `PollAnswer` table. All the data in the column will be lost.
  - The primary key for the `ScheduleDraft` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `joinTime` on the `SessionParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `leaveTime` on the `SessionParticipant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classId,subjectId]` on the table `LessonRequirement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,examId]` on the table `Result` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,assignmentId]` on the table `Result` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `ScheduleDraft` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phone` on table `Admin` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Announcement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `startTime` on the `Lesson` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `Lesson` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `optionId` to the `PollAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pollId` to the `PollAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ScheduleDraft` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bloodType` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `parentId` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coefficient` on table `Subject` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weeklyHours` on table `Subject` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_classId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ChatroomMessage" DROP CONSTRAINT "ChatroomMessage_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ChatroomSession" DROP CONSTRAINT "ChatroomSession_hostId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_classId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "LessonRequirement" DROP CONSTRAINT "LessonRequirement_classId_fkey";

-- DropForeignKey
ALTER TABLE "LessonRequirement" DROP CONSTRAINT "LessonRequirement_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "PollAnswer" DROP CONSTRAINT "PollAnswer_pollOptionId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_examId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SessionParticipant" DROP CONSTRAINT "SessionParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropIndex
DROP INDEX "Attendance_studentId_lessonId_date_key";

-- DropIndex
DROP INDEX "ScheduleDraft_userId_key";

-- DropIndex
DROP INDEX "User_passwordResetToken_key";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LessonRequirement" DROP CONSTRAINT "LessonRequirement_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "LessonRequirement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PollAnswer" DROP COLUMN "createdAt",
DROP COLUMN "pollOptionId",
ADD COLUMN     "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "optionId" TEXT NOT NULL,
ADD COLUMN     "pollId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleDraft" DROP CONSTRAINT "ScheduleDraft_pkey",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ScheduleDraft_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ScheduleDraft_id_seq";

-- AlterTable
ALTER TABLE "SessionParticipant" DROP COLUMN "joinTime",
DROP COLUMN "leaveTime",
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "bloodType" SET NOT NULL,
ALTER COLUMN "parentId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "coefficient" SET NOT NULL,
ALTER COLUMN "coefficient" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "weeklyHours" SET NOT NULL;

-- AlterTable
ALTER TABLE "SubjectRequirement" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "SubjectRequirement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'STUDENT',
ALTER COLUMN "active" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "LessonRequirement_classId_subjectId_key" ON "LessonRequirement"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_examId_key" ON "Result"("studentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_assignmentId_key" ON "Result"("studentId", "assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDraft_userId_name_key" ON "ScheduleDraft"("userId", "name");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LessonRequirement" ADD CONSTRAINT "LessonRequirement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatroomSession" ADD CONSTRAINT "ChatroomSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatroomMessage" ADD CONSTRAINT "ChatroomMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PollAnswer" ADD CONSTRAINT "PollAnswer_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollAnswer" ADD CONSTRAINT "PollAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
