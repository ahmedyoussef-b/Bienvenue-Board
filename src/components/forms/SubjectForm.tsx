"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, type SubjectSchema } from "@/lib/formValidationSchemas";
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Subject, Teacher } from "@/types/index"; // Import Teacher type

// Define a more specific type for relatedData teachers
type RelatedTeacher = Pick<Teacher, 'id' | 'name' | 'surname'>;

const SubjectForm = ({
  type,
  data, // This data comes from Prisma, potentially with relations
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: Subject & { teachers?: Pick<Teacher, 'id'>[] }; // For update, data might include teacher IDs
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { teachers: RelatedTeacher[] };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: data 
      ? { ...data, teachers: data.teachers?.map((t: Pick<Teacher, 'id'>) => t.id.toString()) || [] } 
      : { teachers: [] },
  });

  const router = useRouter();
  const [createSubject, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateSubjectMutation();
  
  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createSubject(formData).unwrap();
      } else if (data?.id) {
        // Ensure teachers are sent as string array of IDs
        const payload = { ...formData, teachers: formData.teachers.map(id => String(id)) };
        await updateSubject({ ...payload, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect based on mutation state
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Matière ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset(); 
      router.refresh(); 
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData, toast]);

  const teachers = relatedData?.teachers || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Matière" : "Mettre à jour la Matière"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nom de la Matière"
          name="name"
          register={register}
          error={errors?.name}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Enseignants</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-24 disabled:opacity-50"
            {...register("teachers")}
            disabled={isLoading}
          >
            {teachers.map((teacher: RelatedTeacher) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">
              {errors.teachers.message?.toString()}
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
        {isLoading ? "Traitement..." : (type === "create" ? "Créer la Matière" : "Mettre à jour la Matière")}
      </button>
    </form>
  );
};

export default SubjectForm;
