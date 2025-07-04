
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// Import specific model types and enums from your centralized types file
import type { 
    Subject, Class, Teacher, Student, Parent, Lesson, Exam, Assignment, Event, Announcement, Result, Attendance, Role, Grade
} from '@/types/index'; 
// Import schema types for request bodies
import type {
  SubjectSchema,
  ClassSchema,
  TeacherSchema,
  StudentSchema,
  ParentSchema,
  LessonSchema,
  ExamSchema,
  AssignmentSchema,
  EventSchema,
  AnnouncementSchema,
  ResultSchema,
  AttendanceSchema,
  GradeSchema
} from '@/lib/formValidationSchemas';

const entityConfig: { [key: string]: { route: string, tag: string } } = {
  subject: { route: 'subjects', tag: 'Subject' },
  class: { route: 'classes', tag: 'Class' },
  teacher: { route: 'teachers', tag: 'Teacher' },
  student: { route: 'students', tag: 'Student' },
  parent: { route: 'parents', tag: 'Parent' },
  lesson: { route: 'lessons', tag: 'Lesson' },
  exam: { route: 'exams', tag: 'Exam' },
  assignment: { route: 'assignments', tag: 'Assignment' },
  event: { route: 'events', tag: 'Event' },
  announcement: { route: 'announcements', tag: 'Announcement' },
  result: { route: 'results', tag: 'Result' },
  attendance: { route: 'attendances', tag: 'Attendance' },
  grade: { route: 'grades', tag: 'Grade' },
};

export const entityApi = createApi({
  reducerPath: 'entityApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Changed base URL
  tagTypes: Object.values(entityConfig).map(e => e.tag),
  endpoints: (builder) => ({
    
    // Grades
    getGrades: builder.query<Grade[], void>({
      query: () => `api/${entityConfig.grade.route}`, // Added api/ prefix
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.grade.tag, id } as const)), { type: entityConfig.grade.tag, id: 'LIST' }] : [{ type: entityConfig.grade.tag, id: 'LIST' }],
    }),
    createGrade: builder.mutation<Grade, GradeSchema>({
      query: (body) => ({
        url: `api/${entityConfig.grade.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.grade.tag, id: 'LIST' }],
    }),
    updateGrade: builder.mutation<Grade, GradeSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.grade.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.grade.tag, id }, { type: entityConfig.grade.tag, id: 'LIST' }],
    }),
    deleteGrade: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.grade.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.grade.tag, id }, { type: entityConfig.grade.tag, id: 'LIST' }],
    }),

    // Subjects
    getSubjects: builder.query<Subject[], void>({
      query: () => `api/${entityConfig.subject.route}`, // Added api/ prefix
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.subject.tag, id } as const)), { type: entityConfig.subject.tag, id: 'LIST' }] : [{ type: entityConfig.subject.tag, id: 'LIST' }],
    }),
    createSubject: builder.mutation<Subject, SubjectSchema>({
      query: (body) => ({
        url: `api/${entityConfig.subject.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.subject.tag, id: 'LIST' }],
    }),
    updateSubject: builder.mutation<Subject, SubjectSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.subject.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.subject.tag, id }, { type: entityConfig.subject.tag, id: 'LIST' }],
    }),
    deleteSubject: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.subject.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.subject.tag, id }, { type: entityConfig.subject.tag, id: 'LIST' }],
    }),

    // Classes
    getClasses: builder.query<Class[], void>({
      query: () => `api/${entityConfig.class.route}`, // Added api/ prefix
      providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.class.tag, id } as const)), { type: entityConfig.class.tag, id: 'LIST' }] : [{ type: entityConfig.class.tag, id: 'LIST' }],
    }),
    createClass: builder.mutation<Class, ClassSchema>({
      query: (body) => ({
        url: `api/${entityConfig.class.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.class.tag, id: 'LIST' }],
    }),
    updateClass: builder.mutation<Class, ClassSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.class.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.class.tag, id }, { type: entityConfig.class.tag, id: 'LIST' }],
    }),
    deleteClass: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.class.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.class.tag, id }, { type: entityConfig.class.tag, id: 'LIST' }],
    }),

    // Teachers
    getTeachers: builder.query<Teacher[], void>({
        query: () => `api/${entityConfig.teacher.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.teacher.tag, id } as const)), { type: entityConfig.teacher.tag, id: 'LIST' }] : [{ type: entityConfig.teacher.tag, id: 'LIST' }],
    }),
    createTeacher: builder.mutation<Teacher, TeacherSchema>({
      query: (body) => ({
        url: `api/${entityConfig.teacher.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.teacher.tag, id: 'LIST' }],
    }),
    updateTeacher: builder.mutation<Teacher, TeacherSchema & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.teacher.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.teacher.tag, id }, { type: entityConfig.teacher.tag, id: 'LIST' }],
    }),
    deleteTeacher: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `api/${entityConfig.teacher.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.teacher.tag, id }, { type: entityConfig.teacher.tag, id: 'LIST' }],
    }),

    // Students
    getStudents: builder.query<Student[], void>({
        query: () => `api/${entityConfig.student.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.student.tag, id } as const)), { type: entityConfig.student.tag, id: 'LIST' }] : [{ type: entityConfig.student.tag, id: 'LIST' }],
    }),
    createStudent: builder.mutation<Student, StudentSchema>({
      query: (body) => ({
        url: `api/${entityConfig.student.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.student.tag, id: 'LIST' }],
    }),
    updateStudent: builder.mutation<Student, StudentSchema & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.student.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.student.tag, id }, { type: entityConfig.student.tag, id: 'LIST' }],
    }),
    deleteStudent: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `api/${entityConfig.student.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.student.tag, id }, { type: entityConfig.student.tag, id: 'LIST' }],
    }),

    // Exams
    getExams: builder.query<Exam[], void>({
        query: () => `api/${entityConfig.exam.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.exam.tag, id } as const)), { type: entityConfig.exam.tag, id: 'LIST' }] : [{ type: entityConfig.exam.tag, id: 'LIST' }],
    }),
    createExam: builder.mutation<Exam, ExamSchema>({
      query: (body) => ({
        url: `api/${entityConfig.exam.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.exam.tag, id: 'LIST' }],
    }),
    updateExam: builder.mutation<Exam, ExamSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.exam.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.exam.tag, id }, { type: entityConfig.exam.tag, id: 'LIST' }],
    }),
    deleteExam: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.exam.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.exam.tag, id }, { type: entityConfig.exam.tag, id: 'LIST' }],
    }),

    // Assignments
    getAssignments: builder.query<Assignment[], void>({
        query: () => `api/${entityConfig.assignment.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.assignment.tag, id } as const)), { type: entityConfig.assignment.tag, id: 'LIST' }] : [{ type: entityConfig.assignment.tag, id: 'LIST' }],
    }),
    createAssignment: builder.mutation<Assignment, AssignmentSchema>({
      query: (body) => ({
        url: `api/${entityConfig.assignment.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.assignment.tag, id: 'LIST' }],
    }),
    updateAssignment: builder.mutation<Assignment, AssignmentSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.assignment.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.assignment.tag, id }, { type: entityConfig.assignment.tag, id: 'LIST' }],
    }),
    deleteAssignment: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.assignment.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.assignment.tag, id }, { type: entityConfig.assignment.tag, id: 'LIST' }],
    }),

    // Events
    getEvents: builder.query<Event[], void>({
        query: () => `api/${entityConfig.event.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.event.tag, id } as const)), { type: entityConfig.event.tag, id: 'LIST' }] : [{ type: entityConfig.event.tag, id: 'LIST' }],
    }),
    createEvent: builder.mutation<Event, EventSchema>({
      query: (body) => ({
        url: `api/${entityConfig.event.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.event.tag, id: 'LIST' }],
    }),
    updateEvent: builder.mutation<Event, EventSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.event.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.event.tag, id }, { type: entityConfig.event.tag, id: 'LIST' }],
    }),
    deleteEvent: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.event.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.event.tag, id }, { type: entityConfig.event.tag, id: 'LIST' }],
    }),

    // Announcements
    getAnnouncements: builder.query<Announcement[], void>({
        query: () => `api/${entityConfig.announcement.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.announcement.tag, id } as const)), { type: entityConfig.announcement.tag, id: 'LIST' }] : [{ type: entityConfig.announcement.tag, id: 'LIST' }],
    }),
    createAnnouncement: builder.mutation<Announcement, AnnouncementSchema>({
      query: (body) => ({
        url: `api/${entityConfig.announcement.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.announcement.tag, id: 'LIST' }],
    }),
    updateAnnouncement: builder.mutation<Announcement, AnnouncementSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.announcement.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.announcement.tag, id }, { type: entityConfig.announcement.tag, id: 'LIST' }],
    }),
    deleteAnnouncement: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.announcement.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.announcement.tag, id }, { type: entityConfig.announcement.tag, id: 'LIST' }],
    }),
    
    // Parents
    getParents: builder.query<Parent[], void>({
        query: () => `api/${entityConfig.parent.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.parent.tag, id } as const)), { type: entityConfig.parent.tag, id: 'LIST' }] : [{ type: entityConfig.parent.tag, id: 'LIST' }],
    }),
    createParent: builder.mutation<Parent, ParentSchema>({
      query: (body) => ({
        url: `api/${entityConfig.parent.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.parent.tag, id: 'LIST' }],
    }),
    updateParent: builder.mutation<Parent, ParentSchema & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.parent.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.parent.tag, id }, { type: entityConfig.parent.tag, id: 'LIST' }],
    }),
    deleteParent: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `api/${entityConfig.parent.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.parent.tag, id }, { type: entityConfig.parent.tag, id: 'LIST' }],
    }),

    // Lessons
    getLessons: builder.query<Lesson[], void>({
        query: () => `api/${entityConfig.lesson.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.lesson.tag, id } as const)), { type: entityConfig.lesson.tag, id: 'LIST' }] : [{ type: entityConfig.lesson.tag, id: 'LIST' }],
    }),
    createLesson: builder.mutation<Lesson, LessonSchema>({
      query: (body) => ({
        url: `api/${entityConfig.lesson.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.lesson.tag, id: 'LIST' }],
    }),
    updateLesson: builder.mutation<Lesson, LessonSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.lesson.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.lesson.tag, id }, { type: entityConfig.lesson.tag, id: 'LIST' }],
    }),
    deleteLesson: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.lesson.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.lesson.tag, id }, { type: entityConfig.lesson.tag, id: 'LIST' }],
    }),

    // Results
    getResults: builder.query<Result[], void>({
        query: () => `api/${entityConfig.result.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.result.tag, id } as const)), { type: entityConfig.result.tag, id: 'LIST' }] : [{ type: entityConfig.result.tag, id: 'LIST' }],
    }),
    createResult: builder.mutation<Result, ResultSchema>({
      query: (body) => ({
        url: `api/${entityConfig.result.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.result.tag, id: 'LIST' }],
    }),
    updateResult: builder.mutation<Result, ResultSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.result.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.result.tag, id }, { type: entityConfig.result.tag, id: 'LIST' }],
    }),
    deleteResult: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.result.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.result.tag, id }, { type: entityConfig.result.tag, id: 'LIST' }],
    }),
    
    // Attendances
    getAttendances: builder.query<Attendance[], void>({
        query: () => `api/${entityConfig.attendance.route}`, // Added api/ prefix
        providesTags: (result) => result ? [...result.map(({ id }) => ({ type: entityConfig.attendance.tag, id } as const)), { type: entityConfig.attendance.tag, id: 'LIST' }] : [{ type: entityConfig.attendance.tag, id: 'LIST' }],
    }),
    createAttendance: builder.mutation<Attendance, AttendanceSchema>({
      query: (body) => ({
        url: `api/${entityConfig.attendance.route}`, // Added api/ prefix
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: entityConfig.attendance.tag, id: 'LIST' }],
    }),
    updateAttendance: builder.mutation<Attendance, AttendanceSchema & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `api/${entityConfig.attendance.route}/${id}`, // Added api/ prefix
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: entityConfig.attendance.tag, id }, { type: entityConfig.attendance.tag, id: 'LIST' }],
    }),
    deleteAttendance: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `api/${entityConfig.attendance.route}/${id}`, // Added api/ prefix
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: entityConfig.attendance.tag, id }, { type: entityConfig.attendance.tag, id: 'LIST' }],
    }),

  }),
});

export const {
  useGetGradesQuery, useCreateGradeMutation, useUpdateGradeMutation, useDeleteGradeMutation,
  useGetSubjectsQuery, useCreateSubjectMutation, useUpdateSubjectMutation, useDeleteSubjectMutation,
  useGetClassesQuery, useCreateClassMutation, useUpdateClassMutation, useDeleteClassMutation,
  useGetTeachersQuery, useCreateTeacherMutation, useUpdateTeacherMutation, useDeleteTeacherMutation,
  useGetStudentsQuery, useCreateStudentMutation, useUpdateStudentMutation, useDeleteStudentMutation,
  useGetParentsQuery, useCreateParentMutation, useUpdateParentMutation, useDeleteParentMutation,
  useGetLessonsQuery, useCreateLessonMutation, useUpdateLessonMutation, useDeleteLessonMutation,
  useGetExamsQuery, useCreateExamMutation, useUpdateExamMutation, useDeleteExamMutation,
  useGetAssignmentsQuery, useCreateAssignmentMutation, useUpdateAssignmentMutation, useDeleteAssignmentMutation,
  useGetEventsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
  useGetAnnouncementsQuery, useCreateAnnouncementMutation, useUpdateAnnouncementMutation, useDeleteAnnouncementMutation,
  useGetResultsQuery, useCreateResultMutation, useUpdateResultMutation, useDeleteResultMutation,
  useGetAttendancesQuery, useCreateAttendanceMutation, useUpdateAttendanceMutation, useDeleteAttendanceMutation,
} = entityApi;
