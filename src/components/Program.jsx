import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

import {
  FaGraduationCap,
  FaBookOpen,
  FaBaby,
  FaBed,
  FaArrowRight,
  FaLaptopCode,
  FaMusic,
} from "react-icons/fa6";

/* =========================
   PROGRAM DATA
========================= */

const programs = [
  {
    title: "Secondary Education",
    icon: <FaGraduationCap />,
    link: "/programs/secondary-education",
  },

  {
    title: "Basic Education",
    icon: <FaBookOpen />,
    link: "/programs/basic-education",
  },

  {
    title: "Nursery Education",
    icon: <FaBaby />,
    link: "/programs/nursery-education",
  },

  {
    title: "Boarding School",
    icon: <FaBed />,
    link: "/programs/boarding-school",
  },

  {
    title: "Computer Training",
    icon: <FaLaptopCode />,
    link: "/programs/computer-training",
  },

  {
    title: "Music & Art",
    icon: <FaMusic />,
    link: "/programs/music-and-arts",
  },
];

/* =========================
   COMPONENT
========================= */

export default function ProgramGridCards() {
  return (
    <section className="w-full bg-background px-6 py-12 lg:px-10">

      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="mb-10 text-center">

        <h2 className="text-3xl font-extrabold text-secondary md:text-4xl">

          Our Programs
        </h2>

        <div className="mx-auto mt-5 h-1.5 w-20 rounded-full bg-button"></div>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary/70 md:text-lg">
          Discover our diverse academic and extracurricular programs
          designed to nurture excellence, creativity, discipline,
          leadership, and innovation.
        </p>
      </div>

      {/* =========================
          GRID SYSTEM
      ========================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

        {programs.map((program, index) => (
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
            }}
            whileHover={{
              y: -4,
            }}
            className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-lg bg-secondary p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7"
          >
            {/* Background Glow */}
            <div className="absolute right-0 top-0 h-24 w-24 bg-button/10 transition-all duration-500 group-hover:bg-button/20"></div>

            {/* Icon */}
            <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-2xl text-secondary shadow-md transition duration-500 group-hover:rotate-3 sm:h-16 sm:w-16 sm:text-3xl">

              {program.icon}
            </div>

            {/* Title */}
            <h3 className="relative z-10 text-xl font-bold leading-snug text-primary sm:text-2xl">

              {program.title}
            </h3>

            {/* Hover Line */}
            <div className="relative z-10 mt-5 h-1 w-14 rounded-full bg-button transition-all duration-500 group-hover:w-24 sm:mt-6"></div>

            <NavLink
              to={program.link}
              className="relative z-10 mt-auto inline-flex items-center justify-end gap-2 self-end pt-6 font-bold text-button transition duration-300 hover:gap-3 hover:text-primary"
            >
              Learn More
              <FaArrowRight className="text-sm" />
            </NavLink>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
