import { motion } from "framer-motion";
import { FaPlayCircle } from "react-icons/fa";

export default function GraduationVideo() {
return ( <section className="relative w-full bg-background py-20 px-6 lg:px-16 overflow-hidden">

```
  {/* Background Glow */}
  <div className="absolute top-0 left-0 w-72 h-72 bg-button/10 rounded-full blur-3xl"></div>

  <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>

  <div className="relative z-10 max-w-7xl mx-auto">

    {/* Heading */}
    <div className="text-center mb-16">

      <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">
        2nd Graduation Ceremony
      </h1>

      <div className="w-24 h-1.5 bg-button mx-auto mt-4 rounded-full"></div>

      <p className="max-w-3xl mx-auto mt-6 text-secondary/70 text-lg leading-relaxed">
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
      className="overflow-hidden rounded-[2rem] shadow-2xl border border-secondary/10"
    >

      {/* Video */}
      <div className="aspect-video w-full">

        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/6tIbBWeX4J0"
          title="Golden Castle International School 2nd Graduation Ceremony"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

      </div>

      {/* Bottom Content */}
      <div className="bg-secondary p-8">

        <div className="flex items-center gap-3 mb-4">

          <FaPlayCircle className="text-button text-2xl" />

          <h2 className="text-2xl font-bold text-primary">
            Celebrating Excellence & Achievement
          </h2>

        </div>

        <p className="hidden md:block text-primary/70 leading-relaxed text-lg">
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