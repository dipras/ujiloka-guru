import { useOutletContext } from "react-router-dom";
import type { useTeacherState } from "./useTeacherState";

export type TeacherContext = ReturnType<typeof useTeacherState>;

export function useTeacher() {
  return useOutletContext<TeacherContext>();
}
