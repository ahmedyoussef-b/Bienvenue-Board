
"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function AppHeaderLogoutButton() {
  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté avec succès." });
      router.push('/fr');
    } catch (err) {
      toast({ variant: "destructive", title: "Échec de la déconnexion", description: "Une erreur est survenue lors de la déconnexion." });
      // Fallback redirect
      router.push('/fr');
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutLoading} className="h-9 w-9 p-0 rounded-full md:h-auto md:w-auto md:px-3 md:py-2">
      {logoutLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="hidden md:inline md:ml-2">Déconnexion</span>
    </Button>
  );
}
