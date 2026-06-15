import { useState } from "react";

function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder — wire up to backend when ready
    console.log("Form submitted:", formData);
  };

  return (
    <section
      className="contact"
      id="contact"
      aria-labelledby="contact-headline"
    >
      <div className="contact__grid">
        {/* Left: copy + contact info */}
        <div className="contact__left">
          <h2 id="contact-headline">Get in touch with our experts</h2>
          <p>
            Have questions about our audit process or need a custom solution?
            Our team is here to help you optimize your web presence.
          </p>

          <div className="contact__info">
            <div className="contact-info-item">
              <div className="contact-info-item__icon contact-info-item__icon--blue">
                <span
                  className="material-symbols-outlined text-primary"
                >
                  mail
                </span>
              </div>
              <div>
                <p className="contact-info-item__label">Email Us</p>
                <p className="contact-info-item__value">hello@domrefine.com</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-item__icon contact-info-item__icon--green">
                <span
                  className="material-symbols-outlined text-secondary"
                >
                  location_on
                </span>
              </div>
              <div>
                <p className="contact-info-item__label">Location</p>
                <p className="contact-info-item__value">San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="contact__form-card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="contact-name" className="form-label">
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email" className="form-label">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message" className="form-label">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                className="form-input form-textarea"
                placeholder="How can we help?"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <button type="submit" id="contact-submit" className="form-submit">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
