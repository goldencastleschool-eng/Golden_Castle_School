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
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127759/secondary-school-picture_ppovgm.jpg";

/* =========================
   CLASSES
========================= */

const classes = [
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SS 1",
  "SS 2",
  "SS 3",
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
  "Business Studies",
  "Pre-Vocational Studies",
  "Religious Studies",
  "Physical & Health Education",
  "History",
  "Chinese Language",
];

/* =========================
   TEACHERS
========================= */

const teachers = [
  {
    name: "Mr. Damian Chika",
    subject: "Mathematics & Physical Health Education",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619630/WhatsApp_Image_2026-05-24_at_11.40.19_AM_1_yjwszc.jpg",
  },

  {
    name: "Miss Faith",
    subject: "English Language & Commerce",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
  },

  {
    name: "Mr. Ebuka",
    subject: "Basic Science and Technology",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619627/WhatsApp_Image_2026-05-24_at_11.40.18_AM_2_gkmvv9.jpg",
  },

  {
    name: "Mr. Benjamin",
    subject: "Physics, Mathematics & Further Mathematics",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop",
  },

  {
    name: "Mrs. Florence",
    subject: "Business Studies, Igbo Language & Fin. Accounting",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619628/WhatsApp_Image_2026-05-24_at_11.40.18_AM_3_tnhsrn.jpg",
  },

  {
    name: "Mr. Fred Uchenna",
    subject: "Civic Education, Government",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619631/WhatsApp_Image_2026-05-24_at_11.40.19_AM_k4kr3x.jpg",
  },

  {
    name: "Miss. Grace",
    subject: "Business Studies, Lit-in-English",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=1200&auto=format&fit=crop",
  },

  {
    name: "Mr. Rising ",
    subject: "Mathematics & Computer Studies",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619621/WhatsApp_Image_2026-05-24_at_11.40.11_AM_ftoebd.jpg",
  },

  {
    name: "Mrs. Patience C",
    subject: "Chemistry",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
  },
   {
    name: "Mrs. Love",
    subject: "Religious Studies & History",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619619/WhatsApp_Image_2026-05-24_at_11.40.10_AM_tylpt5.jpg",
  },
   {
    name: "Mrs. Precious",
    subject: "English Language & Geography",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619632/WhatsApp_Image_2026-05-24_at_11.40.20_AM_amfrt9.jpg",
  },
   {
    name: "Mrs. Chidiebere",
    subject: "Biology & Agricultural Science",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
  },
];

/* =========================
   COMPONENT
========================= */

export default function SecondaryEducation() {
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

                  Secondary Education
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

                Academic Excellence With Character Development
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">

                Our Secondary Education program is designed to equip
                students with strong academic knowledge, leadership
                skills, creativity, discipline, and critical thinking
                abilities needed to excel in higher education and in
                life.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">

                Through modern teaching methods, practical learning,
                technology integration, and moral guidance, students
                are prepared to become confident, responsible, and
                globally competitive scholars.
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
                  6
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