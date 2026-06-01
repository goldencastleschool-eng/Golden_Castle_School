import { motion } from "framer-motion";
motion
export default function TeamCards() {
  const staffData = [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779360083/WhatsApp_Image_2026-05-21_at_11.40.24_AM_1_gsozsa.jpg",
      name: "Mrs. Esther James",
      title: "The Proprietress",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779130822/WhatsApp_Image_2026-05-18_at_7.10.03_PM_emrfti.jpg",
      name: "Dr. Rosemary Mbaeze",
      title: "The Principal",
    },
    {
      id: 3,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779130815/WhatsApp_Image_2026-05-18_at_7.10.03_PM_1_zbdoew.jpg",
      name: "Mr. Charles Ndoh",
      title: "The Vice Principal",
    },
    
  ];

  return (
    <section className="w-full bg-background py-10 px-6 lg:px-16">
      
      {/* Heading */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">
          Our Team
        </h1>

        <div className="w-24 h-1.5 bg-button mx-auto mt-4 rounded-full"></div>

        <p className="max-w-2xl mx-auto mt-6 text-secondary/70 text-lg leading-relaxed">
          Meet the dedicated leaders and educators committed to nurturing
          excellence, character, and success at Golden Castle International School.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2  md:grid-cols-3 gap-10 max-w-7xl mx-auto">

        {staffData.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.2,
            }}
            viewport={{ once: true }}
            whileHover={{
              y: -10,
              scale: 1.03,
            }}
            className="group relative overflow-hidden rounded-3xl bg-secondary shadow-2xl"
          >

            {/* Image */}
            <div className="overflow-hidden">
              <img
                src={`${staff.image}?w=800`}
                alt={staff.name}
                className="w-full h-[420px] object-cover group-hover:scale-110 transition duration-700"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 text-primary">

              <span className="inline-block px-4 py-1 bg-button text-secondary text-sm font-semibold rounded-full mb-4">
                {staff.title}
              </span>

              <h2 className="text-2xl font-bold tracking-wide">
                {staff.name}
              </h2>

              <div className="w-16 h-1 bg-button rounded-full mt-3"></div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-button/10 opacity-0 group-hover:opacity-100 blur-2xl transition duration-500"></div>

          </motion.div>
        ))}
      </div>
    </section>
  );
}