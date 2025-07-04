"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { useCreateClassMutation, useUpdateClassMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any; 
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { 
    teachers: { id: string; name: string; surname: string }[],
    grades: { id: number; level: number }[]
  };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: data ? { ...data, gradeLevel: data.grade?.level } : {},
  });

  const router = useRouter();
  const [createClass, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateClassMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createClass(formData).unwrap();
      } else if (data?.id) {
        await updateClass({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Classe ${type === "create" ? "créée" : "mise à jour"} avec succès !`});
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

  const teachers = relatedData?.teachers || [];
  const grades = relatedData?.grades || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Classe" : "Mettre à jour la Classe"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nom de la Classe"
          name="name"
          register={register}
          error={errors?.name}
          inputProps={{disabled: isLoading}}
        />
        <InputField
          label="Capacité"
          name="capacity"
          type="number"
          register={register}
          error={errors?.capacity}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Superviseur (Optionnel)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("supervisorId")}
            disabled={isLoading}
          >
            <option value="">Sélectionner un superviseur</option>
            {teachers.map((teacher: { id: string; name: string; surname: string }) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message?.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Niveau</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("gradeLevel")}
            disabled={isLoading}
          >
            <option value="">Sélectionner un niveau</option>
            {grades.map((grade: { id: number; level: number }) => (
              <option value={grade.level} key={grade.id}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeLevel?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeLevel.message?.toString()}
            </p>
          )}
        </div>
      </div>
      {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm">
           {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" disabled={isLoading}>
        {isLoading ? "Traitement en cours..." : (type === "create" ? "Créer la Classe" : "Mettre à jour la Classe")}
      </button>
    </form>
  );
};

export default ClassForm;
