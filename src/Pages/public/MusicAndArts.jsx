import { motion } from "framer-motion";
import BackToProgramsLink from "../../components/common/BackToProgramsLink.jsx";

import {
  FaGraduationCap,
  FaBookOpen,
  FaMusic,
} from "react-icons/fa";

/* =========================
   COVER IMAGE
========================= */

const coverImage =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779360083/WhatsApp_Image_2026-05-21_at_11.40.24_AM_wxqzjn.jpg";

/* =========================
   MUSIC & ART CLASSES
========================= */

const classes = [
  "Beginner Music Class",
  "Intermediate Music Class",
  "Advanced Music Class",
  "Art & Craft Sessions",
  "Instrument Practice",
  "Creative Performance Training",
];

/* =========================
   ACTIVITIES OFFERED
========================= */

const subjects = [
  "Piano Training",
  "Vocal Training",
  "Instrumental Practice",
  "Music Theory",
  "Creative Art & Drawing",
  "Stage Performance Skills",
  "Choir & Choreography",
  "Craft & Design Activities",
];

/* =========================
   MUSIC INSTRUCTOR
========================= */

const instructors = [
  {
    name: "Mr. ",
    subject: "Music Instructor",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
  },
];

/* =========================
   COMPONENT
========================= */

export default function MusicAndArts() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* =========================
            HERO SECTION
        ========================= */}

        <section className="relative w-full h-[65vh]">

          <img
            src={coverImage}
            alt="Music and Arts"
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

                  Music & Arts
                </h1>

                <p className="mt-6 text-lg md:text-xl text-primary/80 leading-relaxed">

                  Inspiring creativity, confidence, and self-expression
                  through music, arts, and performance training.
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

                Creativity Through Music & Artistic Expression
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">

                Our Music and Arts program is designed to nurture
                creativity, talent, confidence, and self-expression
                in students through practical music lessons,
                performances, and artistic activities.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">

                Through vocal training, instrumental practice,
                creative arts, choreography, and stage performances,
                students develop discipline, teamwork, imagination,
                and communication skills while discovering and
                expressing their unique talents.
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
                alt="Music and Arts Students"
                className="rounded-lg shadow-lg object-cover h-[500px] w-full"
              />

              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary rounded-lg px-6 py-5 shadow-md">

                <h3 className="text-3xl font-extrabold">
                  100%
                </h3>

                <p className="text-primary/70">
                  Creative Expression
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            CLASSES + ACTIVITIES
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

                Training Classes
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

            {/* Activities */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-lg p-6 shadow-md"
            >

              <h3 className="mb-6 text-2xl font-bold text-primary">

                Activities Offered
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
            INSTRUCTOR SECTION
        ========================= */}

        <section className="px-6 pb-16 lg:px-10">

          {/* Heading */}
          <div className="mb-10 text-center">

            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm">

              <FaMusic className="text-button" />

              Music Instructor
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mt-6">

              Meet Our Music Instructor
            </h2>

            <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

              Our experienced music instructor is dedicated to helping
              students discover their talents, build confidence, and
              develop creativity through practical music and arts
              education.
            </p>
          </div>

          {/* Instructor Card */}
          <div className="w-full flex justify-center items-center">

            {instructors.map((instructor, index) => (
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
                }}
                whileHover={{
                  y: -4,
                }}
                className="w-full max-w-md group bg-secondary rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500"
              >

                {/* Image */}
                <div className="overflow-hidden h-96">

                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Content */}
                <div className="p-7">

                  <h3 className="text-2xl font-bold text-primary">

                    {instructor.name}
                  </h3>

                  <p className="mt-3 text-primary/70 text-lg">

                    {instructor.subject}
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