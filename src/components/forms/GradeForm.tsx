
// src/components/forms/GradeForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { gradeSchema, type GradeSchema } from "@/lib/formValidationSchemas";
import { useCreateGradeMutation, useUpdateGradeMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Grade } from "@/types/index";

const GradeForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: Grade; 
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GradeSchema>({
    resolver: zodResolver(gradeSchema),
    defaultValues: data || { level: undefined },
  });

  const router = useRouter();
  const [createGrade, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateGradeMutation();
  const [updateGrade, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateGradeMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData: GradeSchema) => {
    try {
      if (type === "create") {
        await createGrade(formData).unwrap();
      } else if (data?.id) {
        await updateGrade({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // L'erreur est déjà gérée par les hooks de mutation RTK Query et les useEffect ci-dessous
      // Pas besoin de logger ici, car cela pourrait dupliquer les messages d'erreur.
    }
  });

  useEffect(() => {
    if (createSuccess) {
      toast({ title: "Niveau créé avec succès !" });
      setOpen(false);
      reset();
      router.refresh();
    }
    if (updateSuccess) {
      toast({ title: "Niveau mis à jour avec succès !" });
      setOpen(false);
      reset(); // Il peut être préférable de ne pas réinitialiser après une mise à jour réussie pour permettre d'autres modifications.
      router.refresh();
    }
  }, [createSuccess, updateSuccess, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const apiError = error as any;
      const errorMessage = apiError?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData, toast]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Niveau" : "Mettre à Jour le Niveau"}
      </h1>

      <div className="flex flex-col gap-4">
        <InputField
          label="Niveau (ex: 1, 2, 3)"
          name="level"
          type="number"
          register={register}
          error={errors?.level}
          inputProps={{ disabled: isLoading, className: "md:w-full" }}
        />
      </div>

      {(createIsError || updateIsError) && (
        <span className="text-destructive text-sm mt-2">
          Erreur: {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md mt-4" disabled={isLoading}>
        {isLoading ? "Traitement..." : (type === "create" ? "Créer Niveau" : "Mettre à Jour Niveau")}
      </button>
    </form>
  );
};

export default GradeForm;
