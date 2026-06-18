import { NavLink } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

export default function BackToProgramsLink() {
  return (
    <div className="px-6 pt-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <NavLink
          to="/programs"
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 font-bold text-primary shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-button hover:text-secondary"
        >
          <FaArrowLeft />
          Back to Programs
        </NavLink>
      </div>
    </div>
  );
}
