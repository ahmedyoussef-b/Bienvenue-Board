// src/app/[locale]/(dashboard)/list/teachers/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { type Teacher, type Subject, type User, type Class, Role as AppRole } from "@/types/index";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getServerSession } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";
import UserEntityCard, { type TeacherCardData } from '@/components/UserEntityCard';
import { Filter, ArrowUpDown } from 'lucide-react';

// Specific type for teacher list items, now aligns with TeacherCardData needs
export type TeacherListItem = Teacher & { 
  subjects: Pick<Subject, 'id' | 'name'>[]; 
  user: Pick<User, 'username' | 'email' | 'img'> | null; 
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const session = await getServerSession();
  const userRole = session?.role as AppRole | undefined;

  const pageParam = searchParams.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  
  const query: Prisma.TeacherWhereInput = {};

  const classIdParam = searchParams.classId;
  if (classIdParam) {
    query.lessons = {
      some: { classId: parseInt(Array.isArray(classIdParam) ? classIdParam[0] : classIdParam) },
    };
  }

  const searchParam = searchParams.search;
  if (searchParam && typeof searchParam === 'string' && searchParam.trim() !== '') {
    query.OR = [
        { name: { contains: searchParam, mode: "insensitive" } },
        { surname: { contains: searchParam, mode: "insensitive" } },
        { user: { email: { contains: searchParam, mode: "insensitive" }}},
        { user: { username: { contains: searchParam, mode: "insensitive" }}},
        { subjects: { some: { name: { contains: searchParam, mode: "insensitive" }}}},
        { classes: { some: { name: { contains: searchParam, mode: "insensitive" }}}}
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: { select: { id: true, name: true }, orderBy: { name: 'asc'} }, 
        user: { select: { username: true, email: true, img: true } }, 
      },
      orderBy: [{ surname: 'asc' }, {name: 'asc'}],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
  ]);

  const cardData: TeacherCardData[] = data.map(item => ({
    id: item.id,
    name: item.name,
    surname: item.surname,
    img: item.img,
    user: item.user,
    subjects: item.subjects,
  }));

  return (
    <div className="bg-background p-4 md:p-6 rounded-lg flex-1 m-4 mt-0">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-0">
          Tous les Enseignants
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
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>

      {cardData.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image src="https://placehold.co/300x200.png" alt="Pas de données" width={300} height={200} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty state illustration" />
          <p className="text-lg text-muted-foreground">Aucun enseignant trouvé.</p>
          {userRole === AppRole.ADMIN && (
            <p className="text-sm text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouvel enseignant.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {cardData.map((item) => (
            <UserEntityCard
              key={item.id}
              entity={item}
              entityType="teacher"
              userRole={userRole}
            />
          ))}
        </div>
      )}
      
      {count > ITEM_PER_PAGE && <Pagination page={p} count={count} />}
    </div>
  );
};

export default TeacherListPage;
