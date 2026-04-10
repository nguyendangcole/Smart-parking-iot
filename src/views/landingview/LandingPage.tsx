import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Roles from './components/Roles';
import Infrastructure from './components/Infrastructure';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
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
