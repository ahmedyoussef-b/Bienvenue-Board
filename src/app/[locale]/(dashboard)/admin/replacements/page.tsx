// src/app/[locale]/(dashboard)/admin/replacements/page.tsx
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import ReplacementFinder from '@/components/admin/ReplacementFinder';

export default async function ReplacementPage() {
    const teachers = await prisma.teacher.findMany({
        select: {
            id: true,
            name: true,
            surname: true,
        },
        orderBy: {
            surname: 'asc'
        }
    });

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Assistant de Remplacement</h1>
                    <p className="text-muted-foreground mt-1">
                        Trouvez des remplaçants pour les professeurs absents à l'aide de l'IA.
                    </p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Lancer une recherche</CardTitle>
                    <CardDescription>
                        Sélectionnez un professeur et une date pour trouver des solutions de remplacement.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReplacementFinder teachers={teachers} />
                </CardContent>
            </Card>
        </div>
    );
}
