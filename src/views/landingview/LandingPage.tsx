import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Stats from './components/Stats';
import Roles from './components/Roles';
import Infrastructure from './components/Infrastructure';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function LandingPage() {
  // overflow-x-clip (not -hidden) clips horizontal overflow from motion's
  // fadeLeft/fadeRight reveals while leaving the y-axis as `visible`. Using
  // `hidden` would couple overflow-y to `auto` per the CSS spec — that's what
  // was producing a second vertical scrollbar on this div alongside the
  // page's main one.
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-clip">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <Roles />
        <Infrastructure />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
