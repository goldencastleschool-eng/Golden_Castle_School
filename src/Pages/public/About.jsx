
import {
  FaEye,
  FaBullseye,
  FaBrain,
  FaStar,
  FaBalanceScale,
  FaHandshake,
  FaClipboardCheck,
  FaUserGraduate,
} from "react-icons/fa";

import { MdLightbulb } from "react-icons/md";

import { motion } from "framer-motion";

/* =========================
   DATA
========================= */

const values = [
  {
    icon: <FaStar />,
    title: "Excellence",
    description:
      "We strive for outstanding academic performance and personal achievement in all areas of learning.",
  },

  {
    icon: <FaBalanceScale />,
    title: "Integrity",
    description:
      "We promote honesty, accountability, and strong moral principles among our students and staff.",
  },

  {
    icon: <FaClipboardCheck />,
    title: "Discipline",
    description:
      "We cultivate self-control, responsibility, and a positive attitude toward learning and life.",
  },

  {
    icon: <MdLightbulb />,
    title: "Innovation",
    description:
      "We encourage creativity, critical thinking, and the use of modern technology.",
  },

  {
    icon: <FaHandshake />,
    title: "Respect",
    description:
      "We foster kindness, teamwork, diversity, and mutual respect.",
  },

  {
    icon: <FaUserGraduate />,
    title: "Scholars",
    description:
      "We nurture confident, intelligent, and future-ready scholars.",
  },
];

const schoolInfo = [
  {
    icon: <FaEye />,
    title: "Our Vision",
    description:
      "To be a leading international school recognized for academic excellence, innovation, and the development of morally upright global citizens.",
  },

  {
    icon: <FaBullseye />,
    title: "Our Mission",
    description:
      "To provide a high-quality international education that fosters academic excellence, personal growth, and social responsibility.",
  },

  {
    icon: <FaBrain />,
    title: "Our Philosophy",
    description:
      "We believe in holistic education that nurtures intellectual, emotional, and social development.",
  },
];

/* =========================
   COMPONENT
========================= */

export default function About() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* ================= HERO ================= */}

        <section className="relative px-5 py-12 sm:px-8 lg:px-10">

          {/* Background Glow */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

          <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 max-w-7xl mx-auto">

            {/* Heading */}
            <div className="text-center mb-10">

              <span className="text-button uppercase tracking-[4px] font-semibold">
                About Our School
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-4">
                Building Future Leaders
              </h1>

              <div className="w-24 h-1.5 bg-button rounded-full mx-auto mt-6"></div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2  gap-12 items-center">

              {/* Left */}
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="space-y-8"
              >

                <div className="bg-secondary/5 border border-secondary/10 backdrop-blur-sm rounded-lg p-6 shadow-md">

                  <p className="text-secondary text-lg leading-relaxed first-letter:text-6xl first-letter:text-button first-letter:font-bold">
                    Golden Castle International School, Oba is a center
                    of academic excellence dedicated to raising
                    confident, responsible, and future-ready scholars.
                    We are passionate about providing quality education
                    in a safe, inspiring, and nurturing environment
                    where every child is encouraged to discover and
                    maximize their potential.
                  </p>

                  <p className="text-secondary text-lg leading-relaxed mt-6">
                    At Golden Castle International School, we believe
                    education goes beyond the classroom. Our mission is
                    to develop students intellectually, morally,
                    socially, and creatively, preparing them to succeed
                    in an ever-changing global society.
                  </p>

                  <p className="text-secondary text-lg leading-relaxed mt-6">
                    We are dedicated to raising well-rounded individuals who are not only academically sound but also socially responsible, emotionally balanced, and spiritually grounded. By fostering a culture of excellence, discipline, innovation, respect, and integrity, we prepare our students to become lifelong learners, visionary leaders, and positive contributors to their communities and the world at large.
                  </p>

                </div>
              </motion.div>

              {/* Right */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >

                <div className="bg-secondary text-primary rounded-lg p-12 shadow-lg">

                  <h2 className="text-3xl font-bold mb-8">
                    Our Core Values
                  </h2>

                  <div className="space-y-6">

                    {values.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4"
                      >

                        <div className="text-2xl text-button mt-1">
                          {item.icon}
                        </div>

                        <div>
                          <h3 className="font-bold text-xl">
                            {item.title}
                          </h3>

                          <p className="text-primary/80 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ================= VALUES ================= */}

        <section className="px-5 py-12 sm:px-8 lg:px-10">

          <div className="max-w-7xl mx-auto">

            <div className="mb-10 text-center">

              <h2 className="text-3xl font-bold text-secondary">
                What Defines Us
              </h2>

              <p className="text-secondary/70 mt-4 max-w-2xl mx-auto">
                The values that guide our teaching, learning, and
                leadership culture.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="group bg-secondary text-primary rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300"
                >

                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-4xl text-button mb-6 group-hover:scale-105 transition duration-300">
                    {value.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-4">
                    {value.title}
                  </h3>

                  <p className="text-primary/80 leading-relaxed">
                    {value.description}
                  </p>

                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= VISION MISSION ================= */}

        <section className="px-5 py-12 sm:px-8 lg:px-10 ">

          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">

              {schoolInfo.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2,
                  }}
                  viewport={{ once: true }}
                  className="bg-primary/5 border border-primary/10 rounded-lg p-8 text-primary shadow-md backdrop-blur-sm bg-secondary"
                >

                  <div className="w-20 h-20 rounded-lg bg-button/10 flex items-center justify-center text-4xl text-button mb-8">
                    {item.icon}
                  </div>

                  <h3 className="text-3xl font-bold mb-5">
                    {item.title}
                  </h3>

                  <p className="text-primary/80 leading-relaxed">
                    {item.description}
                  </p>

                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CHANT & ANTHEM ================= */}

        <section className="px-5 py-12 sm:px-8 lg:px-10">

          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Chant */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-secondary text-primary rounded-lg p-6 shadow-lg"
              >

                <h2 className="text-3xl font-bold mb-8 text-center">
                  Our Chant
                </h2>

                <p className="text-lg leading-loose text-center text-primary/90">
                  I love my school (X2)
                  <br />
                  Golden Castle the best school in town X2
                  <br />
                  We are Champions (X3)
                  <br />
                  Everyday
                  <br />
                  Call: Golden Castle
                  <br />
                  Response: Reach for Gold
                  <br />
                  Call: Golden Castle
                  <br />
                  Response: God in Heaven We Praise
                </p>
              </motion.div>

              {/* Anthem */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-secondary text-primary rounded-lg p-6 shadow-lg"
              >

                <h2 className="text-3xl font-bold mb-8 text-center">
                  School Anthem
                </h2>

                <p className="text-lg leading-loose text-center text-primary/90">
                  Golden Castle (X2)
                  <br />
                  A mountain of horses and chariots
                  <br />
                  We are planted by destiny on this castle
                  <br />
                  of knowledge and Godly wisdom
                  <br />
                  Everyday
                  <br />
                  Oh with great passion in all fields of
                  <br />
                  knowledge we thrive our dreams in all we do
                  <br />
                  Triumphing everyday as we reach for gold
                </p>
              </motion.div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}