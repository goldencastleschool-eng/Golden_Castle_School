import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaClipboardCheck,
  FaFileCircleCheck,
  FaTriangleExclamation,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const getRecordId = (record) => record?._id || record || "";

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

const TERM_ORDER = ["First Term", "Second Term", "Third Term"];

const getTermIndex = (term = "") => {
  const termIndex = TERM_ORDER.indexOf(term);

  return termIndex === -1 ? TERM_ORDER.length : termIndex;
};

const getStudentEffectiveTermEnrollment = (student, session, term) => {
  const enrollments = Array.isArray(student?.fee_enrollments)
    ? student.fee_enrollments
    : [];
  const targetTermIndex = getTermIndex(term);

  return enrollments
    .filter(
      (enrollment) =>
        enrollment.session === session &&
        getTermIndex(enrollment.term) <= targetTermIndex
    )
    .sort(
      (firstEnrollment, secondEnrollment) =>
        getTermIndex(secondEnrollment.term) - getTermIndex(firstEnrollment.term)
    )[0];
};

const studentBelongsToEffectiveTermClass = (
  student,
  classRecord,
  session,
  term
) => {
  const enrollment = getStudentEffectiveTermEnrollment(student, session, term);

  if (!enrollment || !classRecord) {
    return false;
  }

  return (
    getRecordId(enrollment.class_record) === getRecordId(classRecord) ||
    normalizeClassName(enrollment.class) === normalizeClassName(classRecord.name)
  );
};

function ClassCoverage() {
  const { classId } = useParams();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [access, setAccess] = useState({
    session: "",
    term: "",
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        setLoading(true);
        setStatus({ type: "", message: "" });

        const [classesResponse, studentsResponse, resultsResponse, accessResponse] =
          await Promise.all([
            API.get("/classes"),
            API.get("/students"),
            API.get("/results"),
            API.get("/result-access"),
          ]);

        setClasses(classesResponse.data || []);
        setStudents(studentsResponse.data || []);
        setResults(resultsResponse.data || []);
        setAccess({
          session: accessResponse.data?.session || "",
          term: accessResponse.data?.term || "",
        });
      } catch (requestError) {
        setStatus({
          type: "error",
          message:
            requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load class coverage.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCoverage();
  }, []);

  const classRecord = useMemo(
    () => classes.find((item) => item._id === classId),
    [classId, classes]
  );

  const classStudents = useMemo(() => {
    if (!classRecord || !access.term) {
      return [];
    }

    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        studentBelongsToEffectiveTermClass(
          student,
          classRecord,
          classRecord.session,
          access.term
        )
    );
  }, [access.term, classRecord, students]);

  const activeResults = useMemo(() => {
    if (!classRecord || !access.term) {
      return [];
    }

    return results.filter(
      (result) =>
        (getRecordId(result.class_record) === getRecordId(classRecord) ||
          normalizeClassName(result.class) ===
            normalizeClassName(classRecord.name)) &&
        result.session === classRecord.session &&
        result.term === access.term
    );
  }, [access.term, classRecord, results]);

  const uploadedStudentIds = useMemo(
    () =>
      new Set(
        activeResults.map((result) => result.student?._id || result.student)
      ),
    [activeResults]
  );

  const uploadedStudents = useMemo(
    () => classStudents.filter((student) => uploadedStudentIds.has(student._id)),
    [classStudents, uploadedStudentIds]
  );

  const missingStudents = useMemo(
    () => classStudents.filter((student) => !uploadedStudentIds.has(student._id)),
    [classStudents, uploadedStudentIds]
  );

  const coveragePercent = classStudents.length
    ? Math.round((uploadedStudents.length / classStudents.length) * 100)
    : 0;

  const statCards = [
    {
      title: "Registered Students",
      value: classStudents.length,
      icon: <FaUsers />,
    },
    {
      title: "Results Uploaded",
      value: uploadedStudents.length,
      icon: <FaFileCircleCheck />,
    },
    {
      title: "Awaiting Upload",
      value: missingStudents.length,
      icon: <FaTriangleExclamation />,
    },
  ];

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mb-8">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-3 rounded-lg bg-secondary px-5 py-3 font-bold text-primary shadow-lg transition duration-300 hover:bg-button hover:text-secondary"
        >
          <FaArrowLeft />
          Overview
        </Link>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaClipboardCheck />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          {classRecord ? `${classRecord.name.toUpperCase()} Coverage` : "Class Coverage"}
        </h2>
        <p className="mt-3 max-w-3xl text-secondary/75">
          Result upload status for{" "}
          {access.session && access.term
            ? `${classRecord?.session || access.session} - ${access.term}`
            : "the active session and term"}
          . This page follows the class record, so class CRUD changes are reflected
          here automatically.
        </p>
      </div>

      {!loading && !classRecord ? (
        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-3xl font-extrabold text-primary">
            Class Not Found
          </h3>
          <p className="mt-3 text-primary/70">
            This class may have been deleted from class management.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-lg bg-secondary p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-primary/50">
                  Upload Coverage
                </p>
                <h3 className="mt-3 text-4xl font-extrabold text-primary">
                  {loading ? "..." : `${coveragePercent}%`}
                </h3>
                <div className="mt-6 h-4 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-button transition-all duration-500"
                    style={{ width: `${coveragePercent}%` }}
                  ></div>
                </div>
              </div>

              <Link
                to="/admin/results"
                className="flex items-center justify-center rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02]"
              >
                Upload Result
              </Link>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-lg bg-secondary p-5 shadow-md"
              >
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="font-medium text-primary/70">{card.title}</p>
                    <h3 className="mt-4 text-3xl font-extrabold text-primary">
                      {loading ? "..." : card.value}
                    </h3>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
            <div className="mb-6">
              <h3 className="text-3xl font-extrabold text-primary">
                Students Awaiting Result Upload
              </h3>
              <p className="mt-2 text-primary/70">
                These students are registered in this class but do not yet have
                a result for the active session and term.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-primary/10">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4 font-bold">S/N</th>
                    <th className="px-5 py-4 font-bold">Student</th>
                    <th className="px-5 py-4 font-bold">Admission No.</th>
                    <th className="px-5 py-4 font-bold">Gender</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {loading ? (
                    <TableSkeleton columns={5} />
                  ) : missingStudents.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="5">
                        Every registered student in this class has a result for
                        this session and term.
                      </td>
                    </tr>
                  ) : (
                    missingStudents.map((student, index) => (
                      <tr key={student._id} className="text-primary/80">
                        <td className="px-5 py-4 font-bold text-primary">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4 font-semibold text-primary">
                          {student.full_name}
                        </td>
                        <td className="px-5 py-4">{student.admission_no}</td>
                        <td className="px-5 py-4">
                          {student.gender || "Not set"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-700">
                            Awaiting Upload
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ClassCoverage;

