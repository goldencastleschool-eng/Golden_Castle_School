import { useEffect, useMemo, useState } from "react";
import {
  FaBullhorn,
  FaCircleCheck,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const emptyForm = {
  title: "",
  message: "",
  portal: "both",
  is_active: true,
  starts_at: "",
  ends_at: "",
};

const formatDateTimeLocal = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const formatNoticeDate = (value) =>
  value ? new Date(value).toLocaleString() : "No limit";

function PortalNotices() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const activeNotices = useMemo(
    () => notices.filter((notice) => notice.is_active),
    [notices]
  );

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await API.get("/portal-notices/admin");
      setNotices(response.data || []);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load portal notices.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id);
    setForm({
      title: notice.title || "",
      message: notice.message || "",
      portal: notice.portal || "both",
      is_active: Boolean(notice.is_active),
      starts_at: formatDateTimeLocal(notice.starts_at),
      ends_at: formatDateTimeLocal(notice.ends_at),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setStatus({ type: "", message: "" });

      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };

      if (editingId) {
        await API.put(`/portal-notices/admin/${editingId}`, payload);
      } else {
        await API.post("/portal-notices/admin", payload);
      }

      setStatus({
        type: "success",
        message: editingId
          ? "Portal notice updated successfully."
          : "Portal notice created successfully.",
      });
      resetForm();
      await fetchNotices();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to save portal notice.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (notice) => {
    setDeleteTarget(notice);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    try {
      setDeleting(true);
      await API.delete(`/portal-notices/admin/${deleteTarget._id}`);
      setStatus({
        type: "success",
        message: "Portal notice deleted successfully.",
      });
      await fetchNotices();

      if (editingId === deleteTarget._id) {
        resetForm();
      }

      setDeleteTarget(null);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to delete portal notice.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete Portal Notice"
        message="This will permanently delete the notice and its read confirmations."
        details={deleteTarget?.title || ""}
        confirmLabel="Delete Notice"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
            <FaBullhorn />
          </div>
          <h2 className="text-3xl font-extrabold text-secondary">
            Portal Notices
          </h2>
          <p className="mt-3 max-w-3xl text-secondary/75">
            Publish notices students and teachers must read before entering their portals.
          </p>
        </div>

        <div className="rounded-lg bg-secondary px-5 py-4 shadow-md">
          <p className="text-sm font-bold uppercase text-primary/60">
            Active Notices
          </p>
          <p className="mt-2 text-3xl font-extrabold text-primary">
            {loading ? "..." : activeNotices.length}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-button">
              {editingId ? "Edit Notice" : "New Notice"}
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-primary">
              {editingId ? "Update mandatory notice" : "Create mandatory notice"}
            </h3>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              New Notice
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={120}
                required
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                placeholder="End of term notice"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                Portal
              </label>
              <select
                name="portal"
                value={form.portal}
                onChange={handleChange}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="both">Students and Teachers</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/65">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={8}
              maxLength={5000}
              required
              className="w-full resize-y rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              placeholder="Use {{name}}, {{class}}, {{session}}, {{admission_no}}, or {{username}} where needed."
            />
            <p className="mt-2 text-sm font-semibold text-primary/55">
              Available placeholders: {"{{name}}"}, {"{{class}}"}, {"{{session}}"}, {"{{admission_no}}"}, {"{{username}}"}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="starts_at"
                value={form.starts_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                End Date
              </label>
              <input
                type="datetime-local"
                name="ends_at"
                value={form.ends_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-bold text-primary">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-5 w-5 accent-button"
            />
            Active notice
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            {editingId ? <FaCircleCheck /> : <FaPlus />}
            {saving ? "Saving..." : editingId ? "Update Notice" : "Create Notice"}
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-extrabold text-secondary">
          Existing Notices
        </h3>

        {loading ? (
          <div className="rounded-lg bg-secondary p-6 text-primary/70 shadow-lg">
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="rounded-lg bg-secondary p-6 text-primary/70 shadow-lg">
            No portal notice has been created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {notices.map((notice) => (
              <article
                key={notice._id}
                className="rounded-lg bg-secondary p-6 shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-extrabold text-primary">
                      {notice.title}
                    </h4>
                    <p className="mt-2 text-sm font-bold uppercase text-primary/55">
                      {notice.portal === "both"
                        ? "Students and Teachers"
                        : `${notice.portal} portal`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      notice.is_active
                        ? "bg-green-500/10 text-green-700"
                        : "bg-primary/10 text-primary/60"
                    }`}
                  >
                    {notice.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-primary/5 p-4 text-sm leading-6 text-primary/70">
                  {notice.message}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm font-semibold text-primary/65 md:grid-cols-2">
                  <p>Starts: {formatNoticeDate(notice.starts_at)}</p>
                  <p>Ends: {formatNoticeDate(notice.ends_at)}</p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleEdit(notice)}
                    className="inline-flex flex-1 items-center justify-center gap-3 rounded-lg bg-primary/10 px-4 py-3 font-bold text-primary transition-all duration-300 hover:bg-button hover:text-secondary"
                  >
                    <FaPen />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(notice)}
                    className="inline-flex flex-1 items-center justify-center gap-3 rounded-lg bg-red-500/10 px-4 py-3 font-bold text-red-700 transition-all duration-300 hover:bg-red-600 hover:text-white"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PortalNotices;
