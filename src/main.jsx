/* eslint-disable react-refresh/only-export-components */
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// CONTEXT
import { AuthProvider } from "./context/AuthProvider.jsx";

// LAYOUT
import App from "./App.jsx";
import "./App.css";

// ROUTE PROTECTION
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

import { PageLoader } from "./components/common/Loading.jsx";

// PUBLIC PAGES
const Home = lazy(() => import("./Pages/public/Home.jsx"));
const AboutUs = lazy(() => import("./Pages/public/About.jsx"));
const Contact = lazy(() => import("./Pages/public/Contact.jsx"));
const Gallery = lazy(() => import("./Pages/public/Gallery.jsx"));
const Program = lazy(() => import("./Pages/public/Program.jsx"));
const SecondaryEducation = lazy(() =>
  import("./Pages/public/SecondaryEducation.jsx")
);
const BasicEducation = lazy(() => import("./Pages/public/BasicEducation.jsx"));
const NurseryEducation = lazy(() =>
  import("./Pages/public/NurseryEducation.jsx")
);
const ComputerTraining = lazy(() =>
  import("./Pages/public/ComputerTraining.jsx")
);
const BoardingSchool = lazy(() => import("./Pages/public/BoardingSchool.jsx"));
const MusicAndArts = lazy(() => import("./Pages/public/MusicAndArts.jsx"));

// AUTH PAGES
const AdminLogin = lazy(() => import("./Pages/auth/AdminLogin.jsx"));
const StudentLogin = lazy(() => import("./Pages/auth/StudentLogin.jsx"));

// DASHBOARD PAGES
const StudentDashboard = lazy(() =>
  import("./Pages/student/StudentDashboard.jsx")
);
const StudentLayout = lazy(() => import("./Pages/student/StudentLayout.jsx"));
const StudentFees = lazy(() => import("./Pages/student/StudentFees.jsx"));
const StudentResult = lazy(() => import("./Pages/student/StudentResult.jsx"));
const StudentSettings = lazy(() =>
  import("./Pages/student/StudentSettings.jsx")
);
const TeacherLayout = lazy(() => import("./Pages/teacher/TeacherLayout.jsx"));
const TeacherBroadsheets = lazy(() =>
  import("./Pages/teacher/TeacherBroadsheets.jsx")
);
const TeacherClassResults = lazy(() =>
  import("./Pages/teacher/TeacherClassResults.jsx")
);
const TeacherCumulativeResults = lazy(() =>
  import("./Pages/teacher/TeacherCumulativeResults.jsx")
);
const TeacherClassList = lazy(() =>
  import("./Pages/teacher/TeacherClassList.jsx")
);
const TeacherSettings = lazy(() =>
  import("./Pages/teacher/TeacherSettings.jsx")
);
const AdminDashboard = lazy(() => import("./Pages/admin/AdminDashboard.jsx"));
const AdminLayout = lazy(() => import("./Pages/admin/AdminLayout.jsx"));
const ClassManagement = lazy(() =>
  import("./Pages/admin/ClassManagement.jsx")
);
const ClassCoverage = lazy(() => import("./Pages/admin/ClassCoverage.jsx"));
const StudentManagement = lazy(() =>
  import("./Pages/admin/StudentManagement.jsx")
);
const TeacherManagement = lazy(() =>
  import("./Pages/admin/TeacherManagement.jsx")
);
const UploadResult = lazy(() => import("./Pages/admin/UploadResult.jsx"));
const FeeManagement = lazy(() => import("./Pages/admin/FeeManagement.jsx"));
const BusManagement = lazy(() => import("./Pages/admin/BusManagement.jsx"));
const BoardingManagement = lazy(() =>
  import("./Pages/admin/BoardingManagement.jsx")
);
const PayrollManagement = lazy(() =>
  import("./Pages/admin/PayrollManagement.jsx")
);
const PortalVisibility = lazy(() =>
  import("./Pages/admin/PortalVisibility.jsx")
);
const PortalNotices = lazy(() =>
  import("./Pages/admin/PortalNotices.jsx")
);
const ExecutiveReportPortal = lazy(() =>
  import("./Pages/reports/ExecutiveReportPortal.jsx")
);

// ERROR PAGE
const PageNotFound = lazy(() => import("./Pages/public/PageNotFound.jsx"));

// Cache portal data briefly so returning to dashboards feels instant while still refreshing in the background.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});



// =========================
// ROUTER CONFIGURATION
// =========================

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <PageNotFound />,

    children: [
      // HOME PAGE
      {
        index: true,
        element: <Home />,
      },

      // PUBLIC PAGES
      {
        path: "about",
        element: <AboutUs />,
      },

      {
        path: "gallery",
        element: <Gallery />,
      },

      {
        path: "contact",
        element: <Contact />,
      },

      // PROGRAM ROUTES
      {
        path: "programs",
        element: <Program />,
      },

      {
        path: "programs/secondary-education",
        element: <SecondaryEducation />,
      },

      {
        path: "programs/basic-education",
        element: <BasicEducation />,
      },

      {
        path: "programs/nursery-education",
        element: <NurseryEducation />,
      },

      {
        path: "programs/computer-training",
        element: <ComputerTraining />,
      },

      {
        path: "programs/boarding-school",
        element: <BoardingSchool />,
      },

      {
        path: "programs/music-and-arts",
        element: <MusicAndArts />,
      },

      // 404 PAGE
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },

  {
        path: "login",
        element: <AdminLogin />,
  },
  {
        path: "secure-admin-login",
        element: <AdminLogin adminOnly />,
  },
  {
        path: "executive-login",
        element: <AdminLogin executiveOnly />,
  },
  {
        path: "student-login",
        element: <StudentLogin />,
  },

  // STUDENT DASHBOARD
      {
        path: "student",
        element: (
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <StudentDashboard />,
          },
          {
            path: "results",
            element: <StudentResult />,
          },
          {
            path: "fees",
            element: <StudentFees />,
          },
          {
            path: "settings",
            element: <StudentSettings />,
          },
        ],
      },

      // TEACHER DASHBOARD
      {
        path: "teacher",
        element: (
          <ProtectedRoute role="teacher">
            <TeacherLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <TeacherBroadsheets />,
          },
          {
            path: "class-results",
            element: <TeacherClassResults />,
          },
          {
            path: "cumulative-results",
            element: <TeacherCumulativeResults />,
          },
          {
            path: "class-list",
            element: <TeacherClassList />,
          },
          {
            path: "settings",
            element: <TeacherSettings />,
          },
        ],
      },

      // ADMIN DASHBOARD
      {
        path: "admin",
        element: (
          <ProtectedRoute role="admin" redirectTo="/secure-admin-login">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: "students",
            element: <StudentManagement />,
          },
          {
            path: "teachers",
            element: <TeacherManagement />,
          },
          {
            path: "classes",
            element: <ClassManagement />,
          },
          {
            path: "classes/:classId/coverage",
            element: <ClassCoverage />,
          },
          {
            path: "fees",
            element: <FeeManagement />,
          },
          {
            path: "buses",
            element: <BusManagement />,
          },
          {
            path: "boarding",
            element: <BoardingManagement />,
          },
          {
            path: "payroll",
            element: <PayrollManagement />,
          },
          {
            path: "reports",
            element: <ExecutiveReportPortal embedded page="all" />,
          },
          {
            path: "results",
            element: <UploadResult />,
          },
          {
            path: "portal-status",
            element: <PortalVisibility />,
          },
          {
            path: "portal-notices",
            element: <PortalNotices />,
          },
        ],
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute
            role={["admin", "principal", "chairman"]}
            redirectTo="/executive-login"
          >
            <ExecutiveReportPortal page="fee" />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports/fees",
        element: (
          <ProtectedRoute
            role={["admin", "principal", "chairman"]}
            redirectTo="/executive-login"
          >
            <ExecutiveReportPortal page="fee" />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports/buses",
        element: (
          <ProtectedRoute
            role={["admin", "principal", "chairman"]}
            redirectTo="/executive-login"
          >
            <ExecutiveReportPortal page="bus" />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports/boarding",
        element: (
          <ProtectedRoute
            role={["admin", "principal", "chairman"]}
            redirectTo="/executive-login"
          >
            <ExecutiveReportPortal page="boarding" />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports/payroll",
        element: (
          <ProtectedRoute
            role={["admin", "principal"]}
            redirectTo="/executive-login"
          >
            <ExecutiveReportPortal page="payroll" />
          </ProtectedRoute>
        ),
      },
]);



// =========================
// APPLICATION ROOT
// =========================

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<PageLoader message="Preparing your page..." />}>
          <RouterProvider
            router={router}
            fallbackElement={<PageLoader message="Preparing your page..." />}
          />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
