// src/components/auth/Verify2FAForm.tsx
"use client";

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVerify2FAMutation } from '@/lib/redux/api/authApi'; // Use the correct hook
import { useRouter } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { KeyRound } from 'lucide-react';

const verify2FASchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres."),
  token: z.string(),
});
type Verify2FAFormData = z.infer<typeof verify2FASchema>;

interface Verify2FAFormProps {
  token: string;
}

export default function Verify2FAForm({ token }: Verify2FAFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Verify2FAFormData>({
    resolver: zodResolver(verify2FASchema),
    defaultValues: { token },
  });

  const [verify2FA, { isLoading, isSuccess, isError, error: verifyErrorData }] = useVerify2FAMutation();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    console.log("➡️ [Verify2FAForm] useEffect triggered. isSuccess:", isSuccess, "isError:", isError);
    if (isSuccess) {
      console.log("✅ [Verify2FAForm] 2FA verification successful.");
      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté.',
      });
    }
    if (isError && verifyErrorData) {
      console.log("❌ [Verify2FAForm] 2FA verification failed. Error:", verifyErrorData);
      const errorMessage = (verifyErrorData as any)?.data?.message || 'Code de vérification invalide ou expiré.';
      toast({
        variant: "destructive",
        title: "Échec de la vérification",
        description: errorMessage,
      });
    }
  }, [isSuccess, isError, verifyErrorData, toast, router]);

  const onSubmit: SubmitHandler<Verify2FAFormData> = async (data) => {
    console.log("➡️ [Verify2FAForm] Submitting 2FA form with data:", data);
    await verify2FA(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <input type="hidden" {...register("token")} />
      
      <div className="space-y-2">
        <Label htmlFor="code">Code de vérification à 6 chiffres</Label>
        <Input
          id="code"
          type="text"
          maxLength={6}
          placeholder="123456"
          {...register("code")}
          className="text-center tracking-[0.5em]"
          disabled={isLoading}
        />
        {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : <KeyRound className="mr-2" />}
        {isLoading ? "Vérification..." : "Vérifier et se connecter"}
      </Button>
    </form>
  );
}