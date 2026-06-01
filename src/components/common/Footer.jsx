import Logo from "../common/Logo.jsx";

import {
  FaFacebookF,
  FaWhatsapp,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";

import { MdEmail } from "react-icons/md";

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-secondary">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>

      {/* Main Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">

          {/* ================= LOGO SECTION ================= */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >

            <Logo />

            <p className="text-primary/75 leading-relaxed text-base">
              Golden Castle International School is committed to
              academic excellence, discipline, innovation, and the
              development of future-ready leaders in a safe and
              inspiring learning environment.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 pt-2">

              <a
                href="#"
                className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary hover:bg-button hover:text-secondary transition-all duration-300"
              >
                <FaFacebookF />
              </a>

              <a
                href="#"
                className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary hover:bg-button hover:text-secondary transition-all duration-300"
              >
                <FaWhatsapp />
              </a>

              <a
                href="#"
                className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary hover:bg-button hover:text-secondary transition-all duration-300"
              >
                <FaYoutube />
              </a>
            </div>
          </motion.div>

          {/* ================= CONTACT SECTION ================= */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >

            <h2 className="text-2xl font-bold text-primary mb-8">
              Contact Us
            </h2>

            <div className="space-y-6">

              {/* Address */}
              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-button text-xl shrink-0">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <h3 className="text-primary font-semibold mb-1">
                    Address
                  </h3>

                  <p className="text-primary/70 leading-relaxed">
                    #2 Adiobele Along Onitsha - Owerri Rd,
                    Oba, Nigeria
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-button text-xl shrink-0">
                  <FaPhoneAlt />
                </div>

                <div>
                  <h3 className="text-primary font-semibold mb-1">
                    Phone
                  </h3>

                  <p className="text-primary/70">
                    +234 803 5008 212
                  </p>

                  <p className="text-primary/70">
                    +234 703 6400 522
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-button text-xl shrink-0">
                  <MdEmail />
                </div>

                <div>
                  <h3 className="text-primary font-semibold mb-1">
                    Email
                  </h3>

                  <p className="text-primary/70 break-words">
                    goldencastlegci@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= SOCIAL SECTION ================= */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >

            <h2 className="text-2xl font-bold text-primary mb-8">
              Follow Us
            </h2>

            <div className="space-y-5">

              {/* Facebook */}
              <a
                href="#"
                className="group flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5 hover:bg-button transition-all duration-300"
              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:text-secondary transition duration-300">
                  <FaFacebookF />
                </div>

                <div>
                  <h3 className="text-primary group-hover:text-secondary font-semibold transition duration-300">
                    Facebook
                  </h3>

                  <p className="text-primary/70 group-hover:text-secondary/80 text-sm transition duration-300">
                    @GoldenCastleIntl
                  </p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="#"
                className="group flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5 hover:bg-button transition-all duration-300"
              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:text-secondary transition duration-300">
                  <FaWhatsapp />
                </div>

                <div>
                  <h3 className="text-primary group-hover:text-secondary font-semibold transition duration-300">
                    WhatsApp
                  </h3>

                  <p className="text-primary/70 group-hover:text-secondary/80 text-sm transition duration-300">
                    @GoldenCastleIntl
                  </p>
                </div>
              </a>

              {/* YouTube */}
              <a
                href="#"
                className="group flex items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5 hover:bg-button transition-all duration-300"
              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:text-secondary transition duration-300">
                  <FaYoutube />
                </div>

                <div>
                  <h3 className="text-primary group-hover:text-secondary font-semibold transition duration-300">
                    YouTube
                  </h3>

                  <p className="text-primary/70 group-hover:text-secondary/80 text-sm transition duration-300">
                    @GoldenCastleIntl
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}

      <div className="relative z-10 border-t border-primary/10 bg-button/95 backdrop-blur-md">

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-secondary text-center md:text-left text-sm sm:text-base font-medium">
            Copyright © 2024 Golden Castle International School.
            All Rights Reserved.
          </p>

          <p className="text-secondary/80 text-sm">
            Reach For Gold
          </p>
        </div>
      </div>
    </footer>
  );
}