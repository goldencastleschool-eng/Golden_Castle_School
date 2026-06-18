import { motion } from "framer-motion";
import BackToProgramsLink from "../../components/common/BackToProgramsLink.jsx";

import {
  FaGraduationCap,
  FaBookOpen,
  FaChalkboardTeacher,
} from "react-icons/fa";

/* =========================
   COVER IMAGE
========================= */

const coverImage =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777221842/facility3_oy5msk.jpg";

/* =========================
   CLASSES
========================= */

const classes = [
  "Basic 1",
  "Basic 2",
  "Basic 3",
  "Basic 4",
  "Basic 5",
];

/* =========================
   SUBJECTS
========================= */

const subjects = [
  "English Language",
  "Mathematics",
  "Basic Science & Technology",
  "Computer Studies",
  "Igbo Language",
  "National Values",
  "Cultural & Creative Arts",
  "Pre-Vocational Studies",
  "Religious Studies",
  "Verbal Reasoning",
  "Quantitative Reasoning",
  "History",
  "Chinese Language",
];

/* =========================
   TEACHERS
========================= */

const teachers = [
  {
    name: "Mrs. Chioma",
    subject: "Class Teacher (Basic 1)",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619624/WhatsApp_Image_2026-05-24_at_11.40.15_AM_2_slsllx.jpg",
  },

  {
    name: "Mrs. Amarachi",
    subject: "Class Teacher (Basic 2)",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619625/WhatsApp_Image_2026-05-24_at_11.40.15_AM_1_zcbvb1.jpg",
  },

  {
    name: "Miss. Chisom",
    subject: "Class Teacher (Basic 3)",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619621/WhatsApp_Image_2026-05-24_at_11.40.15_AM_j909bn.jpg",
  },

  {
    name: "Mrs. Anita",
    subject: "Class Teacher (Basic 4)",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619620/WhatsApp_Image_2026-05-24_at_11.40.14_AM_1_mm5xow.jpg",
  },

  {
    name: "Mrs. Faith",
    subject: "Class Teacher (Basic 5)",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619623/WhatsApp_Image_2026-05-24_at_11.40.14_AM_cwm1nm.jpg",
  },

];

/* =========================
   COMPONENT
========================= */

export default function BasicEducation() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* =========================
            HERO SECTION
        ========================= */}

        <section className="relative w-full h-[50vh]">

          <img
            src={coverImage}
            alt="Secondary Education"
            className="w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center px-6">

            <div className="max-w-4xl text-center">

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >

                <h1 className="text-3xl md:text-5xl font-extrabold text-primary leading-tight">

                  Basic Education
                </h1>

                <p className="mt-6 text-lg md:text-xl text-primary/80 leading-relaxed">

                  Building future leaders through academic excellence,
                  discipline, innovation, and holistic learning.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================
            ABOUT SECTION
        ========================= */}

        <BackToProgramsLink />

        <section className="px-6 py-12 lg:px-10">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >


              <h2 className="text-3xl font-extrabold text-secondary mt-6 leading-tight">

                Strong Educational Foundation With Character Development
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">
                Our Basic Education program is designed to provide pupils with a solid academic foundation while nurturing creativity, discipline, confidence, and moral values essential for lifelong learning and personal growth.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">
                  Through engaging teaching methods, interactive learning experiences, technology integration, and character-based education, pupils develop strong literacy, numeracy, communication, and problem-solving skills needed to excel academically and socially in an ever-changing world.
              </p>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >

              <img
                src={coverImage}
                alt="Secondary School"
                className="rounded-lg shadow-lg object-cover h-[500px] w-full"
              />

              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary rounded-lg px-6 py-5 shadow-md">

                <h3 className="text-3xl font-extrabold">
                  5
                </h3>

                <p className="text-primary/70">
                  Academic Levels
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            CLASSES + SUBJECTS
        ========================= */}

        <section className="px-6 pb-12 lg:px-10">

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Classes */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-lg p-6 shadow-md"
            >

              <h3 className="mb-6 text-2xl font-bold text-primary">

                Section Classes
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {classes.map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-lg px-5 py-4 text-primary font-semibold text-center hover:bg-button hover:text-secondary transition-all duration-300 "
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Subjects */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-lg p-6 shadow-md"
            >

              <h3 className="mb-6 text-2xl font-bold text-primary">

                Subjects Offered
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-lg px-5 py-4 text-primary font-medium hover:bg-button hover:text-secondary transition-all duration-300 "
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            TEACHERS SECTION
        ========================= */}

        <section className="px-6 pb-16 lg:px-10">

          {/* Heading */}
          <div className="mb-10 text-center">

            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm">

              <FaChalkboardTeacher className="text-button" />

              Our Teachers
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-6">

              Meet Our Professional Educators
            </h2>

            <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

              Our experienced and passionate teachers are dedicated
              to inspiring students, nurturing excellence, and
              developing future-ready leaders.
            </p>
          </div>

          {/* Teacher Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">

            {teachers.map((teacher, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 50,
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
                className="group bg-secondary rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500"
              >

                {/* Image */}
                <div className="overflow-hidden h-80">

                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Content */}
                <div className="p-7">

                  <h3 className="text-2xl font-bold text-primary">

                    {teacher.name}
                  </h3>

                  <p className="mt-3 text-primary/70 text-lg">

                    {teacher.subject}
                  </p>

                  <div className="mt-6 w-14 h-1 bg-button rounded-full group-hover:w-24 transition-all duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}