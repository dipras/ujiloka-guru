import { createBrowserRouter } from "react-router-dom";
import { TeacherAppLayout } from "./layouts/TeacherAppLayout";
import { CollectResultsPage } from "./pages/CollectResultsPage";
import { CreateExamPage } from "./pages/CreateExamPage";
import { DistributeQrPage } from "./pages/DistributeQrPage";
import { RecapPage } from "./pages/RecapPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <TeacherAppLayout />,
    children: [
      {
        index: true,
        element: <CreateExamPage />,
      },
      {
        path: "qr",
        element: <DistributeQrPage />,
      },
      {
        path: "collect",
        element: <CollectResultsPage />,
      },
      {
        path: "recap",
        element: <RecapPage />,
      },
    ],
  },
]);
