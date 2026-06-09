import { motion } from "framer-motion";

import {
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

export default function Location() {
  return (
    <section className="relative w-full bg-background overflow-hidden py-10 px-5 sm:px-8 lg:px-16">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10">

          <h1 className="text-4xl sm:text-5xl font-extrabold text-secondary mt-4">
            Contact Us
          </h1>

          <div className="w-24 h-1.5 bg-button mx-auto mt-5 rounded-full"></div>

          <p className="max-w-3xl mx-auto mt-6 text-lg text-secondary/70 leading-relaxed">
                  We'd love to hear from you. Contact us for information about
                  admissions, programs, boarding facilities, or any other enquiries.
                
            </p>
        </div>

        

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">

          {/* ================= MAP SECTION ================= */}

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-secondary/10 shadow-2xl sm:min-h-[500px]"
          >

            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <div>
                <FaMapMarkerAlt className="mx-auto text-5xl text-button" />

                <p className="mt-4 text-lg font-semibold text-secondary">
                  Golden Castle International School, Oba
                </p>

                <p className="mt-2 text-secondary/70">
                  Anambra State, Nigeria
                </p>
              </div>
            </div>

            {/* Map */}
            <iframe
              title="Golden Castle International School Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3967.4382827088043!2d6.815550473646799!3d6.071481728253822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1043950042721211%3A0xd024cc4b2f7ba438!2sGolden%20Castle%20International%20School%20Oba!5e0!3m2!1sen!2sng!4v1776539818365!5m2!1sen!2sng"
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="relative z-10 min-h-[420px] w-full border-0 sm:min-h-[500px]"
            ></iframe>

            {/* Floating Info Card */}
            <div className="absolute bottom-5 left-5 right-5 bg-secondary/95 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-primary/10">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-button/10 flex items-center justify-center text-button text-2xl">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <h3 className="text-primary text-xl font-bold">
                    Our Location
                  </h3>

                  <p className="text-primary/80 mt-1">
                    Golden Castle International School, Oba,
                    Anambra State, Nigeria.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================= FORM SECTION ================= */}

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-secondary rounded-[2rem] shadow-2xl overflow-hidden"
          >

            <div className="p-8 sm:p-10">

              {/* Top Info */}
              <div className="mb-10">

                <h2 className="text-3xl font-bold text-primary">
                  Send Us a Message
                </h2>

                <p className="text-primary/70 mt-3 leading-relaxed">
                  Fill out the form below and our team will get back
                  to you as soon as possible.
                </p>
              </div>

              {/* Contact Quick Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-button/10 flex items-center justify-center text-button">
                      <FaEnvelope />
                    </div>

                    <div>
                      <h4 className="text-primary font-semibold">
                        Email
                      </h4>

                      <p className="text-primary/70 text-sm">
                        info@goldencastle.edu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-button/10 flex items-center justify-center text-button">
                      <FaPhoneAlt />
                    </div>

                    <div>
                      <h4 className="text-primary font-semibold">
                        Phone
                      </h4>

                      <p className="text-primary/70 text-sm">
                        +234 XXX XXX XXXX
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form className="space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-primary font-medium mb-3">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary outline-none focus:border-button focus:ring-2 focus:ring-button/20 transition-all duration-300"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-primary font-medium mb-3">
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary outline-none focus:border-button focus:ring-2 focus:ring-button/20 transition-all duration-300"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-primary font-medium mb-3">
                    Message
                  </label>

                  <textarea
                    rows="6"
                    placeholder="Write your message here..."
                    className="w-full bg-primary/5 border border-primary/10 rounded-2xl px-5 py-4 text-primary outline-none resize-none focus:border-button focus:ring-2 focus:ring-button/20 transition-all duration-300"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="group w-full bg-button text-secondary font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-button/30 transition-all duration-300 cursor-pointer"
                >

                  <span className="flex items-center justify-center gap-3">

                    Send Message

                    <FaEnvelope className="group-hover:translate-x-1 transition duration-300" />
                  </span>
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
