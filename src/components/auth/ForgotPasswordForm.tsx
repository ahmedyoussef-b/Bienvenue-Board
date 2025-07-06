// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/lib/formValidationSchemas';
import { Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const { toast } = useToast();

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsLoading(true);
    setResetLink('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Une erreur est survenue.");
      }
      
      setIsSuccess(true);
      // NOTE : En production, on ne reçoit pas le lien. On affiche juste un message générique.
      // Ici, on le stocke pour l'afficher à l'utilisateur pour le prototypage.
      if (result.token) {
        const url = new URL(window.location.href);
        setResetLink(`${url.origin}/fr/reset-password?token=${result.token}`);
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la demande",
        description: error.message || "Impossible de traiter votre demande.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="text-xl font-semibold">Vérifiez vos emails</h3>
        <p className="text-muted-foreground text-sm">Si un compte existe pour cet email, nous avons envoyé un lien de réinitialisation.</p>
        {resetLink && (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-800 rounded-md text-left text-xs">
                <p className="font-bold text-yellow-800 dark:text-yellow-200">NOTE DE PROTOTYPAGE :</p>
                <p className="text-yellow-700 dark:text-yellow-300">Dans un vrai projet, ce lien serait envoyé par email. Cliquez dessus pour continuer :</p>
                <Link href={resetLink} className="block mt-2 font-mono break-all text-blue-600 hover:underline">
                    {resetLink}
                </Link>
            </div>
        )}
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full">
            Demander un autre lien
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="email" className="pl-4">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          {...register("email")}
          disabled={isLoading}
          aria-invalid={errors.email ? "true" : "false"}
          className={cn(
            "bg-background border-0 rounded-full shadow-neumorphic-inset transition-shadow focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-ring",
            errors.email && "focus-visible:ring-destructive"
          )}
        />
        {errors.email && <p className="pl-4 text-sm text-destructive">{errors.email.message}</p>}
      </div>
      
      <Button 
        type="submit" 
        className="w-full rounded-full bg-background text-foreground hover:bg-background hover:text-primary shadow-neumorphic active:shadow-neumorphic-inset transition-all" 
        disabled={isLoading}
      >
        {isLoading ? <Spinner size="sm" className="mr-2" /> : <Mail className="mr-2"/>}
        {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Je me souviens de mon mot de passe.{" "}
        <Link href={`/fr/login`} className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}