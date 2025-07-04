// src/components/auth/RegisterForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegisterMutation } from "@/lib/redux/api/authApi";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Role } from "@/types/index"; 
import { useEffect } from "react";
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Spinner } from "@/components/ui/spinner";
// useI18n, useCurrentLocale ne sont plus nécessaires

const registerSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }).optional(), // Message en français
  email: z.string().email({ message: "Adresse e-mail invalide." }), // Message en français
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }), // Message en français
  role: z.nativeEnum(Role, { errorMap: () => ({ message: "Veuillez sélectionner un rôle."}) }), // Message en français
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface ApiErrorData {
  message: string;
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

export function RegisterForm() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const [registerUser, { isLoading, isSuccess, isError, error: registerErrorData }] = useRegisterMutation();
  const { toast } = useToast();
  const router = useRouter(); 
  // t et locale ne sont plus nécessaires

  const selectedRole = watch("role");

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Inscription réussie", // Texte en français
        description: "Votre compte a été créé. Redirection...", // Texte en français
      });
    }
    if (isError && registerErrorData) {
      let errorMessage = "Une erreur inattendue s'est produite lors de l'inscription."; // Texte en français
      if (isFetchBaseQueryError(registerErrorData)) {
        const errorData = registerErrorData.data as ApiErrorData; 
        errorMessage = errorData?.message || `Erreur: ${registerErrorData.status}`;
      } else if (isSerializedError(registerErrorData)) {
        errorMessage = registerErrorData.message || "Un problème est survenu lors de l'inscription."; // Texte en français
      }
      toast({
        variant: "destructive",
        title: "Échec de l'inscription", // Texte en français
        description: errorMessage,
      });
    }
  }, [isSuccess, isError, registerErrorData, toast, router]);

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet (Optionnel)</Label> {/* Texte français direct */}
        <Input
          id="name"
          placeholder="John Doe"
          {...register("name")}
          aria-invalid={errors.name ? "true" : "false"}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label> {/* Texte français direct */}
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label> {/* Texte français direct */}
        <Input
          id="password"
          type="password"
          placeholder="•••••••• (min. 8 caractères)"
          {...register("password")}
          aria-invalid={errors.password ? "true" : "false"}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label> {/* Texte français direct */}
        <Select
          onValueChange={(value) => setValue("role", value as Role, { shouldValidate: true })}
          value={selectedRole}
          disabled={isLoading}
        >
          <SelectTrigger 
            id="role" 
            aria-invalid={errors.role ? "true" : "false"}
            className={errors.role ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Sélectionnez votre rôle" /> {/* Texte français direct */}
          </SelectTrigger>
          <SelectContent>
            {/* L'option "Étudiant" a été retirée pour la cohérence de l'application */}
            <SelectItem value={Role.TEACHER}>Enseignant</SelectItem> {/* Texte français direct */}
            <SelectItem value={Role.PARENT}>Parent</SelectItem> {/* Texte français direct */}
          </SelectContent>
        </Select>
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        {isLoading ? "Création du compte..." : "Créer un compte"} {/* Texte français direct */}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "} {/* Texte français direct */}
        <Link href={`/fr/login`} className="font-medium text-primary hover:underline">
          Se connecter {/* Texte français direct */}
        </Link>
      </p>
    </form>
  );
}
