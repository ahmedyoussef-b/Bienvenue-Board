// src/components/dashboard/admin/AdminHeader.tsx
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Settings } from "lucide-react";

const AdminHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Panneau d'Administration
        </h1>
        <p className="text-lg text-muted-foreground mt-1">
          Gérez les paramètres avancés et les outils de planification.
        </p>
      </div>
      <div className="text-right text-sm text-muted-foreground">
        {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: fr })}
      </div>
    </div>
  );
};

export default AdminHeader;
