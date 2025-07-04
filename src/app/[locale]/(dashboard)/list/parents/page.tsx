// src/app/[locale]/(dashboard)/list/parents/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { type Parent, type Student, type User, Role as AppRole } from "@/types/index";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { Prisma } from "@prisma/client";
import UserEntityCard, { type ParentCardData } from '@/components/UserEntityCard';
import { Filter, ArrowUpDown } from 'lucide-react';

export type ParentListItem = Parent & {
  students: Pick<Student, 'id' | 'name' | 'surname' | 'classId'>[];
  user: Pick<User, 'email' | 'username' | 'img'> | null; 
};

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const session = await getServerSession();
  const userRole = session?.role as AppRole | undefined;
  const currentUserId = session?.userId;

  let teacherClassIds: number[] = [];
  if (userRole === AppRole.TEACHER && currentUserId) {
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: currentUserId },
      select: { classId: true },
      distinct: ['classId']
    });
    teacherClassIds = lessons.map(l => l.classId);
  }

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;
  const query: Prisma.ParentWhereInput = {};

  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.OR = [
      { name: { contains: searchString, mode: "insensitive" } },
      { surname: { contains: searchString, mode: "insensitive" } },
      { user: { email: { contains: searchString, mode: "insensitive" } } },
      { user: { username: { contains: searchString, mode: "insensitive" } } },
      { students: { some: { OR: [
        {name: { contains: searchString, mode: "insensitive" }},
        {surname: { contains: searchString, mode: "insensitive" }}
      ]}}}
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: { select: { id: true, name: true, surname: true, classId: true }, orderBy: { surname: 'asc'} },
        user: { select: { email: true, username: true, img: true } }, 
      },
      orderBy: [{ surname: 'asc' }, {name: 'asc'}],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: query }),
  ]) as [ParentListItem[], number];

  const cardData = data.map(item => {
    const isAssociated = userRole === AppRole.ADMIN || (userRole === AppRole.TEACHER && item.students.some(student => student.classId && teacherClassIds.includes(student.classId)));
    return {
      id: item.id,
      userId: item.userId,
      name: item.name,
      surname: item.surname,
      phone: item.phone,
      address: item.address,
      img: item.user?.img || null, 
      students: item.students,
      isAssociated,
    };
  });

  return (
    <div className="bg-background p-4 md:p-6 rounded-lg flex-1 m-4 mt-0">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-0">
          Tous les Parents
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
            {userRole === AppRole.ADMIN && <FormContainer table="parent" type="create" />}
          </div>
        </div>
      </div>

      {cardData.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-12 text-center">
          <Image src="https://placehold.co/300x200.png" alt="Pas de données" width={300} height={200} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty state illustration" />
          <p className="text-lg text-muted-foreground">Aucun parent trouvé.</p>
          {userRole === AppRole.ADMIN && (
            <p className="text-sm text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouveau parent.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
          {cardData.map((item) => (
            <UserEntityCard
              key={item.id}
              entity={item as ParentCardData}
              entityType="parent"
              userRole={userRole}
              isAssociated={item.isAssociated}
            />
          ))}
        </div>
      )}

      {count > ITEM_PER_PAGE && <Pagination page={p} count={count} />}
    </div>
  );
};

export default ParentListPage;
