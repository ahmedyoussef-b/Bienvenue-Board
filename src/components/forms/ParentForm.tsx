
// src/components/forms/ParentForm.tsx
"use client";

import React, { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import InputField from '../InputField';
import { parentSchema, type ParentSchema as ParentFormValues } from '@/lib/formValidationSchemas';
import { useCreateParentMutation, useUpdateParentMutation } from '@/lib/redux/api/entityApi';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import type { Parent, User } from '@/types/index';

interface ParentFormProps {
  type: 'create' | 'update';
  initialData?: (Partial<Parent> & { user?: Partial<Pick<User, 'username' | 'email'>> | null }) | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

interface CloudinaryUploadWidgetResults {
  event: "success" | string; 
  info: CloudinaryUploadWidgetInfo | string | { public_id: string }; 
}

const ParentForm: React.FC<ParentFormProps> = ({ type, initialData, setOpen }) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [createParent, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateParentMutation();
  const [updateParent, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateParentMutation();
  
  const isLoading = isCreating || isUpdating;

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      username: initialData?.user?.username || '',
      email: initialData?.user?.email || '',
      password: '',
      address: initialData?.address || '',
      img: initialData?.img || null,
      phone: initialData?.phone || '',
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form;

  const watchedImg = watch("img");
  const imgPreview = watchedImg === undefined ? initialData?.img : watchedImg;

  const onSubmit: SubmitHandler<ParentFormValues> = async (formData) => {
    const payload = { ...formData };
    
    if (type === "update" && (!payload.password || payload.password.trim() === "")) {
        delete (payload as any).password;
    }

    try {
      if (type === 'create') {
        await createParent(payload).unwrap();
      } else if (initialData?.id) {
        await updateParent({ ...payload, id: initialData.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by the useEffect hook
    }
  };
  
  useEffect(() => {
    if (createSuccess || updateSuccess) {
      const action = type === "create" ? "créé" : "mis à jour";
      toast({ title: `Parent ${action} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router, toast]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData, toast]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Parent" : "Mettre à jour le Parent"}
      </h1>
      
      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Authentification</legend>
        <InputField label="Nom d'utilisateur" name="username" register={register} error={errors.username} disabled={isLoading} />
        <InputField label="E-mail" name="email" type="email" register={register} error={errors.email} disabled={isLoading} />
        <InputField 
          label={type === 'update' ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} 
          name="password" 
          type="password" 
          register={register} 
          error={errors.password} 
          disabled={isLoading} 
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Informations Personnelles</legend>
        <InputField label="Prénom" name="name" register={register} error={errors.name} disabled={isLoading} />
        <InputField label="Nom" name="surname" register={register} error={errors.surname} disabled={isLoading} />
        <InputField label="Adresse" name="address" register={register} error={errors.address} disabled={isLoading} />
        <InputField label="Téléphone (Optionnel)" name="phone" register={register} error={errors.phone} disabled={isLoading} />
        
        <div className="flex flex-col gap-2 w-full md:col-span-1">
          <label className="text-xs font-medium text-gray-700">Image de Profil</label>
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            onSuccess={(result: CloudinaryUploadWidgetResults) => {
              if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
                const info = result.info as CloudinaryUploadWidgetInfo;
                setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true });
              }
            }}
          >
            {({ open }) => (
              <button type="button" onClick={() => open()} className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer p-2 border rounded disabled:opacity-50" disabled={isLoading}>
                <Image src="/upload.png" alt="Upload" width={28} height={28} data-ai-hint="upload icon" />
                <span>{imgPreview ? "Changer la Photo" : "Télécharger une Photo"}</span>
              </button>
            )}
          </CldUploadWidget>
          {imgPreview && <Image src={imgPreview} alt="Preview" width={80} height={80} className="rounded mt-2 object-cover"/>}
          {errors.img && <p className="text-xs text-red-400">{errors.img.message}</p>}
        </div>
      </fieldset>
      
      {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm mt-2">
           Erreur: {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        {isLoading ? 'Enregistrement...' : (type === 'update' ? "Mettre à jour le Parent" : "Créer le Parent")}
      </Button>
    </form>
  );
};

export default ParentForm;
