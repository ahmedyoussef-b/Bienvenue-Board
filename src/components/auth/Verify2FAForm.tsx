// src/components/auth/Verify2FAForm.tsx
"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLoginMutation } from '@/lib/redux/api/authApi'; 
import { useRouter } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { KeyRound } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';


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
  
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const router = useRouter();

  // We re-use the login mutation definition from RTK Query, but we will call our new endpoint manually
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const onSubmit: SubmitHandler<Verify2FAFormData> = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Le code de vérification est incorrect ou a expiré.");
      }

      // If successful, the backend returns a new session token and user data.
      // We manually dispatch a "fulfilled" action to the login mutation to update the auth state.
      login.endpoint.initiate(undefined as any, {
        track: false,
      }).unsubscribe(); // Prevent RTK Query from managing this call
      
      // Manually trigger the state update as if the login mutation succeeded
      const { login: { matchFulfilled } } = await import('@/lib/redux/api/authApi'); 
      dispatch({ 
        type: matchFulfilled.type,
        payload: result,
      });

      // Let the page useEffect handle the redirect
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la vérification",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
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
```