import { motion } from "framer-motion";

import {
  FaGraduationCap,
  FaBookOpen,
  FaBaby,
  FaBed,
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
  },

  {
    title: "Basic Education",
    icon: <FaBookOpen />,
  },

  {
    title: "Nursery Education",
    icon: <FaBaby />,
  },

  {
    title: "Boarding School",
    icon: <FaBed />,
  },

  {
    title: "Computer Training",
    icon: <FaLaptopCode />,
  },

  {
    title: "Music & Art",
    icon: <FaMusic />,
  },
];

/* =========================
   COMPONENT
========================= */

export default function ProgramGridCards() {
  return (
    <section className="w-full bg-background py-10 px-6 lg:px-16">

      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="text-center mb-16">

        <h2 className="text-4xl md:text-5xl font-extrabold text-secondary">

          Our Programs
        </h2>

        <div className="w-24 h-1.5 bg-button rounded-full mx-auto mt-5"></div>

        <p className="max-w-2xl mx-auto mt-6 text-secondary/70 text-lg leading-relaxed">
          Discover our diverse academic and extracurricular programs
          designed to nurture excellence, creativity, discipline,
          leadership, and innovation.
        </p>
      </div>

      {/* =========================
          GRID SYSTEM
      ========================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">

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
              y: -10,
              scale: 1.02,
            }}
            className="group relative overflow-hidden bg-secondary rounded-2xl p-6 shadow-xl transition-all duration-500 hover:shadow-2xl sm:rounded-[2rem] sm:p-10 cursor-pointer"
          >

            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-button/10 rounded-full blur-3xl group-hover:bg-button/20 transition-all duration-500"></div>

            {/* Icon */}
            <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-button text-3xl text-secondary shadow-lg transition duration-500 group-hover:rotate-6 sm:mb-8 sm:h-20 sm:w-20 sm:rounded-3xl sm:text-4xl">

              {program.icon}
            </div>

            {/* Title */}
            <h3 className="relative z-10 text-xl font-bold text-primary leading-snug sm:text-2xl">

              {program.title}
            </h3>

            {/* Hover Line */}
            <div className="relative z-10 mt-5 h-1 w-14 rounded-full bg-button transition-all duration-500 group-hover:w-24 sm:mt-6"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
