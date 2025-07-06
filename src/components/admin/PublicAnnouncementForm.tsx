// src/components/admin/PublicAnnouncementForm.tsx
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2, Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Image from "next/image";

// The schema now validates the visible fields. The hidden `description` is constructed from them.
const publicAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  text: z.string().optional(),
  // This is a hidden field now, used to pass the final JSON to the API.
  description: z.string(), 
}).refine(data => !!data.text || data.description.includes('"files":[') && !data.description.includes('"files":[]'), {
  message: "Veuillez ajouter une description ou téléverser au moins un fichier.",
  path: ["text"], // Show error message under the text field.
});

// The form values now include the visible text field.
type PublicAnnouncementFormValues = z.infer<typeof publicAnnouncementSchema>;

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
  original_filename?: string;
}

interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string };
}

export default function PublicAnnouncementForm() {
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<PublicAnnouncementFormValues>({
    resolver: zodResolver(publicAnnouncementSchema),
  });
  
  const textValue = watch('text');

  // This effect constructs the final JSON string for the hidden 'description' field
  // whenever the text or uploaded files change.
  useEffect(() => {
    const descriptionObject = {
      isPublic: true,
      text: textValue || '',
      files: uploadedFiles,
    };
    const descriptionValue = JSON.stringify(descriptionObject);
    setValue("description", descriptionValue, { shouldValidate: true });
  }, [uploadedFiles, textValue, setValue]);

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
  
  const onFormSubmit: SubmitHandler<PublicAnnouncementFormValues> = async (formData) => {
    // Final check before submitting
    if (!formData.text && uploadedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Contenu manquant",
        description: "Veuillez ajouter une description ou téléverser un fichier.",
      });
      return;
    }
      
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/public-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // We only need to send title and the constructed description.
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "La publication de l'annonce a échoué.");
      }

      toast({
        title: 'Annonce Publiée',
        description: `L'annonce "${formData.title}" a été publiée avec succès.`,
      });
      reset();
      setUploadedFiles([]);
      router.refresh(); // Refresh the page to show the new announcement in the list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Erreur',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Titre de l'annonce / Galerie</Label>
        <Input id="title" {...register("title")} disabled={isSubmitting} className="mt-1"/>
        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="text">Description (Optionnel)</Label>
        <Textarea 
            id="text" 
            {...register("text")} 
            disabled={isSubmitting} 
            placeholder="Ajoutez une description textuelle à votre annonce..."
            className="mt-1"
        />
        {errors.text && <p className="text-destructive text-sm mt-1">{errors.text.message}</p>}
      </div>

      <div>
        <Label>Fichiers (Optionnel)</Label>
        <input type="hidden" {...register("description")} />
        
        {uploadedFiles.length > 0 ? (
          <div className="mt-2 p-4 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                   {file.type === 'image' ? 
                    <Image src={file.url} alt={`Preview ${index}`} fill sizes="100px" className="object-cover" /> : 
                    <FileText className="h-10 w-10 text-muted-foreground" />}
                </div>
                <p className="text-xs truncate mt-1 text-muted-foreground">{file.url.split('/').pop()}</p>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeUploadedFile(index)} 
                  disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2"/>
                <span className="font-semibold">Cliquez pour téléverser</span>
                <span className="text-xs text-muted-foreground">Téléversez des images ou des documents</span>
              </button>
            )}
          </CldUploadWidget>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {isSubmitting ? 'Publication en cours...' : 'Publier l\'annonce'}
      </Button>
    </form>
  );
}
