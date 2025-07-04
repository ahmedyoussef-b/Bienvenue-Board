"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, type AnnouncementSchema } from "@/lib/formValidationSchemas";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Announcement, Class } from "@/types/index";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2, Plus, Send } from "lucide-react";
import NextImage from "next/image"; // To avoid conflict with lucide-react Image icon

// Define specific types for related data
type RelatedClass = Pick<Class, 'id' | 'name'>;

type UpdateAnnouncementData = Announcement;

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
  original_filename?: string;
}

interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string };
}

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: UpdateAnnouncementData;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { classes: RelatedClass[] };
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; type: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      classId: data.classId,
    } : {
      title: "",
      description: "",
      date: undefined,
      classId: null,
    },
  });

  // Handle initial data for updates
  useEffect(() => {
    if (type === 'update' && data?.description) {
      try {
        const fileInfo = JSON.parse(data.description);
        // Handle both new gallery format and old single file format
        if (fileInfo.files && Array.isArray(fileInfo.files)) {
          setUploadedFiles(fileInfo.files);
        } else if (fileInfo.fileUrl && fileInfo.fileType) {
          setUploadedFiles([{ url: fileInfo.fileUrl, type: fileInfo.fileType }]);
        }
        setValue('description', data.description, { shouldValidate: true });
      } catch (e) {
        // Legacy text announcement. We can't edit it with this form.
      }
    }
  }, [data, type, setValue]);

  // Sync uploadedFiles state with the form's description field
  useEffect(() => {
    const descriptionValue = uploadedFiles.length > 0
      ? JSON.stringify({ isPublic: true, files: uploadedFiles }) // Using the gallery format
      : "";
    setValue("description", descriptionValue, { shouldValidate: true });
  }, [uploadedFiles, setValue]);

  const router = useRouter();
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData: AnnouncementSchema) => {
    try {
      if (type === "create") {
        await createAnnouncement(formData).unwrap();
      } else if (data?.id) {
        await updateAnnouncement({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Annonce ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset();
      setUploadedFiles([]);
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Échec de l'opération",
        description: err.data?.message || "Une erreur inattendue s'est produite.",
      });
    }
  });

  const classes = relatedData?.classes || [];

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      const fileType = info.resource_type === 'raw' ? 'pdf' : info.resource_type;
      const file = { url: info.secure_url, type: fileType };
      setUploadedFiles(prev => [...prev, file]);
      toast({ title: "Fichier ajouté", description: info.original_filename || "Le fichier a été ajouté à la galerie." });
    }
  };

  const removeUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Publier une Nouvelle Annonce" : "Mettre à jour l'Annonce"}
      </h1>

      <div className="flex flex-col gap-4">
        <InputField
          label="Titre de l'Annonce"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{disabled: isLoading}}
        />
        <input type="hidden" {...register("description")} />
        
        <div>
          <Label>Fichiers</Label>
          {uploadedFiles.length > 0 ? (
            <div className="mt-2 p-4 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                     {file.type === 'image' ? 
                      <NextImage src={file.url} alt={`Preview ${index}`} fill sizes="100px" className="object-cover" /> : 
                      <FileText className="h-10 w-10 text-muted-foreground" />}
                  </div>
                  <p className="text-xs truncate mt-1 text-muted-foreground">{file.url.split('/').pop()}</p>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeUploadedFile(index)} 
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3"/>
                  </Button>
                </div>
              ))}
              <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                  options={{ multiple: true }}
                  onSuccess={handleUploadSuccess}
              >
                  {({ open }) => (
                       <button 
                          type="button" 
                          onClick={() => open()} 
                          className="aspect-square w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          disabled={isLoading}
                      >
                          <Plus className="h-8 w-8 text-muted-foreground"/>
                          <span className="text-xs text-center mt-1">Ajouter plus</span>
                      </button>
                  )}
              </CldUploadWidget>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              options={{ multiple: true }}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button 
                  type="button" 
                  onClick={() => open()} 
                  className="mt-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-2"/>
                  <span className="font-semibold">Cliquez pour téléverser</span>
                  <span className="text-xs text-muted-foreground">Téléversez un ou plusieurs fichiers (PDF, images...)</span>
                </button>
              )}
            </CldUploadWidget>
          )}
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message?.toString()}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Date de publication"
          name="date"
          type="date"
          register={register}
          error={errors?.date}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full">
          <Label>Classe (Optionnel)</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("classId")}
            disabled={isLoading}
            defaultValue={data?.classId?.toString() ?? ""}
          >
            <option value="">Toutes les classes</option>
            {classes.map((cls: RelatedClass) => (
              <option value={cls.id.toString()} key={cls.id}>{cls.name}</option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>}
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || uploadedFiles.length === 0}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
        {isLoading ? "Publication..." : (type === "create" ? "Publier l'Annonce" : "Mettre à jour l'Annonce")}
      </Button>
    </form>
  );
};

export default AnnouncementForm;
