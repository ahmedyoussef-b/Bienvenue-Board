// src/components/UserEntityCard.tsx
'use client';

import Link from 'next/link';
import { Eye, Trash2, MessageSquare } from 'lucide-react';
import FormModal from '@/components/FormModal';
import { Badge } from '@/components/ui/badge';
import { Role as AppRole, User as UserType, Subject as SubjectType, Class as ClassType, Student as StudentTypePrisma, Parent as ParentTypePrisma, UserSex } from '@/types';
import DynamicAvatar from '@/components/DynamicAvatar';
import { useState } from 'react';
import MessageModal from '@/components/messaging/MessageModal';

// Type definitions (unchanged)
type BaseCardEntity = {
  id: string;
  name: string;
  surname: string;
  img?: string | null;
  user?: Partial<Pick<UserType, 'email' | 'username' | 'img'>> | null;
};
export type TeacherCardData = BaseCardEntity & ParentTypePrisma & {
  subjects: Pick<SubjectType, 'id' | 'name'>[];
};
export type StudentCardData = {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  userId: string;
  phone: string | null;
  address: string;
  bloodType: string;
  sex: UserSex;
  birthday: Date;
  parentId: string;
  class: Pick<ClassType, 'id' | 'name'>;
  user: Pick<UserType, 'username' | 'email' | 'img'> | null;
};
export type ParentCardData = BaseCardEntity & ParentTypePrisma & {
  students: Pick<StudentTypePrisma, 'id' | 'name' | 'surname'>[];
  user: Pick<UserType, 'email' | 'username' | 'img'> | null;
};
type CardEntity = TeacherCardData | StudentCardData | ParentCardData;
type EntityType = 'teacher' | 'student' | 'parent';

interface UserEntityCardProps {
  entity: CardEntity;
  entityType: EntityType;
  userRole?: AppRole;
  isAssociated?: boolean;
}

const UserEntityCard: React.FC<UserEntityCardProps> = ({ entity, entityType, userRole, isAssociated }) => {
  const locale = 'fr';
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const fullName = `${entity.name} ${entity.surname}`;
  const email = entity.user?.email || 'N/A';

  const viewLinkPath = `/list/${entityType}s/${entity.id}`;
  const viewLink = `/${locale}${viewLinkPath}`;

  const canMessage = userRole === AppRole.ADMIN || (userRole === AppRole.TEACHER && isAssociated);

  const entityTitle = {
    teacher: 'Enseignant(e)',
    student: 'Élève',
    parent: 'Parent'
  }[entityType];

  return (
    <>
      <div className="book">
        {/* Front Cover */}
        <div className="cover">
          <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-primary/20">
            <DynamicAvatar 
              imageUrl={entity.img || entity.user?.img}
              seed={entity.id || entity.user?.email || Math.random().toString(36).substring(7)} 
            />
          </div>
          <h3 className="text-xl font-bold text-primary mt-3 truncate w-full">{fullName}</h3>
          <p className="text-sm text-muted-foreground">{entityTitle}</p>
        </div>

        {/* Inside the book */}
        <div className="flex flex-col h-full w-full justify-between items-center text-center">
            {/* Details */}
            <div className="w-full">
                <h4 className="font-bold text-md truncate">{fullName}</h4>
                <p className="text-xs text-muted-foreground truncate mb-2">{email}</p>
                <hr className="border-t border-border my-2" />

                {entityType === 'teacher' && 'subjects' in entity && (
                    <div className="text-left mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Matières:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {(entity as TeacherCardData).subjects.slice(0, 3).map(subject => (
                            <Badge key={subject.id} variant="secondary" className="text-xs">{subject.name}</Badge>
                            ))}
                            {(entity as TeacherCardData).subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{ (entity as TeacherCardData).subjects.length - 3 }</Badge>
                            )}
                        </div>
                    </div>
                )}
                {entityType === 'student' && 'class' in entity && (
                    <div className="mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Classe:</p>
                        <Badge variant="default" className="text-sm">{(entity as StudentCardData).class.name}</Badge>
                    </div>
                )}
                {entityType === 'parent' && 'students' in entity && (
                    <div className="text-left mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Enfants:</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {(entity as ParentCardData).students.slice(0, 2).map(student => (
                            <Badge key={student.id} variant="secondary" className="text-xs">{student.name} {student.surname}</Badge>
                            ))}
                            {(entity as ParentCardData).students.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{ (entity as ParentCardData).students.length - 2 }</Badge>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="w-full mt-auto pt-2 border-t border-border/50 flex justify-center space-x-2">
                <Link href={viewLink} passHref>
                    <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-accent-foreground" title="Voir les détails">
                    <Eye size={18} />
                    </button>
                </Link>
                {entityType === 'parent' && canMessage && entity.userId && (
                    <button onClick={() => setIsMessageModalOpen(true)} className="p-2 hover:bg-accent rounded-full transition-colors text-blue-500 hover:text-accent-foreground" title="Envoyer un message">
                        <MessageSquare size={18} />
                    </button>
                )}
                {userRole === AppRole.ADMIN && (
                    <FormModal table={entityType} type="delete" id={entity.id} />
                )}
            </div>
        </div>
      </div>
      {entityType === 'parent' && entity.userId && (
        <MessageModal 
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          recipientName={fullName}
          recipientId={entity.userId}
        />
      )}
    </>
  );
};
export default UserEntityCard;