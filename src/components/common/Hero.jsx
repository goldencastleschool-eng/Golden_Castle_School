import { Suspense } from "react";

import { motion } from "framer-motion";

import {
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
    <section className="relative min-h-[640px] overflow-hidden bg-background sm:min-h-[calc(100vh-73px)]">

      {/* =========================
          BACKGROUND SLIDER
      ========================= */}

      <Suspense fallback={<HeroSkeleton />}>
        <Slider />
      </Suspense>



      {/* =========================
          DARK OVERLAY
      ========================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />



      {/* =========================
          HERO CONTENT
      ========================= */}

      <div className="absolute inset-0 z-10 flex items-center pb-10 sm:pb-0">

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
                lg:text-6xl
              "
            >
              Golden Castle International School
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
              Build future leaders with excellence and integrity through
              disciplined learning, creativity, leadership, and academic growth
              in a safe school environment.
            </p>



            {/* =========================
                ACTION BUTTONS
            ========================= */}

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">

              {/* LOGIN BUTTON */}

              <NavLink
                to="/login"
                className="
                  group inline-flex items-center justify-center gap-3
                  rounded-lg bg-button
                  px-6 py-4
                  font-semibold text-secondary
                  shadow-lg
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:shadow-button/30
                "
              >
                <span>Log In</span>

                <FaRegUser className="transition duration-300 group-hover:rotate-12" />
              </NavLink>



              {/* ENROLL BUTTON */}

              <NavLink
                to="/programs"
                className="
                  group inline-flex items-center justify-center gap-3
                  rounded-lg border border-primary/30 bg-secondary/15
                  px-6 py-4
                  font-semibold text-primary
                  shadow-lg backdrop-blur
                  transition-all duration-300
                  hover:-translate-y-0.5 hover:bg-button hover:text-secondary
                "
              >
                <span>Explore Programs</span>

                <FaRegUser className="transition duration-300 group-hover:rotate-12" />
              </NavLink>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
