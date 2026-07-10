import { useEffect, useMemo, useState } from "react";
import { FaUsers } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { isFormTeacher } from "../../utils/teacherAssignments.js";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not available";

const getClassListErrorMessage = (requestError) => {
  if (requestError.response?.data?.message) {
    return requestError.response.data.message;
  }

  if (requestError.response?.data?.error) {
    return requestError.response.data.error;
  }

  if (requestError.response?.status === 404) {
    return "Class list service is not available yet. Please update or restart the backend API.";
  }

  if (!requestError.response) {
    return "Unable to reach the class list service. Check the API server or internet connection.";
  }

  return "Unable to load your class list.";
};

function TeacherClassList() {
  const { user } = useAuth();
  const [classRecord, setClassRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canViewClassList = user && isFormTeacher(user);

  useEffect(() => {
    if (!canViewClassList) {
      setLoading(false);
      return;
    }

    const fetchClassList = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/students/teacher/class-list");

        setClassRecord(response.data?.class_record || null);
        setStudents(response.data?.students || []);
      } catch (requestError) {
        setError(getClassListErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    fetchClassList();
  }, [canViewClassList]);

  const genderSummary = useMemo(() => {
    return students.reduce(
      (summary, student) => {
        const gender = student.gender || "Not Set";

        return {
          ...summary,
          [gender]: (summary[gender] || 0) + 1,
        };
      },
      {}
    );
  }, [students]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-8">
        <PortalWelcomeBanner
          icon={<FaUsers />}
          eyebrow="Form Teacher"
          title="Welcome,"
          name={user?.full_name || "Teacher"}
          description="View students currently registered under your assigned form class."
          metaItems={[
            {
              label: "Assigned Class",
              value: user?.assigned_class || classRecord?.name || "Not available",
            },
            {
              label: "Session",
              value: user?.session || classRecord?.session || "Not available",
            },
          ]}
        />
      </div>

      {!canViewClassList && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          Class list is available to form teachers only.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {canViewClassList && (
      <section className="rounded-lg bg-secondary p-5 shadow-lg sm:p-6">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {classRecord
                ? `${classRecord.name?.toUpperCase()} Students`
                : "Assigned Class Students"}
            </h3>
            <p className="mt-2 text-primary/70">
              {classRecord
                ? `${classRecord.session} - ${students.length} student${
                    students.length === 1 ? "" : "s"
                  }`
                : "Your assigned class students will appear here."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
            <div className="rounded-lg bg-primary/5 px-5 py-4 text-primary">
              <p className="text-xs font-bold uppercase text-primary/50">
                Total
              </p>
              <p className="mt-2 text-2xl font-extrabold">{students.length}</p>
            </div>
            {Object.entries(genderSummary).map(([gender, count]) => (
              <div
                key={gender}
                className="rounded-lg bg-primary/5 px-5 py-4 text-primary"
              >
                <p className="text-xs font-bold uppercase text-primary/50">
                  {gender}
                </p>
                <p className="mt-2 text-2xl font-extrabold">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Gender</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    Loading class list...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    No active student is currently registered in this class.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr
                    key={student._id}
                    className="text-primary/80 transition duration-300 hover:bg-primary/5"
                  >
                    <td className="px-5 py-4 font-bold text-primary">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">{student.admission_no}</td>
                    <td className="px-5 py-4">{student.gender || "Not set"}</td>
                    <td className="px-5 py-4">
                      {student.class?.toUpperCase() || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {formatDate(student.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}

export default TeacherClassList;

