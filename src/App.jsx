import { useState } from "react";
import "./App.css";
import Turnstile, { turnstileSiteKey } from "./Turnstile";

const API_URL = "https://localgeo.onrender.com";
const initialForm = {
  type: "",
  city: "",
  timing: "As soon as possible",
  address: "",
  description: "",
  name: "",
  email: "",
  contact: "",
};

function App() {
  // ------------------------------------------------------------
  // FORM STATE
  // ------------------------------------------------------------

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [requestId, setRequestId] = useState("");
  const [trackingKey, setTrackingKey] = useState("");
  const trackingUrl = requestId && trackingKey
    ? `${window.location.origin}${import.meta.env.BASE_URL}#/track/${encodeURIComponent(requestId)}?key=${encodeURIComponent(trackingKey)}`
    : "";

  // ------------------------------------------------------------
  // FORM HANDLERS
  // ------------------------------------------------------------

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function selectService(type) {
    updateField("type", type);

    setTimeout(() => {
      document
        .getElementById("request")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  // ------------------------------------------------------------
  // SUBMIT
  // ------------------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.type) {
      setError("Please select what you need.");
      return;
    }

    if (!form.city) {
      setError("Please select a city.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter the address or location.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe what you need.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError("Please complete the security verification.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: form.type,
            city: form.city,
            timing: form.timing,
            address: form.address,
            description: form.description,
            name: form.name,
            email: form.email,
            contact: form.contact,
            turnstileToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to submit request."
        );
      }

      setRequestId(
        data.request?.id ||
          data.requestId ||
          data.id ||
          ""
      );
      setTrackingKey(data.request?.trackingKey || "");

      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      console.error("LocalGeo request error:", err);

      setError(
        "We couldn't send your request. Please try again."
      );
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------
  // NEW REQUEST
  // ------------------------------------------------------------

  function resetRequest() {
    setSubmitted(false);
    setRequestId("");
    setTrackingKey("");
    setError("");
    setForm(initialForm);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="site">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="header">
        <div className="container header-inner">
          <a href="#top" className="logo">
            <img className="logo-mark" src={`${import.meta.env.BASE_URL}localgeo-logo.svg`} alt="" />

            <span>
              LOCAL<span>GEO</span>
            </span>
          </a>

          <nav className="nav">
            <a href="#how-it-works">
              How it works
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#trust">
              Trust
            </a>

            <button
              type="button"
              className="header-button"
              onClick={() =>
                document
                  .getElementById("request")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Request a task
            </button>
          </nav>
        </div>
      </header>

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <main id="top">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="status-dot" />
                LOCAL HELP IN GEORGIA
              </div>

              <h1>
                Need something
                <br />
                done in <em>Georgia?</em>
              </h1>

              <div className="hero-subtitle">
                You're not here.
                <br />
                <strong>We are.</strong>
              </div>

              <p className="hero-description">
                LocalGeo gives you trusted local
                hands when you need something
                checked, collected, delivered or
                handled in Georgia.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("request")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
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
                <div className="map-lines" />

                <div className="map-label label-tbilisi">
                  <span />
                  Tbilisi
                </div>

                <div className="map-label label-batumi">
                  <span />
                  Batumi
                </div>

                <div className="map-route route-one" />
                <div className="map-route route-two" />

                <div className="location-marker">
                  <div className="marker-pulse" />

                  <div className="marker-core">
                    <span>G</span>
                  </div>
                </div>

                <div className="map-caption">
                  <span>Georgia</span>
                  <small>
                    YOUR LOCAL HANDS
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* TRUST STRIP */}
        {/* ==================================================== */}

        <div className="trust-strip">
          <div className="container trust-strip-inner">
            <span>Local execution</span>
            <span className="strip-line" />
            <span>Real people</span>
            <span className="strip-line" />
            <span>Photo &amp; video proof</span>
            <span className="strip-line" />
            <span>Clear communication</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* HOW IT WORKS */}
        {/* ==================================================== */}

        <section
          id="how-it-works"
          className="section"
        >
          <div className="container">
            <span className="section-number">
              01 / HOW IT WORKS
            </span>

            <div className="section-heading">
              <h2>
                You ask.
                <br />
                We <em>handle it.</em>
              </h2>

              <p>
                No need to find a stranger,
                explain everything twice or
                arrange five different services.
                Tell us what needs to happen.
              </p>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-number">
                  01
                </div>

                <div>
                  <h3>Tell us</h3>

                  <p>
                    Describe what you need and
                    where it needs to happen.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">
                  02
                </div>

                <div>
                  <h3>We handle it</h3>

                  <p>
                    We assign a local person and
                    coordinate the task.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">
                  03
                </div>

                <div>
                  <h3>You get proof</h3>

                  <p>
                    Photos, video, receipts and a
                    clear summary of what happened.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* SERVICES */}
        {/* ==================================================== */}

        <section
          id="services"
          className="section services-section"
        >
          <div className="container">
            <span className="section-number">
              02 / SERVICES
            </span>

            <div className="section-heading">
              <h2>
                Whatever needs
                <br />
                <em>doing.</em>
              </h2>

              <p>
                Start with a simple request. If
                your task doesn't fit a category,
                just tell us what happened.
              </p>
            </div>

            <div className="services-grid">
              {/* CHECK */}

              <div className="service-card">
                <div className="service-top">
                  <span>01</span>

                  <span className="service-icon">
                    ⌕
                  </span>
                </div>

                <h3>Check</h3>

                <p>
                  We visit, inspect and document
                  things when you can't be there.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectService("check")
                  }
                >
                  Request this
                  <span>→</span>
                </button>
              </div>

              {/* HOME */}

              <div className="service-card">
                <div className="service-top">
                  <span>02</span>

                  <span className="service-icon">
                    ⌂
                  </span>
                </div>

                <h3>Home</h3>

                <p>
                  Apartment checks, repairs,
                  technicians, deliveries and
                  local errands.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectService("home")
                  }
                >
                  Request this
                  <span>→</span>
                </button>
              </div>

              {/* PICK UP */}

              <div className="service-card">
                <div className="service-top">
                  <span>03</span>

                  <span className="service-icon">
                    ↗
                  </span>
                </div>

                <h3>Pick up</h3>

                <p>
                  Documents, keys, packages,
                  purchases and other items.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectService("pickup")
                  }
                >
                  Request this
                  <span>→</span>
                </button>
              </div>

              {/* DELIVER */}

              <div className="service-card">
                <div className="service-top">
                  <span>04</span>

                  <span className="service-icon">
                    →
                  </span>
                </div>

                <h3>Deliver</h3>

                <p>
                  We move things from one place
                  to another safely and locally.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectService("deliver")
                  }
                >
                  Request this
                  <span>→</span>
                </button>
              </div>

              {/* OTHER */}

              <div className="service-card">
                <div className="service-top">
                  <span>05</span>

                  <span className="service-icon">
                    ＋
                  </span>
                </div>

                <h3>Something else</h3>

                <p>
                  Have a problem in Georgia?
                  Tell us what you need.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    selectService("other")
                  }
                >
                  Request this
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* TRUST / PROOF */}
        {/* ==================================================== */}

        <section
          id="trust"
          className="proof-section"
        >
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
                Distance shouldn't make simple
                things difficult.
              </p>

              <div className="proof-list">
                <div>
                  <span>01</span>

                  <strong>
                    Local execution
                  </strong>

                  <p>
                    Someone physically goes where
                    the task needs to happen.
                  </p>
                </div>

                <div>
                  <span>02</span>

                  <strong>
                    Evidence
                  </strong>

                  <p>
                    When appropriate, you receive
                    photos, video and receipts.
                  </p>
                </div>

                <div>
                  <span>03</span>

                  <strong>
                    Clear communication
                  </strong>

                  <p>
                    No disappearing acts. We keep
                    you informed about the task.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section scenarios-section">
          <div className="container">
            <span className="section-number">04 / WHEN LOCALGEO HELPS</span>
            <div className="section-heading">
              <h2>Real problems.<br /><em>Local answers.</em></h2>
              <p>Use LocalGeo when distance is the problem — not the task itself.</p>
            </div>
            <div className="scenarios-grid">
              <article><span>01</span><h3>Your apartment is empty</h3><p>We can check a property, meet a technician, collect keys and document what we find.</p></article>
              <article><span>02</span><h3>You need proof before deciding</h3><p>We can visit a location, inspect an item and send photos, video or a clear written update.</p></article>
              <article><span>03</span><h3>You need someone there</h3><p>We can pick up documents, make a delivery or handle a practical local errand on your behalf.</p></article>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* REQUEST */}
        {/* ==================================================== */}

        <section
          id="request"
          className="request-section"
        >
          <div className="container">
            <div className="request-grid">
              {/* INTRO */}

              <div className="request-intro">
                <span className="section-number">
                  04 / REQUEST
                </span>

                <h2>
                  Tell us what
                  <br />
                  you <em>need.</em>
                </h2>

                <p>
                  Don't worry if you're not sure
                  which service fits. Describe the
                  situation in your own words and
                  we'll take it from there.
                </p>

                <div className="request-note">
                  <span>↗</span>

                  <p>
                    This is an initial request.
                    We'll review the task and
                    confirm availability and
                    pricing before anything is
                    scheduled.
                  </p>
                </div>
              </div>

              {/* FORM / SUCCESS */}

              <div>
                {submitted ? (
                  <div className="form-card success-state">
                    <div className="success-mark">
                      ✓
                    </div>

                    <span className="success-label">
                      REQUEST RECEIVED
                    </span>

                    <h3>
                      Thank you.
                    </h3>

                    <p>
                      We've received your request
                      and will review it before
                      confirming availability and
                      pricing.
                    </p>

                    {requestId && (
                      <div className="request-id">
                        <span>
                          REQUEST ID
                        </span>

                        <strong>
                          {requestId}
                        </strong>
                      </div>
                    )}

                    {trackingUrl && (
                      <div className="tracking-link-box">
                        <span>PRIVATE TRACKING LINK</span>
                        <p>
                          Save this link to follow the progress of your request.
                        </p>
                        <a href={trackingUrl}>
                          Track this request
                        </a>
                      </div>
                    )}

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetRequest}
                    >
                      Submit another request
                    </button>
                  </div>
                ) : (
                  <form
                    className="form-card"
                    onSubmit={handleSubmit}
                  >
                    {/* SERVICE */}

                    <div className="form-group">
                      <label>
                        What do you need?
                      </label>

                      <div className="choice-grid">
                        <label
                          className={
                            form.type === "check"
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            name="type"
                            value="check"
                            checked={
                              form.type ===
                              "check"
                            }
                            onChange={(event) =>
                              updateField(
                                "type",
                                event.target.value
                              )
                            }
                          />
                          Check something
                        </label>

                        <label
                          className={
                            form.type ===
                            "pickup"
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            name="type"
                            value="pickup"
                            checked={
                              form.type ===
                              "pickup"
                            }
                            onChange={(event) =>
                              updateField(
                                "type",
                                event.target.value
                              )
                            }
                          />
                          Pick something up
                        </label>

                        <label
                          className={
                            form.type ===
                            "deliver"
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            name="type"
                            value="deliver"
                            checked={
                              form.type ===
                              "deliver"
                            }
                            onChange={(event) =>
                              updateField(
                                "type",
                                event.target.value
                              )
                            }
                          />
                          Deliver something
                        </label>

                        <label
                          className={
                            form.type === "home"
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            name="type"
                            value="home"
                            checked={
                              form.type ===
                              "home"
                            }
                            onChange={(event) =>
                              updateField(
                                "type",
                                event.target.value
                              )
                            }
                          />
                          Home visit
                        </label>

                        <label
                          className={
                            form.type === "other"
                              ? "choice selected"
                              : "choice"
                          }
                        >
                          <input
                            type="radio"
                            name="type"
                            value="other"
                            checked={
                              form.type ===
                              "other"
                            }
                            onChange={(event) =>
                              updateField(
                                "type",
                                event.target.value
                              )
                            }
                          />
                          Other
                        </label>
                      </div>
                    </div>

                    {/* CITY + TIMING */}

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="city">
                          City
                        </label>

                        <select
                          id="city"
                          value={form.city}
                          onChange={(event) =>
                            updateField(
                              "city",
                              event.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Select city
                          </option>

                          <option value="Tbilisi">
                            Tbilisi
                          </option>

                          <option value="Batumi">
                            Batumi
                          </option>

                          <option value="Kutaisi">
                            Kutaisi
                          </option>

                          <option value="Rustavi">
                            Rustavi
                          </option>

                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="timing">
                          When?
                        </label>

                        <select
                          id="timing"
                          value={form.timing}
                          onChange={(event) =>
                            updateField(
                              "timing",
                              event.target.value
                            )
                          }
                        >
                          <option>
                            As soon as possible
                          </option>

                          <option>
                            Today
                          </option>

                          <option>
                            Tomorrow
                          </option>

                          <option>
                            Within a few days
                          </option>

                          <option>
                            I have a specific date
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* ADDRESS */}

                    <div className="form-group">
                      <label htmlFor="address">
                        Address / location
                      </label>

                      <input
                        id="address"
                        type="text"
                        value={form.address}
                        onChange={(event) =>
                          updateField(
                            "address",
                            event.target.value
                          )
                        }
                        placeholder="Street, building, landmark..."
                        required
                      />
                    </div>

                    {/* DESCRIPTION */}

                    <div className="form-group">
                      <label htmlFor="description">
                        Tell us what you need
                      </label>

                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(event) =>
                          updateField(
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Describe the situation in your own words..."
                        required
                      />
                    </div>

                    <div className="form-divider" />

                    {/* NAME + EMAIL */}

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">
                          Your name
                        </label>

                        <input
                          id="name"
                          type="text"
                          value={form.name}
                          onChange={(event) =>
                            updateField(
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Your name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">
                          Email
                        </label>

                        <input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(event) =>
                            updateField(
                              "email",
                              event.target.value
                            )
                          }
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* CONTACT */}

                    <div className="form-group">
                      <label htmlFor="contact">
                        WhatsApp / Viber
                      </label>

                      <input
                        id="contact"
                        type="text"
                        value={form.contact}
                        onChange={(event) =>
                          updateField(
                            "contact",
                            event.target.value
                          )
                        }
                        placeholder="+995..."
                      />
                    </div>

                    <Turnstile
                      onTokenChange={setTurnstileToken}
                      resetKey={turnstileResetKey}
                    />

                    {/* ERROR */}

                    {error && (
                      <div className="form-error">
                        {error}
                      </div>
                    )}

                    {/* SUBMIT */}

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      <span>
                        {submitting
                          ? "Sending..."
                          : "Request a task"}
                      </span>

                      <span>
                        →
                      </span>
                    </button>

                    <p className="form-disclaimer">
                      No payment is required at this
                      stage. We'll review your request
                      first.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="logo">
              <img className="logo-mark" src={`${import.meta.env.BASE_URL}localgeo-logo.svg`} alt="" />

              <span>
                LOCAL<span>GEO</span>
              </span>
            </div>

            <p>
              Your trusted local hands in
              Georgia.
            </p>
          </div>

          <div className="footer-right">
            <span>
              © 2026 LocalGeo Georgia
            </span>

            <a href="#top">
              Back to top ↑
            </a>
            <a href="#/privacy">Privacy</a>
            <a href="#/terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
