// src/components/forms/TeacherForm.tsx
import React, { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSex, type Teacher, type User, type Subject, type Class } from '@/types/index';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { teacherSchema, type TeacherSchema as TeacherFormValues } from '@/lib/formValidationSchemas';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import InputField from '../InputField';

import { useCreateTeacherMutation, useUpdateTeacherMutation } from '@/lib/redux/api/entityApi';
import { CalendarIcon } from 'lucide-react';
interface TeacherFormProps {
  type: 'create' | 'update';
  initialData?: (Partial<Teacher> & { user?: Partial<Pick<User, 'username' | 'email'>> | null, subjects?: Partial<Pick<Subject, 'id' | 'name'>>[] }) | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  availableSubjects?: Pick<Subject, 'id' | 'name'>[];
}

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  public_id?: string;
  thumbnail_url?: string;
  original_filename?: string;
  [key: string]: any; 
}

interface CloudinaryUploadWidgetResults {
 event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string }; 
}

const TeacherForm: React.FC<TeacherFormProps> = ({ type, initialData, setOpen, availableSubjects = [] }) => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [createTeacher, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateTeacherMutation();
  
  const isLoading = isCreating || isUpdating;
  
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      console.warn(
        "TeacherForm: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not defined. Image uploads may fail."
      );
      toast({
        variant: "destructive",
        title: "Erreur de Configuration",
        description: "Le préréglage de téléversement Cloudinary n'est pas configuré. Veuillez contacter un administrateur.",
        duration: 10000,
      });
    }
  }, [toast]);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      username: initialData?.user?.username || '',
      email: initialData?.user?.email || '',
      password: '',
      address: initialData?.address || '',
      img: initialData?.img || null,
      phone: initialData?.phone || undefined,
      bloodType: initialData?.bloodType || '',
      sex: initialData?.sex as UserSex | null | undefined ?? null as UserSex | null | undefined,
      birthday: initialData?.birthday ? new Date(initialData.birthday) : undefined as Date | undefined,
      subjects: initialData?.subjects?.map((subject) => String(subject.id)) || [],
    }
  });

  const { register, handleSubmit, formState: { errors }, control, setValue, watch, reset } = form;

  const sexWatch = watch("sex");
  const birthdayWatch = watch("birthday");
  const watchedImg = watch("img");
  const imgPreview = watchedImg === undefined ? initialData?.img : watchedImg;

  const onSubmit: SubmitHandler<TeacherFormValues> = async (formData) => {
    const payload = { ...formData };
    
    if (type === "update" && (!payload.password || payload.password.trim() === "")) {
        delete (payload as any).password;
    }

    try {
      if (type === 'create') {
        await createTeacher(payload).unwrap();
      } else if (initialData?.id) {
        await updateTeacher({ ...payload, id: initialData.id }).unwrap();
      }
    } catch (err) {
       // Error is handled by the useEffect hook below
    }
  };

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      const action = type === "create" ? "créé" : "mis à jour";
      toast({ title: `Enseignant ${action} avec succès !` });
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
      <><h1 className="text-xl font-semibold">
      {type === "create" ? "Créer un Nouvel Enseignant" : "Mettre à jour l'Enseignant"}
    </h1><fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Authentification</legend>
        <InputField label="Nom d'utilisateur" name="username" register={register} error={errors.username} disabled={isLoading} />
        <InputField label="E-mail" name="email" type="email" register={register} error={errors.email} disabled={isLoading} />
        <InputField
          label={type === 'update' ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
          name="password"
          type="password"
          register={register}
          error={errors.password}
          disabled={isLoading} />
      </fieldset><fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-4 rounded-md">
        <legend className="text-sm font-medium text-muted-foreground px-1">Informations Personnelles</legend>
        <InputField label="Prénom" name="name" register={register} error={errors.name} disabled={isLoading} />
        <InputField label="Nom" name="surname" register={register} error={errors.surname} disabled={isLoading} />
        <InputField label="Adresse" name="address" register={register} error={errors.address} disabled={isLoading} />
        <InputField label="Téléphone (Optionnel)" name="phone" register={register} error={errors.phone} disabled={isLoading} />
        <InputField label="Groupe Sanguin" name="bloodType" register={register} error={errors.bloodType} disabled={isLoading} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
          <RadioGroup
            onValueChange={(value: string) => setValue("sex", value as UserSex | null | undefined)}
            value={sexWatch}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={UserSex.MALE} id="sex-male" disabled={isLoading} />
              <label htmlFor="sex-male">Masculin</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={UserSex.FEMALE} id="sex-female" disabled={isLoading} />
              <label htmlFor="sex-female">Féminin</label>
            </div>
          </RadioGroup>
          {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de Naissance</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!birthdayWatch ? "text-muted-foreground" : ""}`} // Adjusted template literal
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthdayWatch ? format(new Date(birthdayWatch), "PPP") : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthdayWatch ? new Date(birthdayWatch) : undefined}
                onSelect={(date) => setValue("birthday", date!, { shouldValidate: true })} // Ensure date is not null
                initialFocus
                disabled={isLoading} />
            </PopoverContent>
          </Popover>
          {errors.birthday && <p className="mt-1 text-sm text-red-600">{errors.birthday.message as string}</p>}
        </div>\n

        <div className="md:col-span-1">
          <label htmlFor="subjects-select" className="block text-sm font-medium text-gray-700 mb-1">Matières Enseignées</label>
          <select
            id="subjects-select"
            multiple
            {...register("subjects")}
            className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50 h-24 p-2 ring-[1.5px] ring-gray-300 text-sm"
            disabled={isLoading}
            defaultValue={initialData?.subjects?.map((s: any) => String(s.id)) || []}
          >
            {availableSubjects.map(subject => (
              <option key={subject.id} value={String(subject.id)}>{subject.name}</option>
            ))}
          </select>
          {errors.subjects && <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:col-span-1">
          <label className="text-xs font-medium text-gray-700">Image de Profil</label>
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            onSuccess={(result: any) => {
              if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
                const info = result.info as CloudinaryUploadWidgetInfo;
                setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true });
              }
            } }
            onError={(error) => {
              console.error("Cloudinary Upload Error:", error);
              toast({
                variant: "destructive",
                title: "Échec du téléversement",
                description: "Veuillez vérifier que votre 'upload preset' est configuré pour les téléversements non signés.",
                duration: 10000,
              });
            } }
          >
            {({ open }) => (
              <button type="button" onClick={() => open()} className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer p-2 border rounded disabled:opacity-50" disabled={isLoading}>
                <Image src="/upload.png" alt="Upload" width={28} height={28} data-ai-hint="upload icon" />
                <span>{imgPreview ? "Changer la Photo" : "Télécharger une Photo"}</span>
              </button>
            )}
          </CldUploadWidget>
          {imgPreview && (
            <div className="relative w-20 h-20 mt-2">
              <Image src={imgPreview} alt="Preview" fill sizes="80px" className="rounded object-cover" />
            </div>
          )}
          {errors.img && <p className="text-xs text-red-400">{errors.img.message}</p>}
        </div>

      </fieldset>
      
       {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm mt-2">
           Erreur: {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        {isLoading ? 'Enregistrement...' : (type === 'update' ? "Mettre à jour l'Enseignant" : "Créer l'Enseignant")}
      </Button>
   );
   </>)
  };



export default TeacherForm;
