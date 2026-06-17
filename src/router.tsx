import { createBrowserRouter } from "react-router-dom";
import {
  CollectResultsPage,
  CreateExamPage,
  DistributeQrPage,
  RecapPage,
  TeacherAppLayout,
} from "./screens/TeacherApp";

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
