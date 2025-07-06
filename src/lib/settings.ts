import { Role } from "@/types/index"; // Use Role type from centralized source

// Define RouteAccessMap using string literals that are compatible with the Role type.
// Role type (from @/types/index.ts, sourced from @prisma/client) is a union of string literals.
type RouteAccessMap = {
  [key: string]: Role[]; 
};

// Values used here must match the string values of the Role enum
export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": [Role.ADMIN],
  "/student(.*)": [Role.STUDENT],
  "/teacher(.*)": [Role.TEACHER],
  "/parent(.*)": [Role.PARENT],
  "/list/teachers": [Role.ADMIN, Role.TEACHER],
  "/list/students": [Role.ADMIN, Role.TEACHER],
  "/list/parents": [Role.ADMIN, Role.TEACHER],
  "/list/subjects": [Role.ADMIN],
  "/list/classes": [Role.ADMIN, Role.TEACHER],
  "/list/lessons": [Role.ADMIN, Role.TEACHER], 
  "/list/exams": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/list/assignments": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/list/results": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/list/attendance": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], 
  "/list/events": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/list/announcements": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/list/messages": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], 
  "/profile(.*)": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  "/settings(.*)": [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
};
