// src/components/forms/LessonForm.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, type LessonSchema } from "@/lib/formValidationSchemas";
import { useCreateLessonMutation, useUpdateLessonMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Subject, Class, Teacher, Classroom, Lesson } from "@/types/index";
import { Day } from "@/types/index";

// Helper to format a Date object or ISO string into HH:mm format
const formatTime = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: Lesson;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    subjects: Pick<Subject, 'id' | 'name'>[];
    classes: Pick<Class, 'id' | 'name'>[];
    teachers: Pick<Teacher, 'id' | 'name' | 'surname'>[];
    classrooms: Pick<Classroom, 'id' | 'name'>[];
  };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: data ? {
      ...data,
      startTime: formatTime(data.startTime),
      endTime: formatTime(data.endTime),
      classroomId: data.classroomId ?? null,
    } : {
      name: '',
      day: Day.MONDAY,
      startTime: '',
      endTime: '',
    },
  });

  const router = useRouter();
  const [createLesson, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateLessonMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createLesson(formData).unwrap();
      } else if (data?.id) {
        await updateLesson({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Cours ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
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

  const { subjects = [], classes = [], teachers = [], classrooms = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Cours" : "Mettre à jour le Cours"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Nom du cours (ex: Maths 7A - Lundi)" name="name" register={register} error={errors?.name} inputProps={{disabled: isLoading, className: "md:w-full"}}/>
        
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Jour</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("day")} disabled={isLoading}>
            {Object.values(Day).map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          {errors.day?.message && <p className="text-xs text-red-400">{errors.day.message.toString()}</p>}
        </div>

        <InputField label="Heure de début" name="startTime" type="time" register={register} error={errors?.startTime} inputProps={{disabled: isLoading, className: "md:w-full"}}/>
        <InputField label="Heure de fin" name="endTime" type="time" register={register} error={errors?.endTime} inputProps={{disabled: isLoading, className: "md:w-full"}}/>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Matière</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("subjectId")} disabled={isLoading}>
            <option value="">Sélectionner une matière</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.subjectId?.message && <p className="text-xs text-red-400">{errors.subjectId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Classe</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("classId")} disabled={isLoading}>
            <option value="">Sélectionner une classe</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Enseignant</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("teacherId")} disabled={isLoading}>
            <option value="">Sélectionner un enseignant</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
          </select>
          {errors.teacherId?.message && <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Salle de classe (Optionnel)</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("classroomId")} disabled={isLoading}>
            <option value="">Aucune salle spécifique</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.classroomId?.message && <p className="text-xs text-red-400">{errors.classroomId.message.toString()}</p>}
        </div>
      </div>
      {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm">
           {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" disabled={isLoading}>
        {isLoading ? "Traitement..." : (type === "create" ? "Créer le Cours" : "Mettre à jour le Cours")}
      </button>
    </form>
  );
};

export default LessonForm;
