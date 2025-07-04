
"use client";
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, type EventSchema } from "@/lib/formValidationSchemas";
import type { Event, Class } from "@/types/index";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InputField from '../InputField';
import { toast } from '@/hooks/use-toast';
import { useCreateEventMutation, useUpdateEventMutation } from '@/lib/redux/api/entityApi';
import { useRouter } from 'next/navigation';

interface EventFormProps {
  initialData?: Event | null;
  availableClasses: Pick<Class, 'id' | 'name'>[];
  onSubmit: (data: EventSchema) => void;
  loading?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, availableClasses, onSubmit: onFormSubmit, loading }) => {
  const router = useRouter();
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const isLoading = loading || isCreating || isUpdating;

  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime ? new Date(new Date(initialData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      endTime: initialData?.endTime ? new Date(new Date(initialData.endTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      classId: initialData?.classId || null,
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const processSubmit: SubmitHandler<EventSchema> = async (data) => {
    try {
        if (initialData?.id) {
            await updateEvent({ id: initialData.id, ...data }).unwrap();
            toast({ title: "Succès", description: "Événement mis à jour avec succès." });
        } else {
            await createEvent(data).unwrap();
            toast({ title: "Succès", description: "Événement créé avec succès." });
        }
        onFormSubmit(data); // This is likely to close the modal
        router.refresh();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: error.data?.message || "Une erreur s'est produite."
        });
    }
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <h1 className="text-xl font-semibold">{initialData ? "Modifier l'Événement" : "Créer un Nouvel Événement"}</h1>
      
      <InputField
        label="Titre"
        name="title"
        register={register}
        error={errors.title}
        inputProps={{ disabled: isLoading, className: "md:w-full"}}
      />
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <Textarea
          id="description"
          {...register("description")}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date et heure de début"
          name="startTime"
          type="datetime-local"
          register={register}
          error={errors.startTime}
          inputProps={{ disabled: isLoading, className: "md:w-full"}}
        />
        <InputField
          label="Date et heure de fin"
          name="endTime"
          type="datetime-local"
          register={register}
          error={errors.endTime}
          inputProps={{ disabled: isLoading, className: "md:w-full"}}
        />
      </div>

      <div>
        <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Classe (Optionnel)</label>
        <select
          id="classId"
          {...register("classId")}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          defaultValue={initialData?.classId?.toString() ?? "null"}
        >
          <option value="null">Toutes les classes</option>
          {availableClasses.map(classItem => (
            <option key={classItem.id} value={String(classItem.id)}>
              {classItem.name}
            </option>
          ))}
        </select>
        {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enregistrement...' : (initialData ? "Mettre à jour l'événement" : "Créer l'événement")}
      </Button>
    </form>
  );
};

export default EventForm;
