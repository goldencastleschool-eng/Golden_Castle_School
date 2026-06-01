import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

import { FaArrowLeft, FaSchool } from "react-icons/fa";

export default function NotFound() {
  return (
    <section className="relative w-full overflow-hidden bg-background flex items-center justify-center px-5 py-10">

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

      {/* Floating Shapes */}
      <div className="absolute top-20 left-10 w-24 h-24 border border-button/20 rounded-full animate-pulse"></div>

      <div className="absolute bottom-20 right-10 w-32 h-32 border border-secondary/20 rounded-full animate-bounce"></div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-3xl w-full"
      >

        <div className="bg-secondary/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-primary/10">

          {/* Top Accent */}
          <div className="h-2 w-full bg-button"></div>

          <div className="p-2 sm:p-12 text-center">

            {/* Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="w-28 h-28 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-button text-6xl shadow-lg"
            >
              <FaSchool />
            </motion.div>

            {/* 404 */}
            <h1 className="text-[6rem] sm:text-[8rem] md:text-[10rem] font-extrabold leading-none text-primary mt-4">
              404
            </h1>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-2">
              Page Not Found
            </h2>

            {/* Description */}
            <p className="text-primary/80 text-lg leading-relaxed mt-4 max-w-2xl mx-auto">

              Oops! The page you are looking for may have been moved,
              deleted, or does not exist. Let’s help you find your way
              back to Golden Castle International School.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10">

              {/* Home Button */}
              <NavLink to="/" className="w-full sm:w-auto">

                <button className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-button text-secondary font-semibold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 hover:shadow-button/30 transition-all duration-300 cursor-pointer">

                  <FaArrowLeft className="group-hover:-translate-x-1 transition duration-300" />

                  <span>Back Home</span>
                </button>
              </NavLink>

              {/* Contact Button */}
              <NavLink to="/contact" className="w-full sm:w-auto">

                <button className="w-full sm:w-auto border border-primary/20 bg-primary/5 backdrop-blur-md text-primary font-semibold px-8 py-4 rounded-2xl hover:bg-primary hover:text-secondary transition-all duration-300 cursor-pointer">

                  Contact School
                </button>
              </NavLink>
            </div>

            {/* Bottom Text */}
            <div className="mt-12 pt-6 border-t border-primary/10">

              <p className="text-primary/50 text-sm tracking-wide">
                Golden Castle International School • Reach For Gold
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}