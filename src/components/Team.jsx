import { motion } from "framer-motion";

export default function TeamCards() {
  const staffData = [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1780991798/WhatsApp_Image_2026-06-09_at_8.55.57_AM_hxqhey.jpg",
      name: "Mrs. Chinwendu Ibekwe",
      title: "The Proprietress",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779130822/WhatsApp_Image_2026-05-18_at_7.10.03_PM_emrfti.jpg",
      name: "Dr. Mrs. Roselin Mbaeze",
      title: "The Principal",
    },
    {
      id: 3,
      image:
        "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1779130815/WhatsApp_Image_2026-05-18_at_7.10.03_PM_1_zbdoew.jpg",
      name: "Mr. Charles Ndobu",
      title: "The Vice Principal",
    },
    
  ];

  return (
    <section className="w-full bg-background px-6 py-12 lg:px-10">
      
      {/* Heading */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-secondary md:text-4xl">
          Our Team
        </h2>

        <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-button"></div>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-secondary/70 md:text-lg">
          Meet the dedicated leaders and educators committed to nurturing
          excellence, character, and success at Golden Castle International School.
        </p>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">

        {staffData.map((staff, index) => (
          <motion.div
            key={staff.id}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: index * 0.08,
            }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{
              y: -4,
            }}
            className="group relative overflow-hidden rounded-lg bg-secondary shadow-md"
          >

            {/* Image */}
            <div className="overflow-hidden">
              <img
                src={`${staff.image}?w=800`}
                alt={staff.name}
                className="h-[380px] w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 text-primary">

              <span className="mb-4 inline-block rounded-full bg-button px-4 py-1 text-sm font-semibold text-secondary">
                {staff.title}
              </span>

              <h3 className="text-2xl font-bold tracking-wide">
                {staff.name}
              </h3>

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
