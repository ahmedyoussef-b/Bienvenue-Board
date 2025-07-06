// src/components/auth/ResetPasswordForm.tsx
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordSchema } from '@/lib/formValidationSchemas';
import { CheckCircle, KeyRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: ResetPasswordSchema) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue.");
      }
      
      toast({
        title: "Succès !",
        description: "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.",
      });
      setIsSuccess(true);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la réinitialisation",
        description: error.message || "Impossible de réinitialiser votre mot de passe.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="text-xl font-semibold">Mot de passe réinitialisé !</h3>
        <p className="text-muted-foreground text-sm">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <Button asChild className="w-full">
            <Link href="/fr/login">
                Aller à la page de connexion <ArrowRight className="ml-2"/>
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <input type="hidden" {...register("token")} />
      
      <div className="space-y-2">
        <Label htmlFor="password" className="pl-4">Nouveau mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isLoading}
          className={cn(errors.password && "focus-visible:ring-destructive")}
        />
        {errors.password && <p className="pl-4 text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="pl-4">Confirmer le nouveau mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register("confirmPassword")}
          disabled={isLoading}
          className={cn(errors.confirmPassword && "focus-visible:ring-destructive")}
        />
        {errors.confirmPassword && <p className="pl-4 text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      
      <Button 
        type="submit" 
        className="w-full rounded-full"
        disabled={isLoading}
      >
        {isLoading ? <Spinner size="sm" className="mr-2" /> : <KeyRound className="mr-2"/>}
        {isLoading ? "Modification..." : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}