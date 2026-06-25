import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";



const slides = [
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222515/imageslider3_bd8xdu.png",
    position: "object-[58%_center]",
  },
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222145/imageslider1_ew3bwz.png",
    position: "object-[54%_center]",
  },
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222010/imageslider2_s6guyg.png",
    position: "object-[62%_center]",
  },
];





/* =========================
   Modern Slider
========================= */

function Slider() {
  return (
    <div className="relative h-[700px] w-full sm:h-screen">

      <Carousel
        autoPlay
        infiniteLoop
        showThumbs={false}
        showStatus={false}
        interval={5000}
        transitionTime={1000}
        showArrows={false}
        swipeable
        emulateTouch
        stopOnHover={false}
        showIndicators={true}
      >

        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative h-[700px] w-full overflow-hidden sm:h-screen"
          >

            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className={`h-[700px] w-full object-cover ${slide.position} scale-105 animate-[slowZoom_12s_linear_infinite] sm:h-screen sm:object-center`}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/55"></div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export default Slider;
