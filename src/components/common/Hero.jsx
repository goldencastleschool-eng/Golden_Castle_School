import { Suspense } from "react";

import { motion } from "framer-motion";

import {
  FaArrowRightFromBracket,
  FaRegUser,
} from "react-icons/fa6";

import { NavLink } from "react-router-dom";

import Slider from "./Slider";
import HeroSkeleton from "./Skeleton";



/* =========================
   HERO SECTION
========================= */

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">

      {/* =========================
          BACKGROUND SLIDER
      ========================= */}

      <Suspense fallback={<HeroSkeleton />}>
        <Slider />
      </Suspense>



      {/* =========================
          DARK OVERLAY
      ========================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />



      {/* =========================
          HERO CONTENT
      ========================= */}

      <div className="absolute inset-0 z-10 flex items-center">

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">

          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="max-w-5xl"
          >

            {/* =========================
                HEADING
            ========================= */}

            <h1
              className="
                font-logoFont
                text-4xl font-extrabold leading-tight text-primary
                sm:text-5xl
                md:text-6xl
                lg:text-7xl
              "
            >
              Build Future Leaders with{" "}

              <span className="text-button">
                Excellence
              </span>{" "}

              and Integrity
            </h1>



            {/* =========================
                DESCRIPTION
            ========================= */}

            <p
              className="
                mt-6 max-w-3xl
                text-sm leading-relaxed text-primary/90
                sm:text-base
                md:mt-8
                md:text-lg
                lg:text-xl
              "
            >
              At Golden Castle International School Oba, we provide
              a world-class education that nurtures creativity,
              discipline, leadership, and academic excellence in a
              safe and inspiring learning environment.
            </p>



            {/* =========================
                ACTION BUTTONS
            ========================= */}

            <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row">

              {/* LOGIN BUTTON */}

              <NavLink
                to="/login"
                className="
                  group inline-flex items-center justify-center gap-3
                  rounded-2xl bg-button
                  px-6 py-4
                  font-semibold text-secondary
                  shadow-2xl
                  transition-all duration-300
                  hover:scale-105
                  hover:shadow-button/30
                "
              >
                <span>Log In</span>

                <FaRegUser className="transition duration-300 group-hover:rotate-12" />
              </NavLink>



              {/* ENROLL BUTTON */}

              <button
                type="button"
                className="
                  group inline-flex items-center justify-center gap-3
                  rounded-2xl border border-primary/30
                  bg-primary/10
                  px-6 py-4
                  font-semibold text-primary
                  backdrop-blur-md
                  transition-all duration-300
                  hover:border-button
                  hover:bg-button
                  hover:text-secondary
                "
              >
                <span>Enroll Now</span>

                <FaArrowRightFromBracket className="transition duration-300 group-hover:translate-x-1" />
              </button>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}