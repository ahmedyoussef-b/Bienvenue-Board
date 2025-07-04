"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast"; // Assuming useToast is from ShadCN or similar
import { useRouter } from "next/navigation";

const AssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any; // Consider using a more specific type if possible, e.g., Partial<Assignment>
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { lessons: { id: number; name: string }[] };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: data ? {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : undefined,
    } : {},
  });

  const router = useRouter();
  const [createAssignment, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateAssignmentMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createAssignment(formData).unwrap();
      } else if (data?.id) {
        await updateAssignment({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect based on mutation state
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Devoir ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
      setOpen(false);
      reset(); // Reset form fields
      router.refresh(); // Or use RTK Query tag invalidation
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
        {type === "create" ? "Créer un Nouveau Devoir" : "Mettre à jour le Devoir"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Titre du Devoir"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{disabled: isLoading}}
        />
        <InputField
          label="Date de Début"
          name="startDate"
          type="datetime-local"
          register={register}
          error={errors?.startDate}
          inputProps={{disabled: isLoading}}
        />
        <InputField
          label="Date Limite"
          name="dueDate"
          type="datetime-local"
          register={register}
          error={errors?.dueDate}
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
        {isLoading ? "Traitement en cours..." : (type === "create" ? "Créer le Devoir" : "Mettre à jour le Devoir")}
      </button>
    </form>
  );
};

export default AssignmentForm;
