import { useState } from "react";
import { FaGear } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function StudentSettings() {
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    setSaving(true);

    try {
      await API.put("/auth/student/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(initialPasswordForm);
      setStatus({
        type: "success",
        message: "Password changed successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to change password.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaGear />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">Settings</h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Change your student portal password.
        </p>
      </div>

      <section className="rounded-lg bg-secondary p-6 shadow-lg">
        <h3 className="text-3xl font-extrabold text-primary">
          Change Password
        </h3>
        <p className="mt-3 text-primary/70">
          Use at least 6 characters for your new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <input
            className={inputClass}
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handleChange}
            placeholder="Current password"
            required
          />
          <input
            className={inputClass}
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handleChange}
            placeholder="New password"
            required
            minLength="6"
          />
          <input
            className={inputClass}
            type="password"
            name="confirmPassword"
            value={passwordForm.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
            minLength="6"
          />

          <button
            type="submit"
            disabled={saving}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving password..." : "Save Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default StudentSettings;

