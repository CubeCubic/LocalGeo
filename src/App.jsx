import { useState } from "react";
import "./App.css";

const services = [
  {
    number: "01",
    title: "Check",
    text: "We visit, inspect and document things when you can't be there.",
    icon: "⌕",
  },
  {
    number: "02",
    title: "Home",
    text: "Apartment checks, repairs, technicians, deliveries and local errands.",
    icon: "⌂",
  },
  {
    number: "03",
    title: "Pick up",
    text: "Documents, keys, packages, purchases and other items.",
    icon: "↗",
  },
  {
    number: "04",
    title: "Deliver",
    text: "We move things from one place to another safely and locally.",
    icon: "→",
  },
  {
    number: "05",
    title: "Something else",
    text: "Have a problem in Georgia? Tell us what you need.",
    icon: "＋",
  },
];

const cities = ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Other"];

function createRequestId() {
  return `LG-${Math.floor(100000 + Math.random() * 900000)}`;
}

function App() {
  const [form, setForm] = useState({
    type: "",
    city: "",
    address: "",
    description: "",
    timing: "As soon as possible",
    name: "",
    email: "",
    contact: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    const response = await fetch("https://localgeo.onrender.com/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit request.");
    }

    setRequestId(data.request.id);
    setSubmitted(true);
  } catch (error) {
    console.error("LocalGeo request error:", error);

    alert(
      "Something went wrong while sending your request. Please try again."
    );
  }
};

  const scrollToRequest = () => {
    document
      .getElementById("request")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <a href="#top" className="logo">
            <span className="logo-mark">L</span>
            <span>
              LOCAL<span>GEO</span>
            </span>
          </a>

          <nav className="nav">
            <a href="#how-it-works">How it works</a>
            <a href="#services">Services</a>
            <a href="#trust">Trust</a>
          </nav>

          <button className="header-button" onClick={scrollToRequest}>
            Request a task
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="status-dot"></span>
                LOCAL HELP IN GEORGIA
              </div>

              <h1>
                Need something
                <br />
                done in <em>Georgia?</em>
              </h1>

              <p className="hero-subtitle">
                You're not here.
                <br />
                <strong>We are.</strong>
              </p>

              <p className="hero-description">
                LocalGeo gives you trusted local hands when you need something
                checked, collected, delivered or handled in Georgia.
              </p>

              <button className="primary-button" onClick={scrollToRequest}>
                Request a task
                <span>→</span>
              </button>

              <div className="hero-meta">
                <span>✓ Local assistance</span>
                <span>✓ Photo &amp; video proof</span>
                <span>✓ Clear communication</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="map-card">
                <div className="map-lines"></div>

                <div className="map-label label-tbilisi">
                  <span></span>
                  Tbilisi
                </div>

                <div className="map-label label-batumi">
                  <span></span>
                  Batumi
                </div>

                <div className="map-route route-one"></div>
                <div className="map-route route-two"></div>

                <div className="location-marker">
                  <div className="marker-pulse"></div>
                  <div className="marker-core">L</div>
                </div>

                <div className="map-caption">
                  <span>LOCALGEO</span>
                  <small>YOUR LOCAL HANDS</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-strip-inner">
            <span>For people abroad</span>
            <span className="strip-line"></span>
            <span>For property owners</span>
            <span className="strip-line"></span>
            <span>For visitors</span>
            <span className="strip-line"></span>
            <span>For businesses</span>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-number">01 / HOW IT WORKS</span>

                <h2>
                  You ask.
                  <br />
                  <em>We handle it.</em>
                </h2>
              </div>

              <p>
                No need to find a stranger, explain everything twice or
                arrange five different services. Tell us what needs to happen.
              </p>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-number">01</div>

                <div>
                  <h3>Tell us</h3>
                  <p>
                    Describe what you need and where it needs to happen.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">02</div>

                <div>
                  <h3>We handle it</h3>
                  <p>
                    We assign a local person and coordinate the task.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">03</div>

                <div>
                  <h3>You get proof</h3>
                  <p>
                    Photos, video, receipts and a clear summary of what
                    happened.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-number">02 / SERVICES</span>

                <h2>
                  Whatever needs
                  <br />
                  <em>doing.</em>
                </h2>
              </div>

              <p>
                Start with a simple request. If your task doesn't fit a
                category, just tell us what happened.
              </p>
            </div>

            <div className="services-grid">
              {services.map((service) => (
                <article className="service-card" key={service.number}>
                  <div className="service-top">
                    <span>{service.number}</span>
                    <span className="service-icon">{service.icon}</span>
                  </div>

                  <h3>{service.title}</h3>

                  <p>{service.text}</p>

                  <button onClick={scrollToRequest}>
                    Request this <span>→</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="proof-section" id="trust">
          <div className="container proof-grid">
            <div>
              <span className="section-number light">
                03 / THE LOCALGEO PROMISE
              </span>

              <h2>
                You don't need
                <br />
                a friend in Georgia
                <br />
                <em>anymore.</em>
              </h2>
            </div>

            <div className="proof-content">
              <p className="proof-lead">
                Distance shouldn't make simple things difficult.
              </p>

              <div className="proof-list">
                <div>
                  <span>01</span>
                  <strong>Local execution</strong>

                  <p>
                    Someone physically goes where the task needs to happen.
                  </p>
                </div>

                <div>
                  <span>02</span>
                  <strong>Evidence</strong>

                  <p>
                    When appropriate, you receive photos, video and receipts.
                  </p>
                </div>

                <div>
                  <span>03</span>
                  <strong>Clear communication</strong>

                  <p>
                    No disappearing acts. We keep you informed about the task.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="request-section" id="request">
          <div className="container request-grid">
            <div className="request-intro">
              <span className="section-number">04 / REQUEST</span>

              <h2>
                Tell us what
                <br />
                <em>you need.</em>
              </h2>

              <p>
                Don't worry if you're not sure which service fits. Describe
                the situation in your own words and we'll take it from there.
              </p>

              <div className="request-note">
                <span>↗</span>

                <p>
                  This is an initial request. We'll review the task and confirm
                  availability and pricing before anything is scheduled.
                </p>
              </div>
            </div>

            <div className="form-card">
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>What do you need?</label>

                    <div className="choice-grid">
                      {[
                        "Check something",
                        "Pick something up",
                        "Deliver something",
                        "Home visit",
                        "Other",
                      ].map((option) => (
                        <label
                          className={`choice ${
                            form.type === option ? "selected" : ""
                          }`}
                          key={option}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={option}
                            checked={form.type === option}
                            onChange={handleChange}
                            required
                          />

                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>

                      <select
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select city</option>

                        {cities.map((city) => (
                          <option value={city} key={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="timing">When?</label>

                      <select
                        id="timing"
                        name="timing"
                        value={form.timing}
                        onChange={handleChange}
                      >
                        <option>As soon as possible</option>
                        <option>Within 24 hours</option>
                        <option>Within a few days</option>
                        <option>Specific date</option>
                        <option>I'm flexible</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address / location</label>

                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Street, building, landmark..."
                      value={form.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">
                      Tell us what you need
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows="5"
                      placeholder="Describe the situation in your own words..."
                      value={form.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <div className="form-divider"></div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Your name</label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact">
                      WhatsApp / Telegram
                    </label>

                    <input
                      id="contact"
                      name="contact"
                      type="text"
                      placeholder="+995..."
                      value={form.contact}
                      onChange={handleChange}
                    />
                  </div>

                  <button className="submit-button" type="submit">
                    Request a task
                    <span>→</span>
                  </button>

                  <p className="form-disclaimer">
                    No payment is required at this stage. We'll review your
                    request first.
                  </p>
                </form>
              ) : (
                <div className="success-state">
                  <div className="success-mark">✓</div>

                  <span className="success-label">REQUEST RECEIVED</span>

                  <h3>
                    Got it.
                    <br />
                    We'll take it from here.
                  </h3>

                  <p>
                    We've received your request. We'll review the details and
                    contact you with the next steps.
                  </p>

                  <div className="request-id">
                    <span>REQUEST NUMBER</span>
                    <strong>{requestId}</strong>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setSubmitted(false);

                      setForm({
                        type: "",
                        city: "",
                        address: "",
                        description: "",
                        timing: "As soon as possible",
                        name: "",
                        email: "",
                        contact: "",
                      });
                    }}
                  >
                    Send another request
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <a href="#top" className="logo">
              <span className="logo-mark">L</span>

              <span>
                LOCAL<span>GEO</span>
              </span>
            </a>

            <p>Your trusted local hands in Georgia.</p>
          </div>

          <div className="footer-right">
            <span>© 2026 LocalGeo</span>
            <span>Georgia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;