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
    <section className="relative w-full bg-background py-10 px-6 lg:px-16 overflow-hidden">
      
      {/* Background Blur Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Heading */}
        <div className="flex flex-col items-center text-center mb-16">

          <h1 className="text-4xl md:text-5xl font-extrabold text-secondary mt-2">
            About Us
          </h1>

          <div className="w-24 h-1.5 bg-button rounded-full mt-4"></div>

          <p className="max-w-3xl mt-6 text-lg text-secondary/70 leading-relaxed">
              Discover a learning environment where academic excellence,
              character development, and innovation come together to inspire
              students to grow, lead, and succeed.
            </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left Content */}
          <div className="space-y-8">

            <div className="bg-secondary/5 border border-secondary/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">

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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-button text-secondary font-bold rounded-xl shadow-lg hover:scale-105 hover:bg-secondary hover:text-primary transition-all duration-300"
                >
                  Learn More
                </NavLink>
              </div>

            </div>
          </div>

          {/* Right Content - Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {values.map((value, index) => (
              <div
                key={index}
                className="group relative bg-secondary text-primary rounded-3xl p-8 shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-button/10 opacity-0 group-hover:opacity-100 transition duration-300"></div>

                <div className="relative z-10 flex flex-col items-center text-center gap-5">

                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl text-primary group-hover:scale-110 transition duration-300">
                    {value.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold tracking-wide">
                    {value.title}
                  </h2>

                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </section>
  );
}