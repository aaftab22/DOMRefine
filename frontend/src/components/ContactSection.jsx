import { useState, useRef, useEffect } from "react";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) entry.target.classList.add("hp-reveal--visible"); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", form);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="hp-contact">
      <div className="hp-contact__inner">

        {/* Left — info */}
        <div className="hp-contact__left hp-reveal" ref={sectionRef}>
          <h2 className="hp-contact__title">Get in touch with our experts</h2>
          <p className="hp-contact__desc">
            Have questions about our audit process or need a custom solution?
            Our team is here to help you optimize your web presence.
          </p>

          <div className="hp-contact__info">
            <div className="hp-contact__info-item">
              <div className="hp-contact__info-icon">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <p className="hp-contact__info-label">Email Us</p>
                <p className="hp-contact__info-value">aaftabv22@gmail.com</p>
              </div>
            </div>

            <div className="hp-contact__info-item">
              <div className="hp-contact__info-icon">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <p className="hp-contact__info-label">Location</p>
                <p className="hp-contact__info-value">Toronto, ON</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="hp-contact__form-card">
          <form className="hp-contact__form" onSubmit={handleSubmit}>
            <div className="hp-contact__field">
              <label htmlFor="contact-name" className="hp-contact__label">Name</label>
              <input
                id="contact-name"
                type="text"
                className="hp-contact__input"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>

            <div className="hp-contact__field">
              <label htmlFor="contact-email" className="hp-contact__label">Email</label>
              <input
                id="contact-email"
                type="email"
                className="hp-contact__input"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="hp-contact__field">
              <label htmlFor="contact-message" className="hp-contact__label">Message</label>
              <textarea
                id="contact-message"
                className="hp-contact__textarea"
                placeholder="How can we help?"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <button type="submit" className="hp-contact__submit" id="contact-submit">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
