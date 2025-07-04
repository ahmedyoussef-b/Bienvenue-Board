// src/app/[locale]/(dashboard)/list/results/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { getServerSession } from "@/lib/auth-utils";
import { Prisma, Role } from "@prisma/client";

type ResultWithDetails = Prisma.ResultGetPayload<{
  include: {
    student: { select: { id: true; name: true; surname: true } };
    exam: {
      select: {
        id: true;
        title: true;
        startTime: true;
        lesson: {
          select: {
            subject: { select: { name: true } };
            class: { select: { name: true } };
            teacher: { select: { name: true; surname: true } };
          };
        };
      };
    };
    assignment: {
      select: {
        id: true;
        title: true;
        dueDate: true;
        lesson: {
          select: {
            subject: { select: { name: true } };
            class: { select: { name: true } };
            teacher: { select: { name: true; surname: true } };
          };
        };
      };
    };
  };
}>;

type ResultListDisplayItem = {
  id: number;
  title: string; 
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  assessmentDate: Date;
  type: 'Examen' | 'Devoir';
  examId: number | null; 
  assignmentId: number | null; 
  studentId: string; 
};


const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined; 
  const currentUserId = session?.userId;

  const columns = [
    { header: "Titre", accessor: "title" },
    { header: "Étudiant", accessor: "student" },
    { header: "Score", accessor: "score", className: "hidden md:table-cell" },
    { header: "Enseignant", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Classe", accessor: "class", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    { header: "Type", accessor: "type", className: "hidden md:table-cell" },
    ...((userRole === Role.ADMIN || userRole === Role.TEACHER)
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  const renderRow = (item: ResultListDisplayItem) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.studentName} {item.studentSurname}</td>
      <td className="hidden md:table-cell">{item.score}</td>
      <td className="hidden md:table-cell">{item.teacherName} {item.teacherSurname}</td>
      <td className="hidden md:table-cell">{item.className}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("fr-FR").format(new Date(item.assessmentDate))}
      </td>
      <td className="hidden md:table-cell">{item.type}</td>
      {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={{
              id: item.id,
              score: item.score,
              studentId: item.studentId,
              examId: item.examId,
              assignmentId: item.assignmentId,
            }} />
            <FormContainer table="result" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const take = ITEM_PER_PAGE;
  const skip = (p - 1) * take;

  const query: Prisma.ResultWhereInput = {};

  const studentIdParam = searchParams?.studentId;
  if (studentIdParam) {
    query.studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
  }

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
      { exam: { title: { contains: searchString, mode: "insensitive" } } },
      { assignment: { title: { contains: searchString, mode: "insensitive" } } },
      { student: { name: { contains: searchString, mode: "insensitive" } } },
      { student: { surname: { contains: searchString, mode: "insensitive" } } },
    ];
  }

  if (userRole && currentUserId) {
    switch (userRole) {
      case Role.TEACHER:
        query.OR = [
          { exam: { lesson: { teacherId: currentUserId } } },
          { assignment: { lesson: { teacherId: currentUserId } } },
        ];
        break;
      case Role.STUDENT:
        query.studentId = currentUserId;
        break;
      case Role.PARENT:
        query.student = { parentId: currentUserId };
        break;
      default:
        break;
    }
  }

  const [resultsForSorting, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      select: {
        id: true,
        exam: { select: { startTime: true } },
        assignment: { select: { dueDate: true } },
      },
    }),
    prisma.result.count({ where: query }),
  ]);

  const sortedResults = resultsForSorting.sort((a, b) => {
    const dateA = a.exam ? new Date(a.exam.startTime) : new Date(a.assignment!.dueDate);
    const dateB = b.exam ? new Date(b.exam.startTime) : new Date(b.assignment!.dueDate);
    return dateB.getTime() - dateA.getTime();
  });

  const paginatedResultIds = sortedResults.slice(skip, skip + take).map(r => r.id);

  const dataRes = paginatedResultIds.length > 0 ? await prisma.result.findMany({
    where: {
      id: { in: paginatedResultIds }
    },
    include: {
      student: { select: { id: true, name: true, surname: true } },
      exam: {
        select: {
          id: true,
          title: true,
          startTime: true,
          lesson: { 
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          lesson: { 
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        }
      }
    },
  }) : [];
  
  const finalSortedData = paginatedResultIds.map(id => dataRes.find(d => d.id === id)).filter((d): d is ResultWithDetails => !!d);

  const data: ResultListDisplayItem[] = finalSortedData.map((item) => {
    const isExam = !!item.exam;
    const assessment = isExam ? item.exam : item.assignment;

    if (!assessment || !assessment.lesson) { 
      console.warn(`Result ID ${item.id} is missing assessment or lesson details.`);
      return null;
    }
    
    let assessmentDate: Date | undefined;
    let assessmentTitle: string | undefined;

    if (isExam && item.exam) { 
        assessmentDate = new Date(item.exam.startTime);
        assessmentTitle = item.exam.title;
    } else if (!isExam && item.assignment) { 
        assessmentDate = new Date(item.assignment.dueDate);
        assessmentTitle = item.assignment.title;
    }

    if (!assessmentDate || assessmentTitle === undefined) {
        console.warn(`Result ID ${item.id} is missing assessment date or title.`);
        return null;
    }

    return {
      id: item.id,
      score: item.score,
      className: assessment.lesson.class.name,
      assessmentDate: new Date(assessmentDate),
      type: isExam ? 'Examen' : 'Devoir' as 'Examen' | 'Devoir', 
      examId: item.exam?.id ?? null, 
      assignmentId: item.assignment?.id ?? null, 
      studentId: item.student.id, 
      title: assessmentTitle,
      studentName: item.student.name,
      studentSurname: item.student.surname,
      teacherName: assessment.lesson.teacher.name,
      teacherSurname: assessment.lesson.teacher.surname,
    };
  }).filter((item): item is ResultListDisplayItem => item !== null);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Tous les Résultats</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="sort" width={14} height={14} />
            </button>
            {(userRole === Role.ADMIN || userRole === Role.TEACHER) && (
              <FormContainer table="result" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table<ResultListDisplayItem> columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;
