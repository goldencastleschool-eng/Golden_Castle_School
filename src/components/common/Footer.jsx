import Logo from "../common/Logo.jsx";

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaWhatsapp,
} from "react-icons/fa";

import { MdEmail } from "react-icons/md";

const contactLinks = [
  {
    title: "WhatsApp",
    text: "Chat with admissions",
    href: "https://wa.me/2348035008212",
    icon: <FaWhatsapp />,
  },
  {
    title: "Call School",
    text: "+234 803 5008 212",
    href: "tel:+2348035008212",
    icon: <FaPhoneAlt />,
  },
  {
    title: "Email",
    text: "goldencastlegci@gmail.com",
    href: "mailto:goldencastlegci@gmail.com",
    icon: <MdEmail />,
  },
];

export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-5">
            <Logo />

            <p className="max-w-md text-base leading-relaxed text-primary/75">
              Golden Castle International School is committed to academic
              excellence, discipline, innovation, and the development of
              future-ready leaders in a safe learning environment.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {contactLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  aria-label={link.title}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/10 bg-primary/10 text-primary transition-all duration-300 hover:bg-button hover:text-secondary"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bold text-primary">
              Contact Us
            </h2>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg text-button">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <h3 className="mb-1 font-semibold text-primary">Address</h3>
                  <p className="leading-relaxed text-primary/70">
                    #2 Adiobele Along Onitsha - Owerri Rd, Oba, Nigeria
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg text-button">
                  <FaPhoneAlt />
                </div>

                <div>
                  <h3 className="mb-1 font-semibold text-primary">Phone</h3>
                  <p className="text-primary/70">+234 803 5008 212</p>
                  <p className="text-primary/70">+234 703 6400 522</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg text-button">
                  <MdEmail />
                </div>

                <div>
                  <h3 className="mb-1 font-semibold text-primary">Email</h3>
                  <p className="break-words text-primary/70">
                    goldencastlegci@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bold text-primary">
              Quick Actions
            </h2>

            <div className="space-y-4">
              {contactLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="group flex items-center gap-4 rounded-lg border border-primary/10 bg-primary/5 p-4 transition-all duration-300 hover:bg-button"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition duration-300 group-hover:text-secondary">
                    {link.icon}
                  </div>

                  <div>
                    <h3 className="font-semibold text-primary transition duration-300 group-hover:text-secondary">
                      {link.title}
                    </h3>
                    <p className="text-sm text-primary/70 transition duration-300 group-hover:text-secondary/80">
                      {link.text}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary/10 bg-button">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-4 sm:px-8 md:flex-row lg:px-10">
          <p className="text-center text-sm font-medium text-secondary md:text-left">
            Copyright © 2026 Golden Castle International School. All Rights
            Reserved.
          </p>

          <p className="text-sm font-semibold text-secondary/80">
            Reach For Gold
          </p>
        </div>
      </div>
    </footer>
  );
}
