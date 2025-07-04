// src/components/classes/GradeCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FormContainer from '@/components/FormContainer';
import { Role as AppRole, type Grade } from "@/types/index";
import { Layers3, ArrowRight } from 'lucide-react';

type GradeWithClassCount = Grade & {
  _count: { classes: number };
};

interface GradeCardProps {
    grade: GradeWithClassCount;
    locale: string;
    userRole?: AppRole;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade, locale, userRole }) => {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 bg-card hover:-translate-y-1 group flex flex-col justify-between">
            <Link href={`/${locale}/list/classes?viewGradeId=${grade.id}`} passHref className="flex flex-col flex-grow p-4">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-primary font-bold">
                            {`Niveau ${grade.level}`}
                        </CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg">
                             <Layers3 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center py-6">
                    <div className="text-center">
                        <p className="text-5xl font-extrabold text-foreground">{grade._count.classes}</p>
                        <p className="text-muted-foreground mt-1">
                            {`Classe${grade._count.classes > 1 ? 's' : ''} configurée${grade._count.classes > 1 ? 's' : ''}`}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="p-0">
                    <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Voir les Classes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Link>
            {userRole === AppRole.ADMIN && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FormContainer table="grade" type="delete" id={grade.id} />
                </div>
            )}
        </Card>
    );
};

export default GradeCard;
