// src/components/teacher/TeacherProfileCard.tsx
import FormContainer from "@/components/FormContainer";
import DynamicAvatar from "@/components/DynamicAvatar";
import { Role } from "@prisma/client";
import type { TeacherWithDetails } from "@/types/index";
import Image from "next/image";

interface TeacherProfileCardProps {
  teacher: TeacherWithDetails;
  userRole?: Role;
}

export default function TeacherProfileCard({ teacher, userRole }: TeacherProfileCardProps) {
  return (
    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
      <div className="w-1/3 flex items-center justify-center">
        <div className="w-36 h-36 flex items-center justify-center overflow-hidden rounded-full bg-muted">
          <DynamicAvatar
            imageUrl={teacher.user?.img || teacher.img}
            seed={teacher.id || teacher.user?.email || Math.random().toString(36).substring(7)}
          />
        </div>
      </div>
      <div className="w-2/3 flex flex-col justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">
            {teacher.name} {teacher.surname}
          </h1>
          {userRole === Role.ADMIN && (
            <FormContainer
              table="teacher"
              type="update"
              data={{
                ...teacher,
                username: teacher.user?.username,
                email: teacher.user?.email,
                birthday: teacher.birthday ? new Date(teacher.birthday) : undefined,
                subjects: teacher.subjects,
              }}
            />
          )}
        </div>
        <p className="text-sm text-gray-500">
          Éducateur dévoué chez SchooLama.
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/blood.png" alt="groupe sanguin" width={14} height={14} />
            <span>{teacher.bloodType}</span>
          </div>
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/date.png" alt="anniversaire" width={14} height={14} />
            <span>
              {new Intl.DateTimeFormat("fr-FR").format(new Date(teacher.birthday))}
            </span>
          </div>
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/mail.png" alt="email" width={14} height={14} />
            <span>{teacher.user?.email || "-"}</span>
          </div>
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/phone.png" alt="téléphone" width={14} height={14} />
            <span>{teacher.phone || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
