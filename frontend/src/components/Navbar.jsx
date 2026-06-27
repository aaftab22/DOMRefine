import { useState, useEffect } from "react";

export default function Navbar({ onStartAudit }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`hp-nav${scrolled ? " hp-nav--scrolled" : ""}`}>
      <div className="hp-nav__inner">
        {/* Brand */}
        <div className="hp-nav__brand">
          <span className="material-symbols-outlined hp-nav__brand-icon"
            style={{ fontVariationSettings: '"FILL" 1' }}>
            terminal
          </span>
          <span className="hp-nav__brand-name">DOMRefine</span>
        </div>

        {/* Desktop nav links */}
        <nav aria-label="Main navigation">
          <ul className="hp-nav__links">
            <li><a href="#features">Docs</a></li>
            <li><a href="#features">Pricing</a></li>
            <li><a href="#features">Features</a></li>
            <li>
              <div className="hp-nav__lang">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>language</span>
                EN
              </div>
            </li>
          </ul>
        </nav>

        {/* Actions */}
        <div className="hp-nav__actions">
          <button className="hp-nav__login" id="nav-login">Log in</button>
          <button
            className="hp-nav__signup"
            id="nav-signup"
            onClick={onStartAudit}
          >
            Sign up for FREE
          </button>
        </div>
      </div>
    </header>
  );
}
