import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import TheMagic from "@/components/sections/TheMagic";
import GettingStarted from "@/components/sections/GettingStarted";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TheMagic />
        <GettingStarted />
      </main>
      <Footer />
    </>
  );
}
