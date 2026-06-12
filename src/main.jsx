import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// CONTEXT
import { AuthProvider } from "./context/AuthProvider.jsx";

// LAYOUT
import App from "./App.jsx";
import "./App.css";

// PUBLIC PAGES
import Home from "./Pages/public/Home.jsx";
import AboutUs from "./Pages/public/About.jsx";
import Contact from "./Pages/public/Contact.jsx";
import Gallery from "./Pages/public/Gallery.jsx";
import Program from "./Pages/public/Program.jsx";

import SecondaryEducation from "./Pages/public/SecondaryEducation.jsx";
import BasicEducation from "./Pages/public/BasicEducation.jsx";
import NurseryEducation from "./Pages/public/NurseryEducation.jsx";
import ComputerTraining from "./Pages/public/ComputerTraining.jsx";
import BoardingSchool from "./Pages/public/BoardingSchool.jsx";
import MusicAndArts from "./Pages/public/MusicAndArts.jsx";

// AUTH PAGES
import AdminLogin from "./Pages/auth/AdminLogin.jsx";
import StudentLogin from "./Pages/auth/StudentLogin.jsx";

// DASHBOARD PAGES
import StudentDashboard from "./Pages/student/StudentDashboard.jsx";
import StudentLayout from "./Pages/student/StudentLayout.jsx";
import StudentFees from "./Pages/student/StudentFees.jsx";
import StudentResult from "./Pages/student/StudentResult.jsx";
import StudentCumulativeResult from "./Pages/student/StudentCumulativeResult.jsx";
import StudentSettings from "./Pages/student/StudentSettings.jsx";
import TeacherLayout from "./Pages/teacher/TeacherLayout.jsx";
import TeacherBroadsheets from "./Pages/teacher/TeacherBroadsheets.jsx";
import TeacherClassResults from "./Pages/teacher/TeacherClassResults.jsx";
import TeacherClassList from "./Pages/teacher/TeacherClassList.jsx";
import TeacherSettings from "./Pages/teacher/TeacherSettings.jsx";
import AdminDashboard from "./Pages/admin/AdminDashboard.jsx";
import AdminLayout from "./Pages/admin/AdminLayout.jsx";
import ClassManagement from "./Pages/admin/ClassManagement.jsx";
import ClassCoverage from "./Pages/admin/ClassCoverage.jsx";
import StudentManagement from "./Pages/admin/StudentManagement.jsx";
import TeacherManagement from "./Pages/admin/TeacherManagement.jsx";
import UploadResult from "./Pages/admin/UploadResult.jsx";
import FeeManagement from "./Pages/admin/FeeManagement.jsx";
import PortalVisibility from "./Pages/admin/PortalVisibility.jsx";

// ROUTE PROTECTION
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// ERROR PAGE
import PageNotFound from "./Pages/public/PageNotFound.jsx";



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
            path: "cumulative-results",
            element: <StudentCumulativeResult />,
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
          <ProtectedRoute role="admin">
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
            path: "results",
            element: <UploadResult />,
          },
          {
            path: "portal-status",
            element: <PortalVisibility />,
          },
        ],
      },
]);



// =========================
// APPLICATION ROOT
// =========================

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
