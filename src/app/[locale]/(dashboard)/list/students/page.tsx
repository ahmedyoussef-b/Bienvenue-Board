// src/app/[locale]/(dashboard)/list/students/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { type Class, type Student, type User, Role as AppRole } from "@/types/index";
import { type JwtPayload } from '@/types/index';
import Image from "next/image";

import { getServerSession } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";
import UserEntityCard, { type StudentCardData } from '@/components/UserEntityCard';
import { Filter, ArrowUpDown } from 'lucide-react';

// Use Prisma.GetPayload to accurately type the fetched data
type StudentWithClassAndUser = Prisma.StudentGetPayload<{
  include: {
    class: { select: { id: true, name: true } };
    user: { select: { username: true, email: true, img: true } };
  };
}>;

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  // Define a type for the actual return value of getServerSession
  type SessionReturn = { 
    userId: string; 
    role: AppRole; 
    email: string; 
    name: string | undefined; 
    isAuthenticated: boolean; 
  } | null;
  const session: SessionReturn = await getServerSession();
  const userRole = session?.role as AppRole | undefined;
  const currentUserId = session?.userId;

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  let query: Prisma.StudentWhereInput = {};

  const teacherIdParam = searchParams?.teacherId;
  if (teacherIdParam) {
    const teacherId = Array.isArray(teacherIdParam) ? teacherIdParam[0] : teacherIdParam;
    if (userRole === AppRole.TEACHER || userRole === AppRole.ADMIN) { 
 query.class = { lessons: { some: { teacherId: teacherId } } };
    }
  }

  const classIdParam = searchParams?.classId;
  if (classIdParam) {
    query.classId = parseInt(Array.isArray(classIdParam) ? classIdParam[0] : classIdParam);
  }
  
  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
        { name: { contains: searchString, mode: "insensitive" } },
        { surname: { contains: searchString, mode: "insensitive" } },
        { user: { email: { contains: searchString, mode: "insensitive" }}},
        { user: { username: { contains: searchString, mode: "insensitive" }}},
        { class: { name: { contains: searchString, mode: "insensitive" }}}
    ];
  }
  
  if (userRole === AppRole.TEACHER && currentUserId && !teacherIdParam) { // Ensure this doesn't override specific teacherId filter
    const existingClassQuery: Prisma.ClassWhereInput | undefined = query.class;
    const teacherSpecificClassCondition: Prisma.ClassWhereInput = {
      OR: [
        { supervisorId: currentUserId }, 
        { lessons: { some: { teacherId: currentUserId } } } 
      ]
    };
    
    if (existingClassQuery) {
      query.class = {
        ...existingClassQuery,
        AND: [ 
          ...(Array.isArray(existingClassQuery.AND) ? existingClassQuery.AND : (existingClassQuery.AND ? [existingClassQuery.AND] : [])),
          teacherSpecificClassCondition
        ]
      };
    } else {
      query.class = teacherSpecificClassCondition;
    }
  }


  const [data, count]: [StudentWithClassAndUser[], number] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        class: { select: { id:true, name: true } },
        user: { select: { username: true, email: true, img: true } }, 
      },
      orderBy: [{ class: {name : 'asc'} }, { surname: 'asc' }, { name: 'asc' }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
  ]);
  
  const cardData: StudentCardData[] = data.map((item: StudentWithClassAndUser) => ({
    // Ensure correct types for nested objects
    user: item.user ? { username: item.user.username, email: item.user.email, img: item.user.img } : null,
    class: item.class ? { id: item.class.id, name: item.class.name } : { id: 0, name: 'N/A' }, // Provide a default or handle null if class can be null
    sex: item.sex,
    birthday: item.birthday,
    // Manually construct the object to match StudentCardData
    id: item.id,
    name: item.name,
    surname: item.surname,
    userId: item.userId,
    phone: item.phone,
    address: item.address,
    bloodType: item.bloodType,
    img: item.img || item.user?.img || null, // Keep the image logic
  }));

  return (
    <div className="bg-background p-4 md:p-6 rounded-lg flex-1 m-4 mt-0">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-0">
          Tous les Étudiants
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button className="p-2.5 hover:bg-muted rounded-md transition-colors" title="Filtrer">
              <Filter size={18} className="text-muted-foreground" />
            </button>
            <button className="p-2.5 hover:bg-muted rounded-md transition-colors" title="Trier">
              <ArrowUpDown size={18} className="text-muted-foreground" />
            </button>
            {userRole === AppRole.ADMIN && (
              <FormContainer table="student" type="create" />
            )}
          </div>
        </div>
      </div>

      {cardData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image src="https://placehold.co/300x200.png" alt="Pas de données" width={300} height={200} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty state illustration" />
          <p className="text-lg text-muted-foreground">Aucun étudiant trouvé.</p>
          {userRole === AppRole.ADMIN && (
            <p className="text-sm text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouvel étudiant.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {cardData.map((item) => (
            <UserEntityCard
              key={item.id}
              entity={item}
              entityType="student"
              userRole={userRole}
            />
          ))}
        </div>
      )}
      
      {count > ITEM_PER_PAGE && <Pagination page={p} count={count} />}
    </div>
  );
};

export default StudentListPage;
