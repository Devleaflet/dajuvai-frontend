import { useEffect } from "react";
import { X } from "lucide-react";
import "./AuditLogDetailModal.css";

export type AuditLog = {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorType: string;
  actorId: number | null;
  actor: {
    id: number | null;
    type: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    displayName: string;
  };
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};

function ChangeSet({
  title,
  value,
}: {
  title: string;
  value: Record<string, unknown> | null;
}) {
  const entries = Object.entries(value ?? {});
  return (
    <section className="audit-detail-modal__changes">
      <h3>{title}</h3>
      {entries.length ? (
        <dl>
          {entries.map(([key, item]) => (
            <div key={key}>
              <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd>
                {typeof item === "object"
                  ? JSON.stringify(item)
                  : String(item ?? "—")}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>No recorded values.</p>
      )}
    </section>
  );
}

export default function AuditLogDetailModal({
  auditLog,
  onClose,
}: {
  auditLog: AuditLog | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!auditLog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [auditLog, onClose]);
  if (!auditLog) return null;
  const timestamp = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date(auditLog.createdAt));
  return (
    <div
      className="audit-detail-modal__overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="audit-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p>Audit record</p>
            <h2 id="audit-detail-title">{auditLog.summary}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit log details"
          >
            <X size={20} />
          </button>
        </header>
        <div className="audit-detail-modal__body">
          <div className="audit-detail-modal__metadata">
            <div>
              <span>When</span>
              <strong>{timestamp}</strong>
            </div>
            <div>
              <span>Activity</span>
              <strong>
                {auditLog.module} · {auditLog.action}
              </strong>
            </div>
            <div>
              <span>Actor</span>
              <strong>{auditLog.actor.displayName}</strong>
            </div>
            <div>
              <span>Actor ID</span>
              <strong>{auditLog.actor.id ?? "System"}</strong>
            </div>
            <div>
              <span>Actor email</span>
              <strong>{auditLog.actor.email || "Not available"}</strong>
            </div>
            <div>
              <span>Actor contact</span>
              <strong>{auditLog.actor.phoneNumber || "Not available"}</strong>
            </div>
            <div>
              <span>Entity</span>
              <strong>
                {auditLog.entityType}
                {auditLog.entityId ? ` #${auditLog.entityId}` : ""}
              </strong>
            </div>
          </div>
          <ChangeSet title="Before change" value={auditLog.before} />
          <ChangeSet title="After change" value={auditLog.after} />
        </div>
        <footer
          style={{
            display: "flex",
            justifyContent: "flex-end",
            background: "#f9f9f9",
            padding: "1rem",
          }}
        >
          <button type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
