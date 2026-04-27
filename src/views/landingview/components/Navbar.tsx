import { useEffect, useRef, useState } from 'react';
import { ParkingCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Order mirrors the on-page section order so a click on each item moves the
// user predictably *down* the page rather than jumping back and forth. Labels
// match each section's actual content (Infrastructure for the IoT section,
// Testimonials for the community-voices section, etc.).
const NAV_ITEMS = [
  { label: 'Stats', href: '#Stats' },
  { label: 'Roles', href: '#Roles' },
  { label: 'Infrastructure', href: '#Infrastructure' },
  { label: 'Testimonials', href: '#Testimonials' },
] as const;

export default function Navbar() {
  const navigate = useNavigate();
  // null = nothing active yet (page just loaded, user hasn't scrolled into a
  // tracked section). This is what gives us "no underline by default".
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Maintain our own set of currently in-band sections — IntersectionObserver
  // entries only report transitions, not the steady-state set.
  const visibleIds = useRef<Set<string>>(new Set());
  // While a click-driven smooth scroll is in flight, suppress observer-driven
  // updates. Otherwise the underline would jitter through every intermediate
  // section the page passes through during the ~600ms glide.
  const isClickScrolling = useRef(false);
  const clickScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sections = NAV_ITEMS
      .map(({ href }) => document.getElementById(href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    // rootMargin shrinks the observed viewport to a thin ~10% band starting
    // 30% down from the top — so a section is "active" only when it's in the
    // upper-middle of the viewport (where the user is actually reading), not
    // just barely peeking at the bottom edge.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleIds.current.add(entry.target.id);
          } else {
            visibleIds.current.delete(entry.target.id);
          }
        });

        // Skip observer-driven updates while a click-scroll is animating —
        // the click handler has already locked the underline on the target.
        if (isClickScrolling.current) return;

        // Pick the first in-band section by document/nav order. This gives a
        // stable answer when two adjacent sections both overlap the band
        // briefly during scroll transitions.
        const firstVisible = NAV_ITEMS.find(({ href }) =>
          visibleIds.current.has(href.slice(1))
        );
        setActiveSection(firstVisible?.href ?? null);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      if (clickScrollTimer.current) clearTimeout(clickScrollTimer.current);
    };
  }, []);

  const handleNavClick = (href: string) => {
    setActiveSection(href);
    isClickScrolling.current = true;
    if (clickScrollTimer.current) clearTimeout(clickScrollTimer.current);
    // 800ms covers the typical native smooth-scroll duration with a small
    // buffer; afterwards the observer resumes so manual user scrolling is
    // tracked again immediately.
    clickScrollTimer.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-xl shadow-blue-900/5">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ParkingCircle className="text-primary" size={32} strokeWidth={2.5} />
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">
            HCMUT<span className="text-on-surface-variant font-medium">Parking</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tight">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = activeSection === href;
            return (
              <a
                key={href}
                href={href}
                // Locks the underline on the clicked target during the smooth
                // scroll glide; the observer takes over again afterwards.
                onClick={() => handleNavClick(href)}
                className={`border-b-2 pb-0.5 transition-all duration-300 hover:text-primary ${
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-on-surface-variant border-transparent'
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 text-sm font-bold bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            Portal
          </button>
        </div>
      </div>
    </nav>
  );
}
