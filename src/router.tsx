import { createBrowserRouter } from "react-router-dom";
import { TeacherAppLayout } from "./layouts/TeacherAppLayout";
import { CollectResultsPage } from "./pages/CollectResultsPage";
import { CreateExamPage } from "./pages/CreateExamPage";
import { ExamDetailPage } from "./pages/ExamDetailPage";
import { ExamListPage } from "./pages/ExamListPage";
import { RecapPage } from "./pages/RecapPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TeacherAppLayout />,
    children: [
      {
        index: true,
        element: <ExamListPage />,
      },
      {
        path: "exams/new",
        element: <CreateExamPage />,
      },
      {
        path: "exams/:id",
        element: <ExamDetailPage />,
      },
      {
        path: "collect/:id",
        element: <CollectResultsPage />,
      },
      {
        path: "recap/:id",
        element: <RecapPage />,
      },
    ],
  },
]);
