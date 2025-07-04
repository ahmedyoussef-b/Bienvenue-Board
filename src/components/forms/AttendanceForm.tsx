// src/components/forms/AttendanceForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { attendanceSchema, type AttendanceSchema } from "@/lib/formValidationSchemas";
import { useCreateAttendanceMutation, useUpdateAttendanceMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Student, LessonWithDetails } from "@/types"; // Import types

const AttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students: Pick<Student, 'id' | 'name' | 'surname'>[];
    lessons: Pick<LessonWithDetails, 'id' | 'name'>[];
  };
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined, // Format for 'date' input
      present: data.present ?? false,
    } : {
      present: true,
    },
  });

  const isPresent = watch("present");

  const router = useRouter();
  const [createAttendance, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateAttendanceMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createAttendance(formData).unwrap();
      } else if (data?.id) {
        await updateAttendance({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Présence ${type === "create" ? "enregistrée" : "mise à jour"} avec succès !` });
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


  const students = relatedData?.students || [];
  const lessons = relatedData?.lessons || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Enregistrer une Présence" : "Mettre à jour une Présence"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 w-full">
          <Label>Étudiant</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("studentId")}
            defaultValue={data?.studentId}
            disabled={isLoading || type === 'update'}
          >
            <option value="">Sélectionner un étudiant</option>
            {students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name} {student.surname}
              </option>
            ))}
          </select>
          {errors.studentId && <p className="text-xs text-red-400">{errors.studentId.message}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label>Cours</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
            disabled={isLoading || type === 'update'}
          >
            <option value="">Sélectionner un cours</option>
            {lessons.map((lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId && <p className="text-xs text-red-400">{errors.lessonId.message}</p>}
        </div>

        <InputField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors?.date}
          inputProps={{disabled: isLoading}}
        />

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="present"
            checked={isPresent}
            onCheckedChange={(checked) => setValue("present", checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="present" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Présent(e)
          </Label>
          {errors.present && <p className="text-xs text-red-400">{errors.present.message}</p>}
        </div>
      </div>
      
      {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm mt-2">
           {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" disabled={isLoading}>
        {isLoading ? "Traitement..." : (type === "create" ? "Enregistrer" : "Mettre à jour")}
      </button>
    </form>
  );
};

export default AttendanceForm;
