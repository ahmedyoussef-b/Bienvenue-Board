
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import authReducer from './slices/authSlice';
import { entityApi } from './api/entityApi';
import classesReducer from './features/classes/classesSlice';
import subjectsReducer from './features/subjects/subjectsSlice';
import teachersReducer from './features/teachers/teachersSlice';
import classroomsReducer from './features/classrooms/classroomsSlice';
import scheduleReducer from './features/schedule/scheduleSlice';
import sessionReducer from './slices/sessionSlice';
import notificationReducer from './slices/notificationSlice';
import reportReducer from './slices/reportSlice';
import lessonRequirementsReducer from './features/lessonRequirements/lessonRequirementsSlice';
import gradesReducer from './features/grades/gradesSlice';
import teacherConstraintsReducer from './features/teacherConstraintsSlice';
import subjectRequirementsReducer from './features/subjectRequirementsSlice';
import teacherAssignmentsReducer from './features/teacherAssignmentsSlice';
import schoolConfigReducer from './features/schoolConfigSlice';
import scheduleDraftReducer from './features/scheduleDraftSlice';


export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [entityApi.reducerPath]: entityApi.reducer,
    auth: authReducer,
    classes: classesReducer,
    subjects: subjectsReducer,
    teachers: teachersReducer,
    classrooms: classroomsReducer,
    schedule: scheduleReducer,
    session: sessionReducer,
    notifications: notificationReducer,
    reports: reportReducer,
    lessonRequirements: lessonRequirementsReducer,
    grades: gradesReducer,
    teacherConstraints: teacherConstraintsReducer,
    subjectRequirements: subjectRequirementsReducer,
    teacherAssignments: teacherAssignmentsReducer,
    schoolConfig: schoolConfigReducer,
    scheduleDraft: scheduleDraftReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(entityApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
