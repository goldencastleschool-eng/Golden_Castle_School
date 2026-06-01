import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";



const  slideImage1 = "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222515/imageslider3_bd8xdu.png";
const  slideImage2 =  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222145/imageslider1_ew3bwz.png";
const  slideImage3 =  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222010/imageslider2_s6guyg.png";





/* =========================
   Modern Slider
========================= */

function Slider() {
  return (
    <div className="relative w-full h-screen">

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

        {[slideImage1, slideImage2, slideImage3].map((image, index) => (
          <div
            key={index}
            className="relative w-full h-screen overflow-hidden"
          >

            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-screen object-cover scale-105 animate-[slowZoom_12s_linear_infinite]"
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
