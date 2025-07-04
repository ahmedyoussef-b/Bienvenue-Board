
//src/components/FormModal.tsx
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { FormContainerProps } from "./FormContainer";
import { 
  useDeleteSubjectMutation, 
  useDeleteClassMutation,
  useDeleteTeacherMutation,
  useDeleteStudentMutation,
  useDeleteExamMutation,
  useDeleteAssignmentMutation,
  useDeleteEventMutation,
  useDeleteAnnouncementMutation,
  useDeleteParentMutation,
  useDeleteLessonMutation,
  useDeleteResultMutation,
  useDeleteAttendanceMutation,
  useDeleteGradeMutation, 
} from "@/lib/redux/api/entityApi";

// LAZY LOADING FORMS
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), { loading: () => <p>Chargement du formulaire...</p> });
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading: () => <p>Chargement du formulaire...</p> });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const EventForm = dynamic(() => import("./forms/EventForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), { loading: () => <p>Chargement du formulaire...</p> });
const GradeForm = dynamic(() => import("./forms/GradeForm"), { loading: () => <p>Chargement du formulaire...</p> }); 
const ParentForm = dynamic(() => import("./forms/ParentForm"), { loading: () => <p>Chargement du formulaire...</p> });
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), { loading: () => <p>Chargement du formulaire...</p> });
const LessonForm = dynamic(() => import("./forms/LessonForm"), { loading: () => <p>Chargement du formulaire...</p> });
// const ResultForm = dynamic(() => import("./forms/ResultForm"), { loading: () => <p>Chargement du formulaire...</p> });


const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any, 
    relatedData?: any 
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  class: (setOpen, type, data, relatedData) => <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      initialData={data}
      setOpen={setOpen}
      availableSubjects={relatedData?.subjects || []}
      allClasses={relatedData?.classes || []}
    />),
  student: (setOpen, type, data, relatedData) => <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  exam: (setOpen, type, data, relatedData) => <ExamForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />
  ),
  event: (setOpen, type, data, relatedData) => <EventForm initialData={data} availableClasses={relatedData?.classes || []} onSubmit={() => {setOpen(false)}} />,
  announcement: (setOpen, type, data, relatedData) => <AnnouncementForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  grade: (setOpen, type, data, relatedData) => <GradeForm type={type} data={data} setOpen={setOpen} />, 
  parent: (setOpen, type, data, relatedData) => <ParentForm type={type} initialData={data} setOpen={setOpen} />,
  attendance: (setOpen, type, data, relatedData) => <AttendanceForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  lesson: (setOpen, type, data, relatedData) => <LessonForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
  // result: (setOpen, type, data, relatedData) => <ResultForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} />,
};

const FormModal = ({
  table,
  type,
  data, 
  id,   
  relatedData, 
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-accent" 
      : type === "update"
      ? "bg-blue-500" 
      : "bg-destructive"; 

  const [open, setOpen] = useState(false);
  const router = useRouter();
  const currentEntity = table;

  // Delete Mutation Hooks
  const [deleteSubject, { isLoading: isDeletingSubject, isSuccess: deleteSubjectSuccess, isError: deleteSubjectIsError, error: deleteSubjectErrorData }] = useDeleteSubjectMutation();
  const [deleteClass, { isLoading: isDeletingClass, isSuccess: deleteClassSuccess, isError: deleteClassIsError, error: deleteClassErrorData }] = useDeleteClassMutation();
  const [deleteTeacher, { isLoading: isDeletingTeacher, isSuccess: deleteTeacherSuccess, isError: deleteTeacherIsError, error: deleteTeacherErrorData }] = useDeleteTeacherMutation();
  const [deleteStudent, { isLoading: isDeletingStudent, isSuccess: deleteStudentSuccess, isError: deleteStudentIsError, error: deleteStudentErrorData }] = useDeleteStudentMutation();
  const [deleteExam, { isLoading: isDeletingExam, isSuccess: deleteExamSuccess, isError: deleteExamIsError, error: deleteExamErrorData }] = useDeleteExamMutation();
  const [deleteAssignment, { isLoading: isDeletingAssignment, isSuccess: deleteAssignmentSuccess, isError: deleteAssignmentIsError, error: deleteAssignmentErrorData }] = useDeleteAssignmentMutation();
  const [deleteEvent, { isLoading: isDeletingEvent, isSuccess: deleteEventSuccess, isError: deleteEventIsError, error: deleteEventErrorData }] = useDeleteEventMutation();
  const [deleteAnnouncement, { isLoading: isDeletingAnnouncement, isSuccess: deleteAnnouncementSuccess, isError: deleteAnnouncementIsError, error: deleteAnnouncementErrorData }] = useDeleteAnnouncementMutation();
  const [deleteParent, { isLoading: isDeletingParent, isSuccess: deleteParentSuccess, isError: deleteParentIsError, error: deleteParentErrorData }] = useDeleteParentMutation();
  const [deleteLesson, { isLoading: isDeletingLesson, isSuccess: deleteLessonSuccess, isError: deleteLessonIsError, error: deleteLessonErrorData }] = useDeleteLessonMutation();
  const [deleteResult, { isLoading: isDeletingResult, isSuccess: deleteResultSuccess, isError: deleteResultIsError, error: deleteResultErrorData }] = useDeleteResultMutation();
  const [deleteAttendance, { isLoading: isDeletingAttendance, isSuccess: deleteAttendanceSuccess, isError: deleteAttendanceIsError, error: deleteAttendanceErrorData }] = useDeleteAttendanceMutation();
  const [deleteGrade, { isLoading: isDeletingGrade, isSuccess: deleteGradeSuccess, isError: deleteGradeIsError, error: deleteGradeErrorData }] = useDeleteGradeMutation(); 
  


  const getDeleteMutationHook = () => {
    switch (table) {
      case "subject": return { deleteEntity: deleteSubject, isLoading: isDeletingSubject, isSuccess: deleteSubjectSuccess, isError: deleteSubjectIsError, errorData: deleteSubjectErrorData };
      case "class": return { deleteEntity: deleteClass, isLoading: isDeletingClass, isSuccess: deleteClassSuccess, isError: deleteClassIsError, errorData: deleteClassErrorData };
      case "teacher": return { deleteEntity: deleteTeacher, isLoading: isDeletingTeacher, isSuccess: deleteTeacherSuccess, isError: deleteTeacherIsError, errorData: deleteTeacherErrorData };
      case "student": return { deleteEntity: deleteStudent, isLoading: isDeletingStudent, isSuccess: deleteStudentSuccess, isError: deleteStudentIsError, errorData: deleteStudentErrorData };
      case "exam": return { deleteEntity: deleteExam, isLoading: isDeletingExam, isSuccess: deleteExamSuccess, isError: deleteExamIsError, errorData: deleteExamErrorData };
      case "assignment": return { deleteEntity: deleteAssignment, isLoading: isDeletingAssignment, isSuccess: deleteAssignmentSuccess, isError: deleteAssignmentIsError, errorData: deleteAssignmentErrorData };
      case "event": return { deleteEntity: deleteEvent, isLoading: isDeletingEvent, isSuccess: deleteEventSuccess, isError: deleteEventIsError, errorData: deleteEventErrorData };
      case "announcement": return { deleteEntity: deleteAnnouncement, isLoading: isDeletingAnnouncement, isSuccess: deleteAnnouncementSuccess, isError: deleteAnnouncementIsError, errorData: deleteAnnouncementErrorData };
      case "parent": return { deleteEntity: deleteParent, isLoading: isDeletingParent, isSuccess: deleteParentSuccess, isError: deleteParentIsError, errorData: deleteParentErrorData };
      case "lesson": return { deleteEntity: deleteLesson, isLoading: isDeletingLesson, isSuccess: deleteLessonSuccess, isError: deleteLessonIsError, errorData: deleteLessonErrorData };
      case "result": return { deleteEntity: deleteResult, isLoading: isDeletingResult, isSuccess: deleteResultSuccess, isError: deleteResultIsError, errorData: deleteResultErrorData };
      case "attendance": return { deleteEntity: deleteAttendance, isLoading: isDeletingAttendance, isSuccess: deleteAttendanceSuccess, isError: deleteAttendanceIsError, errorData: deleteAttendanceErrorData };
      case "grade": return { deleteEntity: deleteGrade, isLoading: isDeletingGrade, isSuccess: deleteGradeSuccess, isError: deleteGradeIsError, errorData: deleteGradeErrorData }; 
      default: return { deleteEntity: async (idToDelete: number | string ) => { throw new Error("Fonction de suppression non configurée."); }, isLoading: false, isSuccess: false, isError: false, errorData: null };
    }
  };
  
  const currentDeleteMutation = getDeleteMutationHook();

  useEffect(() => {
    if (currentDeleteMutation.isSuccess) {
      toast({ title: `${table.charAt(0).toUpperCase() + table.slice(1)} a été supprimé(e) avec succès !` });
      setOpen(false);
      router.refresh(); 
    }
  }, [currentDeleteMutation.isSuccess, table, setOpen, router]); 

  useEffect(() => {
    if (currentDeleteMutation.isError && currentDeleteMutation.errorData) {
      const apiError = currentDeleteMutation.errorData as any;
      const errorMessage = apiError?.data?.message || "Échec de la suppression de l'élément.";
      toast({ variant: "destructive", title: "Échec de la Suppression", description: errorMessage });
    }
  }, [currentDeleteMutation.isError, currentDeleteMutation.errorData, table]); 


  const handleDelete = async () => {
    if (currentEntity && id !== undefined && id !== null) {
      try {
        await currentDeleteMutation.deleteEntity(id as any).unwrap();
      } catch (err) {
      }
    } else {
       toast({ variant: "destructive", title: "Erreur de Suppression", description: "Aucun élément sélectionné pour la suppression." });
    }
  };

  const RenderedForm = () => {
    if (type === "delete") {
      return (
        <div className="p-4 flex flex-col gap-4 items-center">
          <h2 className="text-lg font-semibold text-center">Confirmer la Suppression</h2>
          <p className="text-sm text-muted-foreground text-center">
            Êtes-vous sûr de vouloir supprimer cet élément ({table}) ? Cette action est irréversible.
          </p>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setOpen(false)} 
              className="px-4 py-2 rounded-md border bg-secondary hover:bg-secondary/80"
              disabled={currentDeleteMutation.isLoading}
            >
              Annuler
            </button>
            <button 
              onClick={handleDelete} 
              className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={currentDeleteMutation.isLoading}
            >
              {currentDeleteMutation.isLoading ? "Suppression..." : "Supprimer"}
            </button>
          </div>
          {currentDeleteMutation.isError && (
             <span className="text-destructive text-sm mt-2 text-center">
                Erreur: {(currentDeleteMutation.errorData as any)?.data?.message || "Une erreur s'est produite lors de la suppression."}
             </span>
          )}
        </div>
      );
    }
    
    const FormComponent = forms[table];
    if (FormComponent) {
      return FormComponent(setOpen, type, data, relatedData);
    }
    return <p>Formulaire non trouvé pour &quot;{table}&quot;</p>;
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} text-white hover:opacity-90 transition-opacity`}
        onClick={() => setOpen(true)}
        aria-label={`${type} ${table}`}
      >
        <Image src={`/${type}.png`} alt={`${type} icon`} width={type === "create" ? 18 : 16} height={type === "create" ? 18 : 16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-lg shadow-xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <RenderedForm />
            <button
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
              onClick={() => setOpen(false)}
              aria-label="Fermer le modal"
            >
              <Image src="/close.png" alt="Fermer" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
