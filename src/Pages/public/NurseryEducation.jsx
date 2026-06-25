import { motion } from "framer-motion";
import BackToProgramsLink from "../../components/common/BackToProgramsLink.jsx";

import {
  FaGraduationCap,
  FaBookOpen,
  FaChalkboardTeacher,
  FaChild,
} from "react-icons/fa";

/* =========================
   COVER IMAGE
========================= */

const coverImage =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127512/file_000000001ca471f4803bd3cac004da09_c1iy1q.png";

/* =========================
   NURSERY CLASSES
========================= */

const classes = [
  "Creche",
  "Pre-Nursery 1",
  "Pre-Nursery 2",
  "Nursery 1",
  "Nursery 2",
  "Nursery 3",
];

/* =========================
   LEARNING AREAS
========================= */

const subjects = [
  "Early Literacy Skills",
  "Numeracy & Counting",
  "Rhymes & Storytelling",
  "Creative Arts & Craft",
  "Phonics & Communication",
  "Basic Computer Awareness",
  "Social & Emotional Learning",
  "Health & Hygiene",
  "Play-Based Learning",
  "Music & Dance",
];

/* =========================
   TEACHERS
========================= */

const teachers = [
  {
    name: "Mrs. Ekene",
    subject: "Creche",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619620/WhatsApp_Image_2026-05-24_at_11.40.13_AM_3_evn7rv.jpg",
  },

  {
    name: "Mrs. Peace",
    subject: "Pre-Nursery 1 Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619626/WhatsApp_Image_2026-05-24_at_11.40.17_AM_2_ewk0tm.jpg",
  },

  {
    name: "Mrs. Lucy",
    subject: "Pre-Nursery 1 Assisting Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619626/WhatsApp_Image_2026-05-24_at_11.40.17_AM_1_xgcmhl.jpg",
  },
    {
    name: "Miss. Blessing",
    subject: "Pre-Nursery 2 Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619627/WhatsApp_Image_2026-05-24_at_11.40.17_AM_rvgk6k.jpg",
  },
   {
    name: "Miss. Chiamaka",
    subject: "Pre-Nursery 2 Assisting Teacher",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Miss. Unique",
    subject: "Nursery 1 Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619625/WhatsApp_Image_2026-05-24_at_11.40.16_AM_2_g6coay.jpg",
  },
   {
    name: "Miss. Mercy",
    subject: "Nursery 1 Assisting Teacher",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Mrs. Ada",
    subject: "Nursery 2 Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619621/WhatsApp_Image_2026-05-24_at_11.40.16_AM_1_nykrxy.jpg",
  },
  {
    name: "Mrs. God's time",
    subject: "Nursery 2 Assisting Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/v1782402532/WhatsApp_Image_2026-06-25_at_4.46.20_PM_xowxhg.jpg",
  },
  {
    name: "Mrs. Onyinye",
    subject: "Nursery 3 Teacher",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619624/WhatsApp_Image_2026-05-24_at_11.40.16_AM_lrbb2p.jpg",
  },
];

/* =========================
   COMPONENT
========================= */

export default function NurseryEducation() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* =========================
            HERO SECTION
        ========================= */}

        <section className="relative w-full h-[30vh]">

          <img
            src={coverImage}
            alt="Nursery Education"
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

                  Nursery Education
                </h1>

                <p className="mt-6 text-lg md:text-xl text-primary/80 leading-relaxed">

                  Providing a safe, caring, and stimulating environment
                  where children learn, grow, explore, and develop
                  foundational life skills.
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

                Building Strong Foundations For Lifelong Learning
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">

                Our Nursery Education program is carefully designed to
                nurture young learners during their early developmental
                years through engaging, interactive, and child-friendly
                learning experiences.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">

                Through play-based learning, creativity, communication,
                social interaction, and guided exploration, children
                develop confidence, curiosity, emotional intelligence,
                and foundational academic skills needed for future
                educational success.
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
                alt="Nursery School"
                className="rounded-lg shadow-lg object-cover h-[500px] w-full"
              />

              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary rounded-lg px-6 py-5 shadow-md">

                <h3 className="text-3xl font-extrabold">
                  6
                </h3>

                <p className="text-primary/70">
                  Learning Stages
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

                Learning Areas
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

              Meet Our Caring Educators
            </h2>

            <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

              Our dedicated nursery teachers create a warm,
              supportive, and engaging learning environment where
              every child feels valued, encouraged, and inspired to grow.
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

                  <div className="flex items-center gap-3 mb-4">

                    <div className="w-12 h-12 rounded-lg bg-button/20 flex items-center justify-center text-button">
                      <FaChild />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-primary">
                        {teacher.name}
                      </h3>

                      <p className="text-primary/70">
                        {teacher.subject}
                      </p>
                    </div>
                  </div>

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