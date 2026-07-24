import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";



const slides = [
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/f_auto,q_auto:good,w_1600,c_limit/v1777222515/imageslider3_bd8xdu.png",
    position: "object-[58%_center]",
  },
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/f_auto,q_auto:good,w_1600,c_limit/v1777222145/imageslider1_ew3bwz.png",
    position: "object-[54%_center]",
  },
  {
    image: "https://res.cloudinary.com/dadane1xo/image/upload/f_auto,q_auto:good,w_1600,c_limit/v1777222010/imageslider2_s6guyg.png",
    position: "object-[62%_center]",
  },
];





/* =========================
   Modern Slider
========================= */

function Slider() {
  return (
    <div className="absolute inset-0 h-full w-full [&_.carousel-root]:h-full [&_.carousel]:h-full [&_.control-dots]:z-20 [&_.slide]:h-full [&_.slider-wrapper]:h-full [&_.slider]:h-full">

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
            className="relative h-full w-full overflow-hidden"
          >

            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
              decoding="async"
              className={`h-full w-full object-cover ${slide.position} scale-105 animate-[slowZoom_12s_linear_infinite]`}
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
