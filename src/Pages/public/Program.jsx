import { motion } from "framer-motion";

import { NavLink } from "react-router-dom";

import { FaArrowRight } from "react-icons/fa6";


/* =========================
   PROGRAM DATA
========================= */

const programs = [
  {
    title: "Secondary Education",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127759/secondary-school-picture_ppovgm.jpg",

    description:
      "A comprehensive secondary education program focused on academic excellence, leadership development, innovation, and character building.",

    age: "10 - 16 Years",

    classLevel: "JSS 1 - SS 3",

    link: "/programs/secondary-education",
  },

  {
    title: "Basic Education",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777221842/facility3_oy5msk.jpg",

    description:
      "A strong educational foundation designed to develop literacy, numeracy, creativity, confidence, and social interaction skills.",

    age: "5 - 10 Years",

    classLevel: "Basic 1 - 5",

    link: "/programs/basic-education",
  },

  {
    title: "Nursery Education",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127512/file_000000001ca471f4803bd3cac004da09_c1iy1q.png",

    description:
      "A nurturing and stimulating early childhood learning environment where children grow emotionally, socially, and academically.",

    age: "1 - 5 Years",

    classLevel: "Creche - Nursery 3",

    link: "/programs/nursery-education",
  },

  {
    title: "Computer Training",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127530/file_000000003db471f4bd37dc425aca91a1_tygc9o.png",

    description:
      "Modern computer training designed to equip students with practical digital skills, coding knowledge, and ICT proficiency.",

    age: "8 - 16 Years",

    classLevel: "All Classes",

    link: "/programs/computer-training",
  },

  {
    title: "Boarding School",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777221835/facility2_puyjbx.jpg",

    description:
      "A safe and disciplined boarding environment that promotes academic focus, independence, responsibility, and leadership.",

    age: "10 - 18 Years",

    classLevel: "JSS 1 - SS 3",

    link: "/programs/boarding-school",
  },

  {
    title: "Music & Art",

    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779360083/WhatsApp_Image_2026-05-21_at_11.40.24_AM_wxqzjn.jpg",

    description:
      "Creative programs that inspire artistic expression, musical talent, creativity, imagination, and cultural appreciation.",

    age: "5 - 18 Years",

    classLevel: "All Classes",

    link: "/programs/music-and-arts",
  },
];

/* =========================
   COMPONENT
========================= */

export default function ProgramCards() {
  return (
    <>
        <section className="w-full bg-background px-6 py-12 lg:px-10">

            {/* =========================
                SECTION HEADER
            ========================= */}

            <div className="mb-10 text-center">
              <h1 className="mt-6 text-3xl md:text-4xl font-extrabold text-secondary leading-tight">

                Explore Our Learning Programs
              </h1>

              <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

                We provide world-class educational programs designed to nurture
                academic excellence, creativity, leadership, discipline, and lifelong
                learning.

              </p>
            </div>

        {/* =========================
            PROGRAM GRID
        ========================= */}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">

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

              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}

              viewport={{
                once: true,
              }}

              whileHover={{
                y: -10,
              }}

              className="group bg-secondary rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500"
            >

              {/* =========================
                  IMAGE
              ========================= */}

              <div className="relative overflow-hidden h-72">

                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                {/* Floating Badge */}
                <div className="absolute top-5 left-5 bg-button text-secondary px-4 py-2 rounded-full text-sm font-bold shadow-lg">

                  {program.age}
                </div>
              </div>

              {/* =========================
                  CONTENT
              ========================= */}

              <div className="p-7">

                <h3 className="text-2xl font-bold text-primary mb-4">

                  {program.title}
                </h3>

                <p className="text-primary/70 leading-relaxed mb-6">

                  {program.description}
                </p>

                {/* Info */}
                <div className="space-y-3 mb-8">

                  <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3">

                    <span className="text-primary/70 font-medium">
                      Age Range
                    </span>

                    <span className="font-bold text-primary">
                      {program.age}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3">

                    <span className="text-primary/70 font-medium">
                      Classes
                    </span>

                    <span className="font-bold text-primary text-right">
                      {program.classLevel}
                    </span>
                  </div>
                </div>

                {/* CTA BUTTON */}
                <NavLink
                  to={program.link}
                  className="group/button w-full bg-button hover:bg-primary text-secondary hover:text-secondary font-bold py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-button/30"
                >

                  Learn More

                  <FaArrowRight className="group-hover/button:translate-x-1 transition duration-300" />
                </NavLink>
              </div>
            </motion.div>
          ))}
        </div>
        </section>
    </>
  );
}
