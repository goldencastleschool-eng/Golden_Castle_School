import { FaMoneyBillWave, FaRightFromBracket, FaUserGraduate, FaUserShield } from "react-icons/fa6";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function BursarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    await logout();
    navigate("/bursar-login");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-primary/10 bg-secondary shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-xl text-secondary"><FaMoneyBillWave /></span>
            <div>
              <h1 className="font-extrabold text-primary">Bursar Portal</h1>
              <p className="text-xs font-semibold text-primary/60">Golden Castle School</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm font-semibold text-primary/70 sm:block"><FaUserShield className="mr-1 inline" />{user?.username}</span>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-secondary transition hover:bg-primary/90"><FaRightFromBracket /> Logout</button>
          </div>
        </div>
      </header>
      <nav className="border-b border-primary/10 bg-secondary">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">
          <NavLink end to="/bursar" className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${isActive ? "bg-button text-secondary" : "text-primary hover:bg-primary/10"}`}><FaMoneyBillWave /> Fee records</NavLink>
          <NavLink to="/bursar/new-admissions" className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${isActive ? "bg-button text-secondary" : "text-primary hover:bg-primary/10"}`}><FaUserGraduate /> New admissions</NavLink>
        </div>
      </nav>
      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><Outlet /></section>
    </main>
  );
}

export default BursarLayout;
