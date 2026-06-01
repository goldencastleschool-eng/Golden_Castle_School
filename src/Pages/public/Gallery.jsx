import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import { motion } from "framer-motion";

import {
  FaCamera,
  FaImages,
} from "react-icons/fa6";

/* =========================
   IMAGES
========================= */

const galleryImages = [
  {
    id: 1,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225411/IMG-20240311-WA0021_v5qowf.jpg",
  },

  {
    id: 2,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225378/IMG-20240309-WA0029_hi7lqj.jpg",
  },

  {
    id: 3,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225378/IMG-20240309-WA0050_golcro.jpg",
  },

  {
    id: 4,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225377/IMG-20240309-WA0052_se4ma7.jpg",
  },

  {
    id: 5,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225375/IMG-20240309-WA0048_ovu8cu.jpg",
  },

  {
    id: 6,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225362/IMG-20240309-WA0040_etjxdf.jpg",
  },

  {
    id: 7,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225359/IMG-20240309-WA0041_racgny.jpg",
  },

  {
    id: 8,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225333/IMG-20240309-WA0025_bg7koo.jpg",
  },

  {
    id: 9,
    image:
      "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777225354/IMG-20240309-WA0026_h6ss1i.jpg",
  },
];

/* =========================
   COMPONENT
========================= */

export default function Gallery() {
  return (
    <>
      <section className="relative overflow-hidden bg-background py-20 px-4 sm:px-6 lg:px-12">

        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

        <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* =========================
              HEADER
          ========================= */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >

            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-secondary border border-primary/10 shadow-lg">
              <FaCamera className="text-button" />

              <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                School Gallery
              </span>
            </div>
          </motion.div>

          {/* =========================
              FEATURE CARD
          ========================= */}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="bg-secondary rounded-[2rem] overflow-hidden shadow-2xl border border-primary/10"
          >

            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 px-6 sm:px-10 py-8 border-b border-primary/10 bg-primary/5">

              <div>

                <h2 className="text-2xl sm:text-3xl font-bold text-primary">

                  The First Edition of the Cultural Event
                </h2>

                <p className="text-primary/70 mt-2">

                  Celebrating culture, talent, creativity, and unity.
                </p>
              </div>

              {/* Gallery Count */}
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-button text-secondary font-semibold shadow-lg w-fit">

                <FaImages />

                <span>{galleryImages.length} Photos</span>
              </div>
            </div>

            {/* =========================
                CAROUSEL
            ========================= */}

            <div className="relative">

              <Carousel
                autoPlay
                infiniteLoop
                interval={4000}
                transitionTime={800}
                swipeable
                emulateTouch
                showStatus={false}
                showArrows={true}
                showThumbs={true}
                thumbWidth={100}
                stopOnHover={true}
                className="gallery-carousel"
              >

                {galleryImages.map((item) => (
                  <div
                    key={item.id}
                    className="relative h-[300px] sm:h-[500px] lg:h-[700px] overflow-hidden"
                  >

                    {/* Image */}
                    <img
                      loading="lazy"
                      src={item.image}
                      alt={`Gallery ${item.id}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 text-left">

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-md border border-primary/10 text-primary text-sm mb-4">

                        <FaCamera className="text-button" />

                        Cultural Event Memories
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}