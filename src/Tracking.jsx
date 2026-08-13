import { useEffect, useState } from "react";
import "./Tracking.css";

const API_URL = "https://localgeo.onrender.com";

const statusLabels = {
  new: "Request received",
  contacted: "We contacted you",
  assigned: "Task assigned",
  in_progress: "Task in progress",
  completed: "Task completed",
  cancelled: "Request cancelled"
};

const serviceLabels = {
  check: "Check something",
  pickup: "Pick something up",
  deliver: "Deliver something",
  home: "Home visit",
  other: "Something else"
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function Tracking({ requestId, trackingKey }) {
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/track/${encodeURIComponent(requestId)}?key=${encodeURIComponent(trackingKey)}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Request not found.");
        }

        if (!cancelled) {
          setRequest(data.request);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError("This tracking link is invalid or the request is unavailable.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId, trackingKey]);

  return (
    <main className="tracking-page">
      <section className="tracking-card">
        <a className="tracking-brand" href={import.meta.env.BASE_URL}>
          LOCAL<span>GEO</span>
        </a>

        <p className="tracking-kicker">REQUEST TRACKING</p>

        {loading ? (
          <p className="tracking-message">Loading your request…</p>
        ) : error ? (
          <>
            <h1>We couldn’t find this request.</h1>
            <p className="tracking-message">{error}</p>
            <a className="tracking-button" href={import.meta.env.BASE_URL}>
              Back to LocalGeo
            </a>
          </>
        ) : (
          <>
            <div className="tracking-title-row">
              <div>
                <h1>Your request</h1>
                <p>{request.id}</p>
              </div>
              <span className={`tracking-status status-${request.status}`}>
                {statusLabels[request.status] || request.status}
              </span>
            </div>

            <dl className="tracking-details">
              <div>
                <dt>Service</dt>
                <dd>{serviceLabels[request.type] || request.type}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{request.city || "—"}</dd>
              </div>
              <div>
                <dt>Requested for</dt>
                <dd>{request.timing || "—"}</dd>
              </div>
            </dl>

            <section className="tracking-timeline">
              <h2>Progress</h2>
              {request.timeline?.length ? (
                <ol>
                  {request.timeline.map((event, index) => (
                    <li key={`${event.occurredAt}-${index}`}>
                      <span />
                      <div>
                        <strong>
                          {event.type === "proof"
                            ? "Completion evidence shared"
                            : event.type === "created"
                            ? "Request received"
                            : `Status: ${statusLabels[event.status] || event.status}`}
                        </strong>
                        <time>{formatDate(event.occurredAt)}</time>
                        {event.proofUrl && (
                          <a className="tracking-proof-link" href={event.proofUrl} target="_blank" rel="noreferrer">
                            Open proof
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="tracking-message">No updates yet.</p>
              )}
            </section>

            <p className="tracking-privacy">
              This private link shows the status of this request only. Keep it safe.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default Tracking;
