import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaArrowRotateRight,
  FaClockRotateLeft,
  FaFilter,
  FaRightFromBracket,
  FaRightToBracket,
  FaUserShield,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { CardSkeleton } from "../../components/common/Loading.jsx";

const roleOptions = [
  { label: "All users", value: "" },
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Admins", value: "admin" },
  { label: "Principals", value: "principal" },
  { label: "Chairmen", value: "chairman" },
];

const actionOptions = [
  { label: "All activity", value: "" },
  { label: "Logins", value: "login" },
  { label: "Logouts", value: "logout" },
];

const formatDateTime = (value) => {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatRole = (role = "") =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const fetchAuthActivity = async (filters) => {
  const response = await API.get("/auth-activity", {
    params: {
      ...filters,
      limit: 100,
    },
  });

  return response.data;
};

function AuthActivity() {
  const [filters, setFilters] = useState({
    role: "",
    action: "",
    date_from: "",
    date_to: "",
  });
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState("");

  const queryKey = useMemo(() => ["auth-activity", filters], [filters]);
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchAuthActivity(filters),
    staleTime: 1000 * 30,
  });

  const records = data?.records || [];
  const total = data?.total || 0;
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load login activity.";
  const status =
    error && !isFetching && dismissedErrorMessage !== errorMessage
      ? {
          type: "error",
          message: errorMessage,
        }
      : {
          type: "",
          message: "",
        };

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setDismissedErrorMessage(status.message)}
      />

      <section className="rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <FaClockRotateLeft className="text-button" />
              Login Audit Trail
            </div>
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              Staff, Student, and Executive Activity
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-primary/65">
              Review recent successful login and logout events with date, time,
              account type, device, and network details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-button px-5 py-3 font-bold text-secondary shadow-md transition duration-300 hover:scale-[1.02]"
          >
            <FaArrowRotateRight />
            Refresh
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg">
        <div className="mb-5 flex items-center gap-3 text-primary">
          <FaFilter className="text-button" />
          <h3 className="text-lg font-extrabold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/65">
              User type
            </label>
            <select
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {roleOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/65">
              Activity
            </label>
            <select
              value={filters.action}
              onChange={(event) => updateFilter("action", event.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {actionOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/65">
              From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) => updateFilter("date_from", event.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition focus:border-button focus:ring-2 focus:ring-button/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/65">
              To
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => updateFilter("date_to", event.target.value)}
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition focus:border-button focus:ring-2 focus:ring-button/20"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-primary">
              Recent Activity
            </h3>
            <p className="mt-1 text-sm font-semibold text-primary/60">
              Showing {records.length.toLocaleString()} of{" "}
              {total.toLocaleString()} recorded event
              {total === 1 ? "" : "s"}.
            </p>
          </div>
          {isFetching && (
            <p className="text-sm font-bold text-button">Refreshing...</p>
          )}
        </div>

        {isLoading ? (
          <CardSkeleton count={6} />
        ) : records.length === 0 ? (
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-6 text-center font-semibold text-primary/65">
            No login activity matches the selected filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-primary/10">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.7fr_1fr_1.2fr] gap-4 bg-primary/10 px-5 py-4 text-sm font-bold uppercase text-primary/60 xl:grid">
              <span>User</span>
              <span>Role</span>
              <span>Action</span>
              <span>Date and Time</span>
              <span>Device</span>
            </div>

            <div className="divide-y divide-primary/10">
              {records.map((record) => (
                <article
                  key={record._id}
                  className="grid grid-cols-1 gap-4 bg-primary/5 px-5 py-4 text-primary transition hover:bg-primary/10 xl:grid-cols-[1.2fr_0.8fr_0.7fr_1fr_1.2fr] xl:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">
                      {record.display_name || "Unknown user"}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-primary/55">
                      {record.identifier || record.user}
                    </p>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-primary">
                    <FaUserShield className="text-button" />
                    {formatRole(record.role)}
                  </div>

                  <div
                    className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                      record.action === "login"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {record.action === "login" ? (
                      <FaRightToBracket />
                    ) : (
                      <FaRightFromBracket />
                    )}
                    {record.action === "login" ? "Login" : "Logout"}
                  </div>

                  <p className="font-semibold text-primary/75">
                    {formatDateTime(record.occurred_at)}
                  </p>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary/70">
                      {record.user_agent || "Device not available"}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-primary/45">
                      {record.ip_address || "IP not available"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AuthActivity;
