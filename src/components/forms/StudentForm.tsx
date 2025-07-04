
//src/components/forms/StudentForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import type { Dispatch, SetStateAction} from "react";
import { useEffect, useState } from "react";
import { studentSchema, type StudentSchema } from "@/lib/formValidationSchemas";
import { useCreateStudentMutation, useUpdateStudentMutation } from "@/lib/redux/api/entityApi";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Student, Grade, Class, Parent, User, UserSex } from "@/types/index"; // Import Prisma types

// Define specific types for relatedData
type RelatedGrade = Pick<Grade, 'id' | 'level'>;
type RelatedClass = Pick<Class, 'id' | 'name' | 'capacity'> & { _count: { students: number } };
type RelatedParent = Pick<Parent, 'id' | 'name' | 'surname'>;

// Type for the 'data' prop when updating
type UpdateStudentData = Omit<Student, 'birthday' | 'userId' | 'gradeId' | 'classId' | 'parentId'> & {
  id: string; 
  user?: Pick<User, 'username' | 'email'> | null;
  img: string | null; 
  birthday?: Date | string; 
  gradeId: number;
  classId: number;
  parentId: string;
  username?: string; 
  email?: string;    
  password?: string; 
};

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


const StudentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: UpdateStudentData;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    grades: RelatedGrade[];
    classes: RelatedClass[];
    parents: RelatedParent[];
  };
}) => {

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      console.warn(
        "StudentForm: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not defined in your environment variables. Image uploads will fail."
      );
      toast({
        variant: "destructive",
        title: "Erreur de Configuration",
        description: "Le préréglage de téléversement Cloudinary n'est pas configuré. Veuillez contacter un administrateur.",
        duration: 10000,
      });
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue, 
    watch,
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: data ? {
        ...data,
        username: data.username || data.user?.username || "",
        email: data.email || data.user?.email || "",
        birthday: data.birthday ? (typeof data.birthday === 'string' ? new Date(data.birthday) : data.birthday) : undefined,
        password: "", 
        phone: data.phone || undefined,
        sex: data.sex || UserSex.MALE, 
        gradeId: Number(data.gradeId),
        classId: Number(data.classId),
        parentId: String(data.parentId),
        img: data.img || undefined,
    } : {
        username: "",
        email: "",
        password: "",
        name: "",
        surname: "",
        phone: undefined,
        address: undefined,
        bloodType: "",
        sex: UserSex.MALE,
        img: undefined,
    },
  });

  const initialImgPreview = data?.img || null;
  // Use watch to get the current value of 'img' from the form state for the preview
  const watchedImg = watch("img"); 
  const imgPreview = watchedImg === undefined ? initialImgPreview : watchedImg;

  const router = useRouter();

  const [createStudent, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateStudentMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    const payload: StudentSchema & { id?: string } = {
      ...formData,
      // Ensure 'img' is explicitly null if undefined, or its string value
      img: formData.img === undefined ? null : formData.img,
    };

    if (type === "update" && (!formData.password || formData.password.trim() === "")) {
        delete (payload as any).password; 
    }
    
    try {
      if (type === "create") {
        await createStudent(payload).unwrap();
      } else if (data?.id) {
        await updateStudent({ ...payload, id: data.id }).unwrap();
      }
    } catch (err) {
      console.error(`${type === "create" ? "Creation" : "Update"} Error: `, err);
    }
  });

 useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Étudiant ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const apiError = error as any; 
      const errorMessage = apiError?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData, toast]);


  const grades = relatedData?.grades || [];
  const classes = relatedData?.classes || [];
  const parents = relatedData?.parents || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouvel Étudiant" : "Mettre à jour l'Étudiant"}
      </h1>

      <span className="text-xs text-gray-400 font-medium">Informations d'Authentification</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Nom d'utilisateur" name="username" register={register} error={errors?.username} inputProps={{disabled: isLoading}}/>
        <InputField label="E-mail" name="email" type="email" register={register} error={errors?.email} inputProps={{disabled: isLoading}}/>
        <InputField label={type === 'create' ? "Mot de passe" : "Nouveau Mot de passe (optionnel)"} name="password" type="password" register={register} error={errors?.password} inputProps={{disabled: isLoading}}/>
      </div>

      <span className="text-xs text-gray-400 font-medium">Informations Personnelles</span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField label="Prénom" name="name" register={register} error={errors.name} inputProps={{disabled: isLoading}}/>
        <InputField label="Nom" name="surname" register={register} error={errors.surname} inputProps={{disabled: isLoading}}/>
        <InputField label="Téléphone" name="phone" type="tel" register={register} error={errors.phone} inputProps={{disabled: isLoading}}/>
        <InputField label="Adresse" name="address" register={register} error={errors.address} inputProps={{disabled: isLoading}}/>
        <InputField label="Groupe Sanguin" name="bloodType" register={register} error={errors.bloodType} inputProps={{disabled: isLoading}}/>
        <InputField label="Date de Naissance" name="birthday" type="date" register={register} error={errors.birthday} inputProps={{disabled: isLoading}}/>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sexe</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" {...register("sex")} disabled={isLoading}>
            <option value={UserSex.MALE}>Masculin</option>
            <option value={UserSex.FEMALE}>Féminin</option>
          </select>
          {errors.sex?.message && <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Niveau</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" {...register("gradeId")} disabled={isLoading}>
            <option value="">Sélectionner le Niveau</option>
            {grades.map((grade) => (
              <option value={grade.id} key={grade.id}>{grade.level}</option>
            ))}
          </select>
          {errors.gradeId?.message && <p className="text-xs text-red-400">{errors.gradeId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Classe</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" {...register("classId")} disabled={isLoading}>
            <option value="">Sélectionner la Classe</option>
            {classes.map((classItem) => (
              <option value={classItem.id} key={classItem.id} disabled={classItem._count.students >= classItem.capacity && data?.classId !== classItem.id}>
                {classItem.name} ({classItem._count.students}/{classItem.capacity})
              </option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>}
        </div>

         <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Parent</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50" {...register("parentId")} disabled={isLoading}>
            <option value="">Sélectionner le Parent</option>
            {parents.map((parent) => (
              <option value={parent.id} key={parent.id}>{parent.name} {parent.surname}</option>
            ))}
          </select>
          {errors.parentId?.message && <p className="text-xs text-red-400">{errors.parentId.message.toString()}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full md:w-1/4">
        <label className="text-xs text-gray-500">Image de Profil</label>
        <CldUploadWidget
           uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} // Provide a fallback preset name or ensure env var is set
           onSuccess={(result: CloudinaryUploadWidgetResults) => { // Explicitly type result
             if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
               const info = result.info as CloudinaryUploadWidgetInfo; // Type assertion
               setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true }); // Update form field state
             }
           }}
        >
          {({ open }) => (
            <button type="button" onClick={() => open()} className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer p-2 border rounded disabled:opacity-50" disabled={isLoading}>
              <Image src="/upload.png" alt="Upload" width={28} height={28} />
              <span>{imgPreview ? "Changer la Photo" : "Télécharger une Photo"}</span>
            </button>
          )}
        </CldUploadWidget>
        {imgPreview && <Image src={imgPreview} alt="Preview" width={80} height={80} className="rounded mt-2 object-cover"/>}
         {errors.img?.message && <p className="text-xs text-red-400">{errors.img.message.toString()}</p>}
      </div>
       {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm">
           {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" disabled={isLoading}>
        {isLoading ? "Traitement..." : (type === "create" ? "Créer l'Étudiant" : "Mettre à jour l'Étudiant")}
      </button>
    </form>
  );
};

export default StudentForm;
