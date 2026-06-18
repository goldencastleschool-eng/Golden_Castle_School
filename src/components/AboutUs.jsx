import {
  FaStar,
  FaBalanceScale,
  FaHandshake,
  FaUserGraduate,
  FaClipboardCheck,
} from "react-icons/fa";

import { MdLightbulb } from "react-icons/md";
import { NavLink } from "react-router-dom";

export default function Values() {
  const values = [
    {
      icon: <FaStar />,
      title: "Excellence",
    },
    {
      icon: <FaBalanceScale />,
      title: "Integrity",
    },
    {
      icon: <FaClipboardCheck />,
      title: "Discipline",
    },
    {
      icon: <MdLightbulb />,
      title: "Innovation",
    },
    {
      icon: <FaHandshake />,
      title: "Respect",
    },
    {
      icon: <FaUserGraduate />,
      title: "Scholars",
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-background px-6 py-12 lg:px-10">

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Heading */}
        <div className="mb-10 flex flex-col items-center text-center">

          <h2 className="mt-2 text-3xl font-extrabold text-secondary md:text-4xl">
            About Us
          </h2>

          <div className="mt-4 h-1.5 w-20 rounded-full bg-button"></div>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-secondary/70 md:text-lg">
              Discover a learning environment where academic excellence,
              character development, and innovation come together to inspire
              students to grow, lead, and succeed.
            </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">

          {/* Left Content */}
          <div className="space-y-8">

            <div className="rounded-lg border border-secondary/10 bg-secondary/5 p-6 shadow-md">

              <p className="text-secondary text-lg leading-relaxed first-letter:text-6xl first-letter:font-bold first-letter:text-button">
                Golden Castle International School, Oba is a center of
                academic excellence dedicated to raising confident,
                responsible, and future-ready scholars. We are passionate
                about providing quality education in a safe, inspiring,
                and nurturing environment where every child is encouraged
                to discover and maximize their potential.
              </p>

              <p className="text-secondary text-lg leading-relaxed mt-6">
                At Golden Castle International School, we believe education
                goes beyond the classroom. Our mission is to develop students
                intellectually, morally, socially, and creatively, preparing
                them to succeed in an ever-changing global society. Through
                modern teaching methods, experienced educators, and a
                student-centered approach, we equip our learners with the
                knowledge, skills, and values needed for lifelong success.
              </p>

              {/* Button */}
              <div className="mt-8">
                <NavLink
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-lg bg-button px-6 py-3 font-bold text-secondary shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:text-primary"
                >
                  Learn More
                </NavLink>
              </div>

            </div>
          </div>

          {/* Right Content - Values */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">

            {values.map((value, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg bg-secondary p-5 text-primary shadow-md transition-all duration-300 hover:-translate-y-1 sm:p-6"
              >

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-button/10 opacity-0 group-hover:opacity-100 transition duration-300"></div>

                <div className="relative z-10 flex flex-col items-center text-center gap-5">

                  {/* Icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-3xl text-primary transition duration-300 group-hover:bg-button group-hover:text-secondary sm:h-16 sm:w-16">
                    {value.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold tracking-wide sm:text-xl">
                    {value.title}
                  </h3>

                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}
