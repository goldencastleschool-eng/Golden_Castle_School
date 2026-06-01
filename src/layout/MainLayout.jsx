
import Hero from "../components/common/Hero.jsx";
import About from "../components/AboutUs.jsx";
import Program from "../components/Program.jsx";
import Team from "../components/Team.jsx";
import Contact from "../components/Contact.jsx"; 
import FAQ from "../components/FAQ.jsx";
import Video from "../components/Video.jsx"


export default function MainLayout() {
  return (
    
    <>
      <Hero />
      <About />
      <Program />
      <Team />
      <Video/>
      <Contact />
      <FAQ />
    </>
  )
}
