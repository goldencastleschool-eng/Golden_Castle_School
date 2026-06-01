import { motion } from "framer-motion";

import {
  FaGraduationCap,
  FaBookOpen,
  FaHotel,
} from "react-icons/fa";

/* =========================
   COVER IMAGE
========================= */

const coverImage =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777221835/facility2_puyjbx.jpg";

/* =========================
   BOARDING SECTIONS
========================= */

const boardingSections = [
  "Junior Boys Hostel",
  "Junior Girls Hostel",
  "Senior Boys Hostel",
  "Senior Girls Hostel",
  "Study & Reading Hall",
  "Dining & Recreation Hall",
];

/* =========================
   BOARDING FACILITIES
========================= */

const facilities = [
  "24/7 Hostel Supervision",
  "Well Furnished Rooms",
  "Nutritious Feeding System",
  "Modern Security System",
  "Medical Care Support",
  "Laundry & Sanitary Services",
  "Evening Prep & Study Sessions",
  "Sports & Recreation Activities",
];

/* =========================
   HOTEL MASTER & MISTRESS
========================= */

const hostelStaff = [
  {
    name: "Mr. Fred Uchenna",
    role: "Hotel Master",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619631/WhatsApp_Image_2026-05-24_at_11.40.19_AM_k4kr3x.jpg",
  },

  {
    name: "Miss. Unique",
    role: "Hotel Mistress",
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779619625/WhatsApp_Image_2026-05-24_at_11.40.16_AM_2_g6coay.jpg",
  },
];

/* =========================
   COMPONENT
========================= */

export default function BoardingSchool() {
  return (
    <>
      <main className="w-full bg-background overflow-hidden">

        {/* =========================
            HERO SECTION
        ========================= */}

        <section className="relative w-full h-[65vh]">

          <img
            src={coverImage}
            alt="Boarding School"
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

                  Boarding School
                </h1>

                <p className="mt-6 text-lg md:text-xl text-primary/80 leading-relaxed">

                  Providing students with a safe, comfortable,
                  disciplined, and supportive residential learning
                  environment.
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

                Comfortable Living With Academic Support
              </h2>

              <p className="mt-6 text-secondary/70 text-lg leading-relaxed">

                Our Boarding School program provides students with a
                secure, disciplined, and family-friendly environment
                where they can focus on academics, personal growth,
                and character development.
              </p>

              <p className="mt-5 text-secondary/70 text-lg leading-relaxed">

                With experienced hostel supervisors, structured study
                sessions, quality accommodation, balanced meals, and
                recreational activities, students enjoy a supportive
                atmosphere that promotes excellence, independence,
                responsibility, and leadership.
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
                alt="Boarding School Students"
                className="rounded-[2rem] shadow-2xl object-cover h-[500px] w-full"
              />

              <div className="absolute -bottom-6 -left-6 bg-secondary text-primary rounded-3xl px-8 py-6 shadow-2xl">

                <h3 className="text-4xl font-extrabold">
                  24/7
                </h3>

                <p className="text-primary/70">
                  Student Care & Supervision
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            HOSTEL SECTIONS + FACILITIES
        ========================= */}

        <section className="px-6 lg:px-16 pb-20">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Boarding Sections */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-[2rem] p-8 shadow-xl"
            >

              <h3 className="text-3xl font-bold text-primary mb-8">

                Boarding Sections
              </h3>

              <div className="grid grid-cols-2 gap-4">

                {boardingSections.map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary font-semibold text-center hover:bg-button hover:text-secondary transition-all duration-300 cursor-pointer"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Facilities */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-secondary rounded-[2rem] p-8 shadow-xl"
            >

              <h3 className="text-3xl font-bold text-primary mb-8">

                Boarding Facilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary font-medium hover:bg-button hover:text-secondary transition-all duration-300 cursor-pointer"
                  >
                    {facility}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================
            HOSTEL STAFF SECTION
        ========================= */}

        <section className="pb-24 px-6 lg:px-16">

          {/* Heading */}
          <div className="text-center mb-16">

            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary font-semibold text-sm">

              <FaHotel className="text-button" />

              Hostel Management
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mt-6">

              Meet Our Hotel Master & Mistress
            </h2>

            <p className="max-w-3xl mx-auto mt-5 text-secondary/70 text-lg leading-relaxed">

              Our hostel management team ensures students enjoy a
              secure, disciplined, caring, and comfortable boarding
              experience throughout their stay in school.
            </p>
          </div>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {hostelStaff.map((staff, index) => (
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
                className="group bg-secondary rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
              >

                {/* Image */}
                <div className="overflow-hidden h-80">

                  <img
                    src={staff.image}
                    alt={staff.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Content */}
                <div className="p-7">

                  <h3 className="text-2xl font-bold text-primary">

                    {staff.name}
                  </h3>

                  <p className="mt-3 text-primary/70 text-lg">

                    {staff.role}
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