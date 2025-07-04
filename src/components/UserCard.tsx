import prisma from "@/lib/prisma";
import type { Role } from "@/types/index"; 
import Image from "next/image";

const UserCard = async ({
  type,
  bgColorClass, // Nouvelle prop pour la couleur de fond
}: {
  type: Role;
  bgColorClass: string; // Tailwind CSS class for background
}) => {
  let count = 0;
  switch (type) {
    case "ADMIN":
      count = await prisma.admin.count();
      break;
    case "TEACHER":
      count = await prisma.teacher.count();
      break;
    case "STUDENT":
      count = await prisma.student.count();
      break;
    case "PARENT":
      count = await prisma.parent.count();
      break;
    case "VISITOR":
      count = await prisma.user.count({ where: { role: "VISITOR" } });
      break;
    default:
      console.warn(`UserCard received an unexpected role type: ${type}`);
      count = 0;
  }

  const roleTranslations: { [key in Role]?: string } = {
    ADMIN: "Administrateurs",
    TEACHER: "Enseignants",
    STUDENT: "Étudiants",
    PARENT: "Parents",
    VISITOR: "Visiteurs",
  };

  const typeDisplay = roleTranslations[type] || (type.charAt(0) + type.slice(1).toLowerCase() + 's');

  return (
    <div className={`rounded-2xl ${bgColorClass} p-4 flex-1 min-w-[130px] shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white/70 px-2 py-1 rounded-full text-gray-700 font-semibold">
          2024/25 {/* This could be dynamic */}
        </span>
        <Image src="/more.png" alt="more options" width={20} height={20} />
      </div>
      <h1 className="text-3xl font-semibold my-4 text-white text-center">{count}</h1>
      <h2 className="text-sm font-medium text-gray-100">{typeDisplay}</h2>
    </div>
  );
};

export default UserCard;
