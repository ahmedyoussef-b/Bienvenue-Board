"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { useCreateExamMutation, useUpdateExamMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any; 
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { lessons: { id: number; name: string }[] };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: data ? {
      ...data,
      // Format dates for datetime-local input
      startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : undefined,
      endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : undefined,
    } : {},
  });

  const router = useRouter();
  const [createExam, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateExamMutation();
  const [updateExam, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateExamMutation();
  
  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createExam(formData).unwrap();
      } else if (data?.id) {
        await updateExam({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Examen ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
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

  const lessons = relatedData?.lessons || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouvel Examen" : "Mettre à jour l'Examen"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Titre de l'Examen"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{disabled: isLoading}}
        />
        <InputField
          label="Heure de Début"
          name="startTime"
          type="datetime-local"
          register={register}
          error={errors?.startTime}
          inputProps={{disabled: isLoading}}
        />
        <InputField
          label="Heure de Fin"
          name="endTime"
          type="datetime-local"
          register={register}
          error={errors?.endTime}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Cours</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
            disabled={isLoading}
          >
            <option value="">Sélectionner un cours</option>
            {lessons.map((lesson: { id: number; name: string }) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message?.toString()}
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
        {isLoading ? "Traitement en cours..." : (type === "create" ? "Créer l'Examen" : "Mettre à jour l'Examen")}
      </button>
    </form>
  );
};

export default ExamForm;
