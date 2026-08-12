import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_URL = "https://localgeo.onrender.com";
const ADMIN_TOKEN_KEY = "localgeo-admin-token";

const STATUS_OPTIONS = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

function Admin() {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem(ADMIN_TOKEN_KEY) || ""
  );
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timelineNote, setTimelineNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [addingTimelineEntry, setAddingTimelineEntry] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [clientPrice, setClientPrice] = useState("");
  const [operatorPayout, setOperatorPayout] = useState("");
  const [currency, setCurrency] = useState("GEL");
  const [clientPaymentStatus, setClientPaymentStatus] = useState("unpaid");
  const [operatorPaymentStatus, setOperatorPaymentStatus] = useState("unpaid");
  const [operatorNote, setOperatorNote] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [error, setError] = useState("");

  function logOut() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setRequests([]);
    setSelectedRequest(null);
  }

  async function logIn(event) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        throw new Error(data.error || "Unable to sign in.");
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setLoginError(err.message || "Unable to sign in.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function loadRequests() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logOut();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load requests.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Failed to load requests."
        );
      }

      const nextRequests = data.requests || [];

      setRequests(nextRequests);

      setSelectedRequest((currentSelected) => {
        if (!currentSelected) {
          return null;
        }

        return (
          nextRequests.find(
            (request) =>
              request.id === currentSelected.id
          ) || null
        );
      });
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadRequests();
    }
  }, [token]);

  useEffect(() => {
    const assignment = selectedRequest?.assignment;

    setAssignee(assignment?.assignee || "");
    setClientPrice(
      assignment?.clientPrice === null || assignment?.clientPrice === undefined
        ? assignment?.price === null || assignment?.price === undefined
          ? ""
          : String(assignment.price)
        : String(assignment.clientPrice)
    );
    setOperatorPayout(
      assignment?.operatorPayout === null || assignment?.operatorPayout === undefined
        ? ""
        : String(assignment.operatorPayout)
    );
    setCurrency(assignment?.currency || "GEL");
    setClientPaymentStatus(assignment?.clientPaymentStatus || "unpaid");
    setOperatorPaymentStatus(assignment?.operatorPaymentStatus || "unpaid");
    setOperatorNote(assignment?.operatorNote || "");
  }, [selectedRequest?.id]);

  const filteredRequests = useMemo(() => {
    if (filter === "all") {
      return requests;
    }

    return requests.filter(
      (request) => request.status === filter
    );
  }, [requests, filter]);

  async function updateStatus(requestId, newStatus) {
    try {
      setUpdating(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logOut();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to update status."
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? data.request
            : request
        )
      );

      setSelectedRequest(data.request);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update request status."
      );
    } finally {
      setUpdating(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status) {
    const found = STATUS_OPTIONS.find(
      (item) => item.value === status
    );

    return found ? found.label : status;
  }

  function getRequestTypeLabel(type) {
    const labels = {
      check: "Check",
      home: "Home",
      pickup: "Pick up",
      deliver: "Deliver",
      other: "Something else",
    };

    return labels[type] || type || "—";
  }

  async function deleteRequest(request) {
    const confirmed = window.confirm(
      `Delete request ${request.id}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/requests/${request.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.status === 401) {
        logOut();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete request.");
      }

      setRequests((currentRequests) =>
        currentRequests.filter(
          (requestItem) => requestItem.id !== request.id
        )
      );
      setSelectedRequest(null);
    } catch (err) {
      console.error(err);
      setError("Unable to delete request. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function saveAssignment(event) {
    event.preventDefault();

    if (!selectedRequest || !assignee.trim()) {
      return;
    }

    try {
      setSavingAssignment(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/requests/${selectedRequest.id}/assignment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignee,
            clientPrice,
            operatorPayout,
            currency,
            clientPaymentStatus,
            operatorPaymentStatus,
            operatorNote,
          }),
        }
      );
      const data = await response.json();

      if (response.status === 401) {
        logOut();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save assignment.");
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === data.request.id ? data.request : request
        )
      );
      setSelectedRequest(data.request);
    } catch (err) {
      console.error(err);
      setError("Unable to save assignment. Please try again.");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function addTimelineEntry(event) {
    event.preventDefault();

    if (!selectedRequest || !timelineNote.trim()) {
      return;
    }

    try {
      setAddingTimelineEntry(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/requests/${selectedRequest.id}/timeline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            note: timelineNote,
            proofUrl: proofUrl,
          }),
        }
      );
      const data = await response.json();

      if (response.status === 401) {
        logOut();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add timeline entry.");
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === data.request.id ? data.request : request
        )
      );
      setSelectedRequest(data.request);
      setTimelineNote("");
      setProofUrl("");
    } catch (err) {
      console.error(err);
      setError("Unable to add timeline entry. Please try again.");
    } finally {
      setAddingTimelineEntry(false);
    }
  }

  function getTimeline(request) {
    const timeline = Array.isArray(request.timeline)
      ? request.timeline
      : [];

    if (timeline.length > 0) {
      const seenAssignments = new Set();

      return [...timeline].sort(
        (first, second) =>
          new Date(second.occurredAt) -
          new Date(first.occurredAt)
      ).filter((event) => {
        if (event.type !== "assigned") {
          return true;
        }

        const key = [
          event.assignee,
          event.clientPrice ?? event.price ?? "",
          event.operatorPayout ?? "",
          event.currency ?? "",
          event.operatorNote ?? "",
        ].join("|");

        if (seenAssignments.has(key)) {
          return false;
        }

        seenAssignments.add(key);
        return true;
      });
    }

    return [
      {
        type: "created",
        status: "new",
        occurredAt: request.createdAt,
      },
    ];
  }

  function getTimelineLabel(event) {
    if (event.type === "created") {
      return "Request received";
    }

    if (event.type === "note") {
      return event.note;
    }

    if (event.type === "assigned" || event.type === "assignment_updated") {
      const clientPrice = event.clientPrice ?? event.price;
      const margin = event.margin ?? (
        clientPrice !== null && clientPrice !== undefined &&
        event.operatorPayout !== null && event.operatorPayout !== undefined
          ? Number(clientPrice) - Number(event.operatorPayout)
          : null
      );
      const clientPriceLabel = clientPrice === null || clientPrice === undefined
        ? "not set"
        : `${clientPrice} ${event.currency}`;
      const executorPayoutLabel = event.operatorPayout === null || event.operatorPayout === undefined
        ? "not set"
        : `${event.operatorPayout} ${event.currency}`;
      const marginLabel = margin === null || margin === undefined
        ? "not set"
        : `${margin} ${event.currency}`;

      return `Executor: ${event.assignee} · Client: ${clientPriceLabel} · Payout: ${executorPayoutLabel} · Margin: ${marginLabel}`;
    }

    return `Status changed to ${getStatusLabel(event.status)}`;
  }

  if (!token) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={logIn}>
          <div className="admin-brand">LOCALGEO</div>
          <p className="admin-login-kicker">ADMIN INBOX</p>
          <h1>Sign in</h1>
          <p>Enter the admin password to view customer requests.</p>

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />

          {loginError && <div className="admin-error">{loginError}</div>}

          <button type="submit" className="refresh-button" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-brand">LOCALGEO</div>

          <div className="admin-subtitle">
            Operations
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="refresh-button"
            onClick={loadRequests}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="logout-button" onClick={logOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-toolbar">
          <div>
            <h1>Requests</h1>

            <p>Manage LocalGeo requests.</p>
          </div>

          <div className="request-count">
            {requests.length}
          </div>
        </section>

        <section className="status-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "filter active"
                : "filter"
            }
            onClick={() => setFilter("all")}
          >
            All
          </button>

          {STATUS_OPTIONS.map((status) => (
            <button
              type="button"
              key={status.value}
              className={
                filter === status.value
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter(status.value)
              }
            >
              {status.label}
            </button>
          ))}
        </section>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <section className="admin-content">
          <div className="request-list">
            {loading ? (
              <div className="empty-state">
                Loading requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
                <strong>No requests</strong>

                <span>
                  There are no requests in this category.
                </span>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  className={
                    selectedRequest?.id === request.id
                      ? "request-card selected"
                      : "request-card"
                  }
                  onClick={() =>
                    setSelectedRequest(request)
                  }
                >
                  <div className="request-card-top">
                    <span className="admin-request-id">
                      {request.id}
                    </span>

                    <span
                      className={`status status-${request.status}`}
                    >
                      {getStatusLabel(
                        request.status
                      )}
                    </span>
                  </div>

                  <div className="request-card-title">
                    {getRequestTypeLabel(
                      request.type
                    )}
                  </div>

                  <div className="request-card-location">
                    {request.city || "—"}
                  </div>

                  <div className="request-card-description">
                    {request.description || "—"}
                  </div>

                  <div className="request-card-date">
                    {formatDate(
                      request.createdAt
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <aside className="request-details">
            {!selectedRequest ? (
              <div className="details-empty">
                <span className="details-mark">→</span>

                <h2>Select a request</h2>

                <p>
                  Choose a request from the list to see
                  its details.
                </p>
              </div>
            ) : (
              <>
                <div className="details-header">
                  <div>
                    <span className="details-label">
                      REQUEST
                    </span>

                    <h2>{selectedRequest.id}</h2>
                  </div>

                  <span
                    className={`status status-${selectedRequest.status}`}
                  >
                    {getStatusLabel(
                      selectedRequest.status
                    )}
                  </span>
                </div>

                <div className="details-section">
                  <span className="details-label">
                    TASK
                  </span>

                  <div className="detail-row">
                    <span>Type</span>

                    <strong>
                      {getRequestTypeLabel(
                        selectedRequest.type
                      )}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>City</span>

                    <strong>
                      {selectedRequest.city || "—"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>When</span>

                    <strong>
                      {selectedRequest.timing || "—"}
                    </strong>
                  </div>

                  <div className="detail-row vertical">
                    <span>Address</span>

                    <strong>
                      {selectedRequest.address || "—"}
                    </strong>
                  </div>

                  <div className="detail-row vertical">
                    <span>Description</span>

                    <strong>
                      {selectedRequest.description ||
                        "—"}
                    </strong>
                  </div>
                </div>

                <div className="details-section">
                  <span className="details-label">
                    CUSTOMER
                  </span>

                  <div className="detail-row">
                    <span>Name</span>

                    <strong>
                      {selectedRequest.customer?.name ||
                        selectedRequest.name ||
                        "—"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Email</span>

                    {selectedRequest.customer?.email ||
                    selectedRequest.email ? (
                      <a
                        href={`mailto:${
                          selectedRequest.customer
                            ?.email ||
                          selectedRequest.email
                        }`}
                      >
                        {selectedRequest.customer
                          ?.email ||
                          selectedRequest.email}
                      </a>
                    ) : (
                      <strong>—</strong>
                    )}
                  </div>

                  <div className="detail-row">
                    <span>Contact</span>

                    <strong>
                      {selectedRequest.customer
                        ?.contact ||
                        selectedRequest.contact ||
                        "—"}
                    </strong>
                  </div>
                </div>

                <div className="details-section">
                  <span className="details-label">
                    STATUS
                  </span>

                  <div className="status-buttons">
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <button
                          type="button"
                          key={status.value}
                          className={
                            selectedRequest.status ===
                            status.value
                              ? "status-button active"
                              : "status-button"
                          }
                          onClick={() =>
                            updateStatus(
                              selectedRequest.id,
                              status.value
                            )
                          }
                          disabled={updating}
                        >
                          {status.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="details-section assignment-section">
                  <span className="details-label">
                    ASSIGNMENT & FINANCES
                  </span>

                  <form
                    className="assignment-form"
                    onSubmit={saveAssignment}
                  >
                    <label htmlFor="assignee">Executor</label>
                    <input
                      id="assignee"
                      value={assignee}
                      onChange={(event) => setAssignee(event.target.value)}
                      placeholder="Name of the executor"
                      maxLength="120"
                      required
                    />

                    <div className="assignment-price-row">
                      <div>
                        <label htmlFor="client-price">Client price</label>
                        <input
                          id="client-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={clientPrice}
                          onChange={(event) => setClientPrice(event.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label htmlFor="assignment-currency">Currency</label>
                        <select
                          id="assignment-currency"
                          value={currency}
                          onChange={(event) => setCurrency(event.target.value)}
                        >
                          <option value="GEL">GEL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>

                    <div className="assignment-price-row">
                      <div>
                        <label htmlFor="operator-payout">Executor payout</label>
                        <input
                          id="operator-payout"
                          type="number"
                          min="0"
                          step="0.01"
                          value={operatorPayout}
                          onChange={(event) => setOperatorPayout(event.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="finance-summary">
                      <span>Client price − executor payout = LocalGeo margin</span>
                      <strong>
                        {clientPrice !== "" && operatorPayout !== ""
                          ? `${(Number(clientPrice) - Number(operatorPayout)).toFixed(2)} ${currency}`
                          : "Enter both amounts"}
                      </strong>
                    </div>

                    <div className="payment-status-row">
                      <div>
                        <label htmlFor="client-payment-status">Client payment</label>
                        <select
                          id="client-payment-status"
                          value={clientPaymentStatus}
                          onChange={(event) => setClientPaymentStatus(event.target.value)}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="operator-payment-status">Executor payment</label>
                        <select
                          id="operator-payment-status"
                          value={operatorPaymentStatus}
                          onChange={(event) => setOperatorPaymentStatus(event.target.value)}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                    </div>

                    <label htmlFor="operator-note">
                      Instructions for executor
                    </label>
                    <textarea
                      id="operator-note"
                      value={operatorNote}
                      onChange={(event) => setOperatorNote(event.target.value)}
                      placeholder="Access details, agreed scope, deadline…"
                      maxLength="2000"
                    />

                    <button
                      type="submit"
                      className="save-assignment-button"
                      disabled={savingAssignment}
                    >
                      {savingAssignment ? "Saving..." : "Save assignment"}
                    </button>
                  </form>
                </div>

                <div className="details-section timeline-section">
                  <span className="details-label">
                    TIMELINE
                  </span>

                  <form
                    className="timeline-entry-form"
                    onSubmit={addTimelineEntry}
                  >
                    <label htmlFor="timeline-note">
                      Add an update
                    </label>
                    <textarea
                      id="timeline-note"
                      value={timelineNote}
                      onChange={(event) =>
                        setTimelineNote(event.target.value)
                      }
                      placeholder="e.g. Customer confirmed the price in WhatsApp."
                      maxLength="1000"
                      required
                    />
                    <label htmlFor="proof-url">
                      Proof link (optional)
                    </label>
                    <input
                      id="proof-url"
                      type="url"
                      value={proofUrl}
                      onChange={(event) => setProofUrl(event.target.value)}
                      placeholder="https://…"
                    />
                    <button
                      type="submit"
                      className="add-timeline-button"
                      disabled={addingTimelineEntry}
                    >
                      {addingTimelineEntry ? "Saving..." : "Add update"}
                    </button>
                  </form>

                  <ol className="timeline-list">
                    {getTimeline(selectedRequest).map(
                      (event, index) => (
                        <li
                          key={`${event.occurredAt}-${index}`}
                          className="timeline-event"
                        >
                          <span className="timeline-marker" />

                          <div>
                            <strong>
                              {getTimelineLabel(event)}
                            </strong>

                            <time>
                              {formatDate(event.occurredAt)}
                            </time>

                            {event.proofUrl && (
                              <a
                                className="timeline-proof-link"
                                href={event.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open proof
                              </a>
                            )}
                          </div>
                        </li>
                      )
                    )}
                  </ol>
                </div>

                <div className="details-meta">
                  <div>Created</div>

                  <strong>
                    {formatDate(
                      selectedRequest.createdAt
                    )}
                  </strong>

                  {selectedRequest.updatedAt && (
                    <>
                      <div>Updated</div>

                      <strong>
                        {formatDate(
                          selectedRequest.updatedAt
                        )}
                      </strong>
                    </>
                  )}
                </div>

                <div className="delete-request-section">
                  <button
                    type="button"
                    className="delete-request-button"
                    onClick={() => deleteRequest(selectedRequest)}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete request"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Admin;
