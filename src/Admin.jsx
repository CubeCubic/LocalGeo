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
  const [executors, setExecutors] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timelineNote, setTimelineNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [shareProofWithCustomer, setShareProofWithCustomer] = useState(false);
  const [addingTimelineEntry, setAddingTimelineEntry] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [clientPrice, setClientPrice] = useState("");
  const [operatorPayout, setOperatorPayout] = useState("");
  const [jobExpenses, setJobExpenses] = useState("");
  const [currency, setCurrency] = useState("GEL");
  const [clientPaymentStatus, setClientPaymentStatus] = useState("unpaid");
  const [operatorPaymentStatus, setOperatorPaymentStatus] = useState("unpaid");
  const [operatorNote, setOperatorNote] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [executorForm, setExecutorForm] = useState({ name: "", contact: "", cities: "", specialties: "" });
  const [savingExecutor, setSavingExecutor] = useState(false);
  const [error, setError] = useState("");

  function logOut() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setRequests([]);
    setExecutors([]);
    setSelectedRequest(null);
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = ["Request ID", "Created", "Status", "Service", "City", "Address", "Customer name", "Customer email", "Customer contact", "Executor", "Client price", "Executor payout", "Job expenses", "LocalGeo margin", "Currency", "Client payment", "Executor payment", "Updated"];
    const rows = requests.map((request) => {
      const assignment = request.assignment || {};
      return [request.id, request.createdAt, request.status, request.type, request.city, request.address, request.customer?.name, request.customer?.email, request.customer?.contact, assignment.assignee, assignment.clientPrice ?? assignment.price, assignment.operatorPayout, assignment.jobExpenses, assignment.margin, assignment.currency, assignment.clientPaymentStatus, assignment.operatorPaymentStatus, request.updatedAt];
    });
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, `localgeo-requests-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
  }

  function downloadBackup() {
    const backup = {
      exportedAt: new Date().toISOString(),
      application: "LocalGeo",
      executors,
      requests,
    };
    downloadFile(JSON.stringify(backup, null, 2), `localgeo-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
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

  async function loadExecutors() {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/executors`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.status === 401) return logOut();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to load executors.");
      setExecutors(data.executors || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load executor directory.");
    }
  }

  useEffect(() => {
    if (token) {
      loadRequests();
      loadExecutors();
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
    setJobExpenses(
      assignment?.jobExpenses === null || assignment?.jobExpenses === undefined
        ? ""
        : String(assignment.jobExpenses)
    );
    setCurrency(assignment?.currency || "GEL");
    setClientPaymentStatus(assignment?.clientPaymentStatus || "unpaid");
    setOperatorPaymentStatus(assignment?.operatorPaymentStatus || "unpaid");
    setOperatorNote(assignment?.operatorNote || "");
  }, [selectedRequest?.id]);

  const dashboard = useMemo(() => {
    const query = search.trim().toLowerCase();
    const assignees = [...new Set(
      requests
        .map((request) => request.assignment?.assignee)
        .filter(Boolean)
    )].sort();
    const counts = {
      new: requests.filter((request) => request.status === "new").length,
      active: requests.filter((request) =>
        ["contacted", "assigned", "in_progress"].includes(request.status)
      ).length,
      clientUnpaid: requests.filter(
        (request) => request.assignment?.clientPaymentStatus === "unpaid"
      ).length,
      executorUnpaid: requests.filter(
        (request) => request.assignment?.operatorPaymentStatus === "unpaid"
      ).length,
      completed: requests.filter((request) => request.status === "completed").length,
    };
    const timingWeight = {
      "As soon as possible": 0,
      Today: 1,
      Tomorrow: 2,
      "Within a few days": 3,
      "I have a specific date": 4,
    };

    const visibleRequests = requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;
      const matchesAssignee =
        assigneeFilter === "all" ||
        request.assignment?.assignee === assigneeFilter;
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "client_unpaid" &&
          request.assignment?.clientPaymentStatus === "unpaid") ||
        (paymentFilter === "executor_unpaid" &&
          request.assignment?.operatorPaymentStatus === "unpaid");
      const searchable = [
        request.id,
        request.city,
        request.description,
        request.customer?.name || request.name,
        request.customer?.email || request.email,
        request.assignment?.assignee,
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        matchesStatus &&
        matchesAssignee &&
        matchesPayment &&
        (!query || searchable.includes(query))
      );
    }).sort((first, second) => {
      if (sort === "oldest") {
        return new Date(first.createdAt) - new Date(second.createdAt);
      }

      if (sort === "attention") {
        const statusWeight = (request) => request.status === "new" ? 0
          : request.status === "contacted" ? 1
          : request.status === "assigned" ? 2
          : request.status === "in_progress" ? 3
          : 4;
        const byStatus = statusWeight(first) - statusWeight(second);

        if (byStatus !== 0) {
          return byStatus;
        }

        return (timingWeight[first.timing] ?? 5) -
          (timingWeight[second.timing] ?? 5);
      }

      return new Date(second.createdAt) - new Date(first.createdAt);
    });

    return { assignees, counts, visibleRequests };
  }, [requests, filter, search, sort, assigneeFilter, paymentFilter]);

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
            executorId: executors.find((executor) => executor.name === assignee)?.id || "",
            clientPrice,
            operatorPayout,
            jobExpenses,
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

  async function saveExecutor(event) {
    event.preventDefault();
    try {
      setSavingExecutor(true);
      setError("");
      const splitList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
      const response = await fetch(`${API_URL}/api/executors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: executorForm.name,
          contact: executorForm.contact,
          cities: splitList(executorForm.cities),
          specialties: splitList(executorForm.specialties),
        }),
      });
      const data = await response.json();
      if (response.status === 401) return logOut();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to save executor.");
      setExecutors((current) => [...current, data.executor].sort((a, b) => a.name.localeCompare(b.name)));
      setExecutorForm({ name: "", contact: "", cities: "", specialties: "" });
    } catch (err) {
      console.error(err);
      setError("Unable to save executor. Please try again.");
    } finally {
      setSavingExecutor(false);
    }
  }

  async function toggleExecutor(executor) {
    try {
      const response = await fetch(`${API_URL}/api/executors/${executor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !executor.active }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to update executor.");
      setExecutors((current) => current.map((item) => item.id === data.executor.id ? data.executor : item));
    } catch (err) {
      console.error(err);
      setError("Unable to update executor.");
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
            shareWithCustomer: shareProofWithCustomer,
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
      setShareProofWithCustomer(false);
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
      return [...timeline].sort(
        (first, second) =>
          new Date(second.occurredAt) -
          new Date(first.occurredAt)
      ).filter((event) => {
        return !["assigned", "assignment_updated"].includes(event.type);
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

    if (event.type === "client_paid") {
      return "Client paid for this order.";
    }

    if (event.type === "executor_paid") {
      return "Executor received payment.";
    }

    if (event.type === "client_payment_marked_unpaid") {
      return "Client payment marked as unpaid.";
    }

    if (event.type === "executor_payment_marked_unpaid") {
      return "Executor payment marked as unpaid.";
    }

    if (event.type === "executor_assigned") {
      return `Executor assigned: ${event.assignee}.`;
    }

    if (event.type === "client_price_updated") {
      return event.clientPrice === null
        ? "Client price cleared."
        : `Client price set to ${event.clientPrice} ${event.currency}.`;
    }

    if (event.type === "executor_payout_updated") {
      return event.operatorPayout === null
        ? "Executor payout cleared."
        : `Executor payout set to ${event.operatorPayout} ${event.currency}.`;
    }

    if (event.type === "job_expenses_updated") {
      return event.jobExpenses === null
        ? "Job expenses cleared."
        : `Job expenses set to ${event.jobExpenses} ${event.currency}.`;
    }

    if (event.type === "currency_updated") {
      return `Currency changed to ${event.currency}.`;
    }

    if (event.type === "executor_instructions_updated") {
      return event.operatorNote
        ? `Instructions for executor: ${event.operatorNote}`
        : "Instructions for executor cleared.";
    }

    if (event.type === "assigned" || event.type === "assignment_updated") {
      const clientPrice = event.clientPrice ?? event.price;
      const margin = event.margin ?? (
        clientPrice !== null && clientPrice !== undefined &&
        event.operatorPayout !== null && event.operatorPayout !== undefined
          ? Number(clientPrice) - Number(event.operatorPayout) - Number(event.jobExpenses || 0)
          : null
      );
      const clientPriceLabel = clientPrice === null || clientPrice === undefined
        ? "not set"
        : `${clientPrice} ${event.currency}`;
      const executorPayoutLabel = event.operatorPayout === null || event.operatorPayout === undefined
        ? "not set"
        : `${event.operatorPayout} ${event.currency}`;
      const jobExpensesLabel = event.jobExpenses === null || event.jobExpenses === undefined
        ? "not set"
        : `${event.jobExpenses} ${event.currency}`;
      const marginLabel = margin === null || margin === undefined
        ? "not set"
        : `${margin} ${event.currency}`;

      return `Executor: ${event.assignee} · Client: ${clientPriceLabel} · Payout: ${executorPayoutLabel} · Expenses: ${jobExpensesLabel} · Margin: ${marginLabel}`;
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
          <div className="export-menu">
            <button type="button" className="export-button" onClick={exportCsv} disabled={!requests.length}>
              Export CSV
            </button>
            <button type="button" className="export-button" onClick={downloadBackup} disabled={!requests.length && !executors.length}>
              Download backup
            </button>
          </div>
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

        <section className="dashboard-counts" aria-label="Request overview">
          <button type="button" onClick={() => { setFilter("new"); setPaymentFilter("all"); }}>
            <span>New</span><strong>{dashboard.counts.new}</strong>
          </button>
          <button type="button" onClick={() => { setFilter("all"); setPaymentFilter("all"); }}>
            <span>Active</span><strong>{dashboard.counts.active}</strong>
          </button>
          <button type="button" onClick={() => { setFilter("all"); setPaymentFilter("client_unpaid"); }}>
            <span>Client unpaid</span><strong>{dashboard.counts.clientUnpaid}</strong>
          </button>
          <button type="button" onClick={() => { setFilter("all"); setPaymentFilter("executor_unpaid"); }}>
            <span>Executor unpaid</span><strong>{dashboard.counts.executorUnpaid}</strong>
          </button>
          <button type="button" onClick={() => { setFilter("completed"); setPaymentFilter("all"); }}>
            <span>Completed</span><strong>{dashboard.counts.completed}</strong>
          </button>
        </section>

        <section className="executor-directory">
          <div>
            <span className="details-label">EXECUTOR DIRECTORY</span>
            <p>Add active local executors once, then select them in an assignment.</p>
            <form className="executor-form" onSubmit={saveExecutor}>
              <input placeholder="Name" value={executorForm.name} onChange={(event) => setExecutorForm({ ...executorForm, name: event.target.value })} required maxLength="120" />
              <input placeholder="Phone / WhatsApp / Viber" value={executorForm.contact} onChange={(event) => setExecutorForm({ ...executorForm, contact: event.target.value })} required maxLength="160" />
              <input placeholder="Cities, comma separated" value={executorForm.cities} onChange={(event) => setExecutorForm({ ...executorForm, cities: event.target.value })} />
              <input placeholder="Specialties, comma separated" value={executorForm.specialties} onChange={(event) => setExecutorForm({ ...executorForm, specialties: event.target.value })} />
              <button type="submit" disabled={savingExecutor}>{savingExecutor ? "Saving..." : "Add executor"}</button>
            </form>
          </div>
          <div className="executor-list">
            {executors.length === 0 ? <p>No executors added yet.</p> : executors.map((executor) => (
              <div key={executor.id} className={executor.active ? "executor-card" : "executor-card inactive"}>
                <strong>{executor.name}</strong><span>{executor.contact}</span>
                <small>{[...(executor.cities || []), ...(executor.specialties || [])].join(" · ") || "No cities or specialties set"}</small>
                <button type="button" onClick={() => toggleExecutor(executor)}>{executor.active ? "Deactivate" : "Activate"}</button>
              </div>
            ))}
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

        <section className="request-controls" aria-label="Search and filter requests">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, customer, email, city or description"
          />
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="attention">Needs attention</option>
            <option value="oldest">Oldest first</option>
          </select>
          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
            <option value="all">All executors</option>
            {dashboard.assignees.map((assigneeName) => (
              <option key={assigneeName} value={assigneeName}>{assigneeName}</option>
            ))}
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option value="all">All payment states</option>
            <option value="client_unpaid">Client unpaid</option>
            <option value="executor_unpaid">Executor unpaid</option>
          </select>
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
            ) : dashboard.visibleRequests.length === 0 ? (
              <div className="empty-state">
                <strong>No requests</strong>

                <span>
                  There are no requests in this category.
                </span>
              </div>
            ) : (
              dashboard.visibleRequests.map((request) => (
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
                    <select
                      id="assignee"
                      value={assignee}
                      onChange={(event) => setAssignee(event.target.value)}
                      required
                    >
                      <option value="">Select executor</option>
                      {selectedRequest.assignment?.assignee && !executors.some((executor) => executor.name === selectedRequest.assignment.assignee) && (
                        <option value={selectedRequest.assignment.assignee}>{selectedRequest.assignment.assignee} (legacy)</option>
                      )}
                      {executors.filter((executor) => executor.active).map((executor) => (
                        <option key={executor.id} value={executor.name}>{executor.name}{executor.cities?.length ? ` — ${executor.cities.join(", ")}` : ""}</option>
                      ))}
                    </select>

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

                    <div className="assignment-price-row">
                      <div>
                        <label htmlFor="job-expenses">Job expenses</label>
                        <input
                          id="job-expenses"
                          type="number"
                          min="0"
                          step="0.01"
                          value={jobExpenses}
                          onChange={(event) => setJobExpenses(event.target.value)}
                          placeholder="Transport, materials, fees…"
                        />
                      </div>
                    </div>

                    <div className="finance-summary">
                      <span>Client price − executor payout − job expenses = LocalGeo margin</span>
                      <strong>
                        {clientPrice !== "" && operatorPayout !== "" && jobExpenses !== ""
                          ? `${(Number(clientPrice) - Number(operatorPayout) - Number(jobExpenses)).toFixed(2)} ${currency}`
                          : "Enter all amounts"}
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
                      aria-describedby="share-proof-help"
                      placeholder="https://…"
                    />
                    <label id="share-proof-help" className="share-proof-option">
                      <input
                        type="checkbox"
                        checked={shareProofWithCustomer}
                        onChange={(event) => setShareProofWithCustomer(event.target.checked)}
                      />
                      Show this proof link to the customer on their tracking page
                    </label>
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
