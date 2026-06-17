import { createBrowserRouter } from "react-router-dom";
import { TeacherMvpPage } from "./screens/TeacherMvpPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TeacherMvpPage />,
  },
]);
