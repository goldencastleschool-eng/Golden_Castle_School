import { motion } from "framer-motion";
import { FaPlayCircle } from "react-icons/fa";

export default function GraduationVideo() {
return ( <section className="relative w-full overflow-hidden bg-background px-6 py-12 lg:px-10">

  <div className="relative z-10 max-w-7xl mx-auto">

    {/* Heading */}
    <div className="mb-10 text-center">

      <h2 className="text-3xl font-extrabold text-secondary md:text-4xl">
        2nd Graduation Ceremony
      </h2>

      <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-button"></div>

      <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-secondary/70 md:text-lg">
        Relive the memorable moments from the 2nd Graduation Ceremony
        of Golden Castle International School as we celebrate excellence,
        achievement, and the successful completion of another important
        chapter in our students' educational journey.
      </p>

    </div>

    {/* Video Section */}
    <motion.div
      initial={{
        opacity: 0,
        y: 60,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
      }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-lg border border-secondary/10 shadow-lg"
    >

      {/* Video */}
      <div className="relative aspect-video w-full bg-secondary/10">

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <FaPlayCircle className="text-button text-5xl" />

          <p className="max-w-xl text-secondary/70">
            Graduation ceremony video
          </p>
        </div>

        <iframe
          className="relative z-10 w-full h-full"
          src="https://www.youtube.com/embed/6tIbBWeX4J0"
          title="Golden Castle International School 2nd Graduation Ceremony"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

      </div>

      {/* Bottom Content */}
      <div className="hidden bg-secondary p-6 md:block">

        <div className="flex items-center gap-3 mb-4">

          <FaPlayCircle className="text-button text-2xl" />

          <h2 className="text-2xl font-bold text-primary">
            Celebrating Excellence & Achievement
          </h2>

        </div>

        <p className="text-primary/70 leading-relaxed text-lg">
          Our 2nd Graduation Ceremony was a proud occasion that
          recognized the hard work, dedication, and accomplishments
          of our graduating students. It was a day filled with joy,
          inspiration, and memorable moments shared by students,
          parents, staff, and well-wishers.
        </p>

      </div>

    </motion.div>

  </div>
</section>
)
}
