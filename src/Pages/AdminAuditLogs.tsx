import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import AuditLogDetailModal, { AuditLog } from "../Components/Modal/AuditLogDetailModal";
import axiosInstance from "../api/axiosInstance";
import "../Styles/AdminAuditLogs.css";

const pageSizeOptions = [10, 25, 50, 100];
const actorTypes = ["", "ADMIN", "STAFF", "VENDOR", "USER", "RIDER", "SYSTEM"];
const modules = ["", "ACCOUNT", "ORDER", "PRODUCT"];
export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [actorType, setActorType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const requestId = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const query = useMemo(() => ({
    page,
    limit,
    ...(search ? { search } : {}),
    ...(module ? { module } : {}),
    ...(actorType ? { actorType } : {}),
    ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
  }), [page, limit, search, module, actorType, from, to]);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/api/admin/audit-logs", { params: query });
      if (currentRequest !== requestId.current) return;
      setLogs(response.data?.data ?? []);
      setTotal(Number(response.data?.total ?? 0));
    } catch (requestError: any) {
      if (currentRequest !== requestId.current) return;
      setError(requestError?.response?.data?.message || "Could not load audit logs. Refresh and try again.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="admin-orders audit-logs">
      <AdminSidebar />
      <main className="admin-orders__content">
        <Header title="Audit Logs" showSearch={false} />
        <section className="admin-orders__list-container audit-logs__content">
          <div className="audit-logs__heading">
            <div><h1 className="admin-orders__title">Audit Logs</h1><p>Track important account, catalog, and order activity. Sensitive values stay redacted.</p></div>
            <button className="audit-logs__refresh" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} aria-hidden /> Refresh</button>
          </div>

          <form className="admin-orders__filters audit-logs__filters" onSubmit={applySearch}>
            <label className="audit-logs__search"><span className="sr-only">Search audit logs</span><Search size={18} aria-hidden /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search activity, actor, entity, or ID" /></label>
            <div className="admin-orders__filter-group"><label htmlFor="audit-module">Module</label><select id="audit-module" className="admin-orders__filter-select" value={module} onChange={(event) => updateFilter(setModule, event.target.value)}>{modules.map((item) => <option key={item || "all"} value={item}>{item || "All modules"}</option>)}</select></div>
            <div className="admin-orders__filter-group"><label htmlFor="audit-actor">Actor</label><select id="audit-actor" className="admin-orders__filter-select" value={actorType} onChange={(event) => updateFilter(setActorType, event.target.value)}>{actorTypes.map((item) => <option key={item || "all"} value={item}>{item || "All actors"}</option>)}</select></div>
            <div className="admin-orders__filter-group"><label htmlFor="audit-from">From</label><input id="audit-from" type="date" value={from} max={to || undefined} onChange={(event) => updateFilter(setFrom, event.target.value)} /></div>
            <div className="admin-orders__filter-group"><label htmlFor="audit-to">To</label><input id="audit-to" type="date" value={to} min={from || undefined} onChange={(event) => updateFilter(setTo, event.target.value)} /></div>
            <button className="audit-logs__search-button" type="submit">Search</button>
          </form>

          {error && <div className="audit-logs__error" role="alert">{error} <button type="button" onClick={() => void load()}>Try again</button></div>}

          <div className="admin-orders__table-container audit-logs__table-container">
            <table className="admin-orders__table audit-logs__table">
              <thead className="admin-orders__table-head"><tr><th>When</th><th>Activity</th><th>Actor</th><th>Entity</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="admin-orders__table-state">Loading audit logs…</td></tr> : logs.length === 0 ? <tr><td colSpan={5} className="admin-orders__table-state">No audit logs match current filters.</td></tr> : logs.map((log) => <tr className="admin-orders__table-row" key={log.id}>
                  <td data-label="When" className="audit-logs__time">{formatDate(log.createdAt)}</td>
                  <td data-label="Activity"><strong>{log.summary}</strong><span className="audit-logs__activity-code">{log.module} · {log.action}</span></td>
                  <td data-label="Actor">{log.actor.displayName}</td>
                  <td data-label="Entity">{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</td>
                  <td data-label="Actions" className="admin-orders__actions"><button className="audit-logs__details" type="button" onClick={() => setSelectedLog(log)}>Details</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>

          <div className="admin-orders__pagination audit-logs__pagination">
            <span className="admin-orders__pagination-info">{total ? `Showing ${rangeStart}–${rangeEnd} of ${total}` : "No records"}</span>
            <div className="audit-logs__pagination-controls"><label>Rows per page <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><button className="admin-orders__pagination-btn" type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 1 || loading}>Previous</button><span>Page {page} of {totalPages}</span><button className="admin-orders__pagination-btn" type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages || loading}>Next</button></div>
          </div>
        </section>
      </main>
      <AuditLogDetailModal auditLog={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
