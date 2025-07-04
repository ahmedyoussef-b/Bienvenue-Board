
import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { getServerSession } from "@/lib/auth-utils";
import { Role, type LessonWithDetails } from "@/types/index"; // Use centralized types

export type FormContainerProps = {
  table:
    | "grade"
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance" 
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any; // Data for pre-filling update forms, type varies by table
  id?: number | string; // ID for delete operations
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined; // Cast to Role from types
  const currentUserId = session?.userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{surname: 'asc'}, {name: 'asc'}]
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
          orderBy: {level: 'asc'}
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{surname: 'asc'}, {name: 'asc'}]
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
          orderBy: {name: 'asc'}
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
           orderBy: {level: 'asc'}
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
           orderBy: {name: 'asc'}
        });
        const studentParents = await prisma.parent.findMany({
            select: {id: true, name: true, surname: true},
            orderBy: [{surname: 'asc'}, {name: 'asc'}]
        });
        relatedData = { classes: studentClasses, grades: studentGrades, parents: studentParents };
        break;
      case "exam":
      case "assignment": 
        const lessonsForAssessment = await prisma.lesson.findMany({
          where: {
            ...(userRole === Role.TEACHER && currentUserId ? { teacherId: currentUserId } : {}),
          },
          select: { id: true, name: true, subject: {select: {name: true}}, class: {select: {name: true}} },
          orderBy: [{subject: {name: 'asc'}}, {class: {name: 'asc'}}]
        });
        // Cast to ensure type safety, assuming LessonWithDetails includes these selections
        relatedData = { lessons: (lessonsForAssessment as LessonWithDetails[]).map((l) => ({id: l.id, name: `${l.subject.name} - ${l.class.name} (${l.name})` })) };
        break;
      case "lesson":
         const lessonSubjects = await prisma.subject.findMany({ select: { id: true, name: true }, orderBy: {name: 'asc'}});
         const lessonClasses = await prisma.class.findMany({ select: {id: true, name: true}, orderBy: {name: 'asc'}});
         const lessonTeachers = await prisma.teacher.findMany({ select: { id: true, name: true, surname: true }, orderBy: [{surname: 'asc'}, {name: 'asc'}]});
         const lessonClassrooms = await prisma.classroom.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
         relatedData = {subjects: lessonSubjects, classes: lessonClasses, teachers: lessonTeachers, classrooms: lessonClassrooms};
        break;
      case "result":
        const resultStudents = await prisma.student.findMany({ select: {id: true, name: true, surname: true}, orderBy: [{surname: 'asc'}, {name: 'asc'}]});
        const resultExams = await prisma.exam.findMany({ select: {id:true, title:true}, orderBy: {title: 'asc'}});
        const resultAssignments = await prisma.assignment.findMany({ select: {id:true, title:true}, orderBy: {title: 'asc'}});
        relatedData = {students: resultStudents, exams: resultExams, assignments: resultAssignments};
        break;
      case "event":
      case "announcement":
        const allSystemClasses = await prisma.class.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc'}
        });
        relatedData = { classes: allSystemClasses }; 
        break;
      case "attendance":
        const attendanceStudents = await prisma.student.findMany({ select: {id: true, name: true, surname: true}, orderBy: [{surname: 'asc'}, {name: 'asc'}]});
        const attendanceLessons = await prisma.lesson.findMany({
            where: {
              ...(userRole === Role.TEACHER && currentUserId ? { teacherId: currentUserId } : {}),
            },
            select: { id: true, name: true, subject: {select: {name: true}}, class: {select: {name: true}} },
            orderBy: [{subject: {name: 'asc'}}, {class: {name: 'asc'}}]
        });
        relatedData = {
            students: attendanceStudents,
            lessons: (attendanceLessons as LessonWithDetails[]).map((l) => ({id: l.id, name: `${l.subject.name} - ${l.class.name} (${l.name})` }))
        };
        break;
      default:
        break;
    }
  }

  return (
    <FormModal
      table={table}
      type={type}
      data={data}
      id={id}
      relatedData={relatedData}
    />
  );
};

export default FormContainer;
