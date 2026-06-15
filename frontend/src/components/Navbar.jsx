function Navbar({ onStartAudit }) {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__logo">DOMRefine</div>

      <ul className="navbar__links">
        <li><a href="#features">Features</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>

      <button className="navbar__cta" id="navbar-start-audit" onClick={onStartAudit}>
        Start Audit
      </button>
    </nav>
  );
}

export default Navbar;
