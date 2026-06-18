import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { FaChevronDown } from "react-icons/fa";

/* =========================
   FAQ DATA
========================= */

const faqs = [
  {
    question: "How do I apply or enroll my child?",
    answer:
      "Parents or guardians can begin the admission process by completing our admission application form and submitting the required documents. After review, successful applicants may be invited for assessment and enrollment. For detailed guidance, please contact our admissions office.",
  },

  {
    question:
      "Do you require entrance exams or previous transcripts?",
    answer:
      "Yes. Depending on the class level, prospective students may be required to sit for an entrance assessment and provide previous academic records or transcripts. This helps us place students appropriately and support their academic success.",
  },

  {
    question: "What are the school hours?",
    answer:
      "School activities typically begin at 7:00 AM and end at 3:30 PM. However, schedules may vary for Nursery, Basic, Secondary, extracurricular programs, and boarding students.",
  },

  {
    question:
      "Do you provide school bus transportation or parking passes?",
    answer:
      "Yes. We offer transportation services for students within selected routes. Parents can contact the school administration for route availability, fees, and registration details. Visitor parking is also available when required.",
  },

  {
    question:
      "What safety and security measures do you have ?",
    answer:
      "The safety of our students is a top priority. Our school is secured with trained security personnel, controlled access points, visitor screening procedures, emergency response plans, and continuous staff supervision to ensure a safe learning environment.",
  },

  {
    question:
      "Do you enforce a school uniform or dress code?",
    answer:
      "Yes. All students are required to wear the approved school uniform and adhere to the school's dress code. This promotes discipline, equality, school identity, and a professional learning environment.",
  },
];

/* =========================
   COMPONENT
========================= */

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(
      activeIndex === index ? null : index
    );
  };

  return (
    <section className="bg-background px-6 py-12 lg:px-10">

      <div className="max-w-6xl mx-auto">

        {/* =========================
            SECTION HEADER
        ========================= */}
        <div className="mb-10 text-center">

          <p className="font-bold uppercase tracking-wide text-button">FAQ</p>

          <h2 className="mt-4 text-3xl font-extrabold text-secondary md:text-4xl">

            Everything You Need To Know
          </h2>

          <div className="mx-auto mt-5 h-1.5 w-20 rounded-full bg-button"></div>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-secondary/70 md:text-lg">

            Find answers to common questions about admissions,
            academics, transportation, safety, and student life at
            Golden Castle International School.
          </p>
        </div>

        {/* =========================
            FAQ ITEMS
        ========================= */}

        <div className="space-y-5">

          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
              className="overflow-hidden rounded-lg bg-secondary shadow-md"
            >

              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full cursor-pointer items-center justify-between p-6 text-left"
              >

                <h3 className="text-lg md:text-xl font-bold text-primary pr-4">

                  {faq.question}
                </h3>

                <motion.div
                  animate={{
                    rotate:
                      activeIndex === index
                        ? 180
                        : 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                  className="text-button flex-shrink-0"
                >
                  <FaChevronDown />
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence>

                {activeIndex === index && (
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0,
                    }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="overflow-hidden"
                  >

                    <div className="px-7 pb-7 border-t border-primary/10">

                      <p className="pt-5 text-primary/70 leading-relaxed text-lg">

                        {faq.answer}
                      </p>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
