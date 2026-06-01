import { motion } from "framer-motion";

import {
  FaGraduationCap,
  FaBookOpen,
  FaChalkboardTeacher,
} from "react-icons/fa";

/* =========================
   COVER IMAGE
========================= */

const coverImage =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779127530/file_000000003db471f4bd37dc425aca91a1_tygc9o.png";

/* =========================
   TRAINING LEVELS
========================= */

const classes = [
  "Basic Level Training",
  "Junior ICT Training",
  "Senior ICT Training",
  "Coding Classes",
  "Graphic Design Classes",
  "CBT Training",
];

/* =========================
   COURSES OFFERED
========================= */

const subjects = [
  "Microsoft Office Applications",
  "Graphic Design & Multimedia",
  "Internet & Digital Communication",
  "Coding & Programming",
  "Computer-Based Test (CBT) Training",
  "Digital Creativity & Innovation",
];

/* =========================
   INSTRUCTORS
========================= */

const teachers = [
  {
    name: "Mr. Divine Onyekwere",
    subject: "ICT Director",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
  },
];

/* =========================
   COMPONENT
========================= */

export default function ComputerTraining() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* =========================
            HERO SECTION
        ========================= */}

        <section className="relative w-full h-[50vh]">

          <img
            src={coverImage}
            alt="Computer Training"
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


                <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight">

                  Computer Training
                </h1>

                <p className="mt-6 text-lg md:text-xl text-primary/80 leading-relaxed">

                  Empowering students with modern digital skills,
                  creativity, innovation, and practical ICT knowledge
                  for the future.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================
            ABOUT SECTION
        ========================= */}

        <section className="py-10 px-6 lg:px-16">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >

              <h2 className="text-4xl font-extrabold text-secondary mt-6 leading-tight">

                Digital Skills With Practical Innovation
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">

                Our Computer Training program is designed to equip
                students with practical digital knowledge,
                problem-solving abilities, creativity, and modern
                technological skills required in today’s digital world.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">

                Through hands-on training, interactive learning,
                coding practice, graphic design, internet applications,
                and computer-based assessments, students gain the
                confidence and technical experience needed to excel
                academically and professionally in the modern
                technology-driven society.
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
                alt="Computer Training Students"
                className="rounded-[2rem] shadow-2xl object-cover h-[500px] w-full"
              />

              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary rounded-3xl px-8 py-6 shadow-2xl">

                <h3 className="text-4xl font-extrabold">
                  100%
                </h3>

                <p className="text-primary/70">
                  Hands-On Learning
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            TRAINING LEVELS + COURSES
        ========================= */}

        <section className="px-6 lg:px-16 pb-20">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Training Levels */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-[2rem] p-8 shadow-xl"
            >

              <h3 className="text-3xl font-bold text-primary mb-8">

                Training Levels
              </h3>

              <div className="grid grid-cols-2 gap-4">

                {classes.map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary font-semibold text-center hover:bg-button hover:text-secondary transition-all duration-300 cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Courses Offered */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-[2rem] p-8 shadow-xl"
            >

              <h3 className="text-3xl font-bold text-primary mb-8">

                Courses Offered
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary font-medium hover:bg-button hover:text-secondary transition-all duration-300 cursor-pointer"
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            INSTRUCTORS SECTION
        ========================= */}

        <section className="pb-24 px-6 lg:px-16">

          {/* Heading */}
          <div className="text-center mb-16">

            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm">

              <FaChalkboardTeacher className="text-button" />

              Our Instructors
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mt-6">

              Meet Our ICT Instructors
            </h2>

            <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

              Our skilled ICT instructors are passionate about
              equipping students with modern digital skills,
              innovation, creativity, and practical computer
              knowledge.
            </p>
          </div>

          {/* Instructor Cards */}
          <div className=" w-full flex justify-center items-center ">
              <div className="">

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
                  y: -10,
                }}
                className="w-120 group bg-secondary rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
              >

                {/* Image */}
                <div className="overflow-hidden h-80">

                  <img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
            
          </div>
        </section>
      </main>
    </>
  );
}