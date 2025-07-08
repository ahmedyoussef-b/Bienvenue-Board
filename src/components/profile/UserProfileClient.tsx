'use client';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, type ProfileUpdateSchema } from '@/lib/formValidationSchemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { Loader2, Save, User, KeyRound, Phone, Home, Upload } from 'lucide-react';
import Image from "next/image";
import DynamicAvatar from '@/components/DynamicAvatar';
import { useUpdateProfileMutation } from '@/lib/redux/api/authApi';
import type { Teacher, Student, Parent, Admin, Role } from "@/types";
import { useAppDispatch } from '@/hooks/redux-hooks';
import { updateCurrentUser } from '@/lib/redux/slices/authSlice';

type UserProfile = (Teacher | Student | Parent | Admin) & {
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    img: string | null;
  }
};

interface UserProfileClientProps {
  userProfile: UserProfile;
}

const roleTranslations: { [key in Role]: string } = {
  ADMIN: "Administrateur",
  TEACHER: "Enseignant",
  STUDENT: "Étudiant",
  PARENT: "Parent",
  VISITOR: "Visiteur",
};

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string };
}

const UserProfileClient: React.FC<UserProfileClientProps> = ({ userProfile }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileUpdateSchema>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: userProfile.name,
      surname: userProfile.surname,
      username: userProfile.user.username,
      email: userProfile.user.email,
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      img: userProfile.img || userProfile.user.img || null,
      password: '',
    },
  });

  const imgUrl = watch('img');

  const onSubmit: SubmitHandler<ProfileUpdateSchema> = async (data) => {
    const payload: Partial<ProfileUpdateSchema> = { ...data };
    if (payload.password && payload.password.trim() === '') {
      delete payload.password;
    }

    try {
      const result = await updateProfile(payload).unwrap();

      dispatch(updateCurrentUser(result.user));

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Échec de la mise à jour',
        description: error.data?.message || error.message || "Une erreur est survenue.",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
       <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-full">
            <User className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mon Profil</h1>
            <p className="text-muted-foreground">Gérez vos informations personnelles et de connexion.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Détails visibles sur votre profil public.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20">
                    <DynamicAvatar 
                        imageUrl={imgUrl}
                        seed={userProfile.user.id}
                        isLCP={true}
                    />
                </div>
                <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                    onSuccess={(result: CloudinaryUploadWidgetResults) => {
                        if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
                            const info = result.info as CloudinaryUploadWidgetInfo;
                            setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true });
                        }
                    }}
                    onError={(error) => {
                        console.error("Cloudinary Upload Error:", error);
                        toast({
                            variant: "destructive",
                            title: "Échec du téléversement",
                            description: "Veuillez vérifier que votre 'upload preset' est configuré pour les téléversements non signés.",
                            duration: 10000,
                        });
                    }}
                >
                    {({ open }) => (
                        <Button type="button" variant="outline" onClick={() => open()} disabled={isLoading} className="text-xs w-full">
                            <Upload className="mr-2" size={14} /> Changer la photo
                        </Button>
                    )}
                </CldUploadWidget>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userProfile.user.role !== 'STUDENT' && (
                <>
                  <div>
                    <Label htmlFor="name">Prénom</Label>
                    <Input id="name" {...register("name")} disabled={isLoading} />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="surname">Nom</Label>
                    <Input id="surname" {...register("surname")} disabled={isLoading} />
                    {errors.surname && <p className="text-sm text-destructive mt-1">{errors.surname.message}</p>}
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Label htmlFor="phone" className="flex items-center"><Phone size={14} className="mr-2"/>Téléphone</Label>
                <Input id="phone" {...register("phone")} disabled={isLoading} />
                 {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address" className="flex items-center"><Home size={14} className="mr-2"/>Adresse</Label>
                <Input id="address" {...register("address")} disabled={isLoading} />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations de Connexion</CardTitle>
            <CardDescription>Gérez votre email, nom d'utilisateur et mot de passe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input id="username" {...register("username")} disabled={isLoading} />
                  {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} disabled={isLoading} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
             </div>
             <div>
                <Label htmlFor="password" className="flex items-center"><KeyRound size={14} className="mr-2"/>Nouveau mot de passe</Label>
                <Input id="password" type="password" {...register("password")} placeholder="Laisser vide pour ne pas changer" disabled={isLoading} />
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
              </div>
              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                Votre rôle actuel est : <span className="font-semibold text-foreground">{roleTranslations[userProfile.user.role]}</span>. Ce rôle ne peut pas être modifié.
              </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileClient;
