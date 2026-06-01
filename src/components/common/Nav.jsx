import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  FaBars,
  FaXmark,
} from "react-icons/fa6";

import {
  AnimatePresence,
  motion,
} from "framer-motion";



/* =========================
   NAVIGATION LINKS
========================= */

const NAV_LINKS = [
  {
    name: "Home",
    path: "/",
  },

  {
    name: "About",
    path: "/about",
  },

  {
    name: "Programs",
    path: "/programs",
  },

  {
    name: "Gallery",
    path: "/gallery",
  },

  {
    name: "Contact",
    path: "/contact",
  },
];



export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);



  /* =========================
     CLOSE MENU ON ESC KEY
  ========================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);



  /* =========================
     PREVENT BODY SCROLL
  ========================= */

  useEffect(() => {
    document.body.style.overflow = isMenuOpen
      ? "hidden"
      : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);



  /* =========================
     NAV LINK STYLES
  ========================= */

  const desktopNavStyle = ({ isActive }) =>
    `
      relative pb-2 font-semibold transition-all duration-300
      ${
        isActive
          ? "text-button"
          : "text-primary hover:text-button"
      }
    `;

  const mobileNavStyle = ({ isActive }) =>
    `
      flex items-center justify-between
      px-5 py-4 rounded-2xl
      text-lg font-semibold
      transition-all duration-300
      
      ${
        isActive
          ? "bg-button text-secondary shadow-lg"
          : "bg-primary/5 text-primary hover:bg-button hover:text-secondary"
      }
    `;



  return (
    <>
      {/* =========================
          DESKTOP NAVIGATION
      ========================= */}

      <nav className="hidden items-center gap-8 md:flex">

        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={desktopNavStyle}
          >
            {({ isActive }) => (
              <div className="relative">

                <span>{link.name}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeNavigation"
                    className="absolute left-0 -bottom-1 h-[3px] w-full rounded-full bg-button"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                  />
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>



      {/* =========================
          MOBILE MENU BUTTON
      ========================= */}

      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setIsMenuOpen(true)}
        className="
          flex h-12 w-12 items-center justify-center
          rounded-2xl border border-secondary/10
          bg-secondary/10 text-xl text-primary
          transition-all duration-300
          hover:bg-button hover:text-secondary
          md:hidden
        "
      >
        <FaBars />
      </button>



      {/* =========================
          MOBILE MENU
      ========================= */}

      <AnimatePresence>

        {isMenuOpen && (
          <>
            {/* OVERLAY */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />



            {/* SIDEBAR */}

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 25,
              }}
              className="
                fixed right-0 top-0 z-50
                flex h-screen w-[85%] flex-col
                bg-secondary shadow-2xl
                sm:w-[400px]
              "
            >

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-primary/10 px-6 py-6">

                <h2 className="text-2xl font-bold text-primary">
                  Menu
                </h2>



                {/* CLOSE BUTTON */}

                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMenuOpen(false)}
                  className="
                    flex h-12 w-12 items-center justify-center
                    rounded-2xl bg-primary/10
                    text-primary transition-all duration-300
                    hover:bg-button hover:text-secondary
                  "
                >
                  <FaXmark className="text-2xl" />
                </button>
              </div>



              {/* MOBILE LINKS */}

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">

                {NAV_LINKS.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08,
                    }}
                  >
                    <NavLink
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={mobileNavStyle}
                    >
                      <span>{link.name}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>



              {/* FOOTER */}

              <div className="border-t border-primary/10 bg-primary/5 p-6">

                <p className="font-semibold text-primary">
                  Reach For Gold
                </p>

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}