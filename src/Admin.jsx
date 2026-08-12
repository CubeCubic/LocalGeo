import { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_URL = "https://localgeo.onrender.com";

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
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/requests`);

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
    loadRequests();
  }, []);

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
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

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

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-brand">LOCALGEO</div>

          <div className="admin-subtitle">
            Operations
          </div>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadRequests}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
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
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Admin;
