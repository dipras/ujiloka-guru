import { createBrowserRouter } from "react-router-dom";
import { TeacherAppLayout } from "./layouts/TeacherAppLayout";
import { ExamActionSelectPage } from "./pages/ExamActionSelectPage";
import { CollectResultsPage } from "./pages/CollectResultsPage";
import { CreateExamPage } from "./pages/CreateExamPage";
import { ExamDetailPage } from "./pages/ExamDetailPage";
import { ExamListPage } from "./pages/ExamListPage";
import { RecapPage } from "./pages/RecapPage";
import { ResultDetailPage } from "./pages/ResultDetailPage";

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
        path: "exams/:id/results/:rid",
        element: <ResultDetailPage />,
      },
      {
        path: "collect",
        element: <ExamActionSelectPage mode="collect" />,
      },
      {
        path: "collect/:id",
        element: <CollectResultsPage />,
      },
      {
        path: "recap",
        element: <ExamActionSelectPage mode="recap" />,
      },
      {
        path: "recap/:id",
        element: <RecapPage />,
      },
    ],
  },
]);
