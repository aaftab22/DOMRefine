export default function Footer() {
  const links = ["Docs", "Blog", "Pricing", "Status"];

  return (
    <footer className="hp-footer">
      <div className="hp-footer__inner">
        {/* Brand */}
        <div className="hp-footer__brand">
          <div className="hp-footer__brand-row">
            <span
              className="material-symbols-outlined hp-footer__brand-icon"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              terminal
            </span>
            <span className="hp-footer__brand-name">DOMRefine</span>
          </div>
          <p className="hp-footer__copy">
            © 2024 DOMRefine Technical Systems. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <ul className="hp-footer__links">
          {links.map((link) => (
            <li key={link}>
              <a href="#" id={`footer-${link.toLowerCase()}`}>{link}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
