import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Header from "../Components/Header";
import { AdminSidebar } from "../Components/AdminSidebar";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import { useAuth } from "../context/AuthContext";
import commissionApi, { CommissionDocument, isPdf } from "../api/commission";
import { useCommissionFile } from "../Hook/useCommissionFile";
import "../Styles/AdminStaff.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  csv: "📊",
};

const fileIcon = (fileName?: string): string => {
  if (!fileName) return "📁";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICONS[ext] ?? "📁";
};

// ─── sub-components ──────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: CommissionDocument;
  actionLoading: "view" | "download" | "preview" | null;
  previewOpen: boolean;
  previewLoading: boolean;
  previewUrl: string | null;
  onView: () => void;
  onDownload: () => void;
  onTogglePreview: () => void;
  onDelete: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  actionLoading,
  previewOpen,
  previewLoading,
  previewUrl,
  onView,
  onDownload,
  onTogglePreview,
  onDelete,
}) => {
  const canPreview = isPdf(doc.fileName || doc.fileUrl);

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* ── metadata row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* icon */}
        <div
          aria-hidden
          style={{
            fontSize: 36,
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff7ed",
            borderRadius: 12,
            flexShrink: 0,
          }}
        >
          {fileIcon(doc.fileName)}
        </div>

        {/* text */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
            {doc.title}
          </p>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {doc.fileName || "document"}
          </p>
          <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 13 }}>
            Last updated {new Date(doc.updatedAt).toLocaleString()}
            {doc.uploadedBy?.fullName ? ` by ${doc.uploadedBy.fullName}` : ""}
          </p>
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canPreview && (
            <button
              type="button"
              onClick={onTogglePreview}
              disabled={actionLoading !== null}
              className="admin-staff__btn admin-staff__btn--secondary"
            >
              {previewLoading
                ? "Loading…"
                : previewOpen
                  ? "Hide Preview"
                  : "Preview"}
            </button>
          )}
          <button
            type="button"
            onClick={onView}
            disabled={actionLoading !== null}
            className="admin-staff__btn admin-staff__btn--secondary"
          >
            {actionLoading === "view" ? "Opening…" : "View"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={actionLoading !== null}
            className="admin-staff__btn admin-staff__btn--primary"
          >
            {actionLoading === "download" ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={actionLoading !== null}
            className="admin-staff__btn admin-staff__btn--danger"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── inline preview panel ── */}
      {previewOpen && canPreview && (
        <div
          style={{
            marginTop: 20,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          {previewLoading || !previewUrl ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 20,
                  height: 20,
                  border: "2px solid #e5e7eb",
                  borderTopColor: "#F97316",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
              />
              Loading preview…
            </div>
          ) : (
            <iframe
              src={previewUrl}
              title="Commission document preview"
              style={{
                width: "100%",
                height: 880,
                border: "none",
                display: "block",
              }}
            />
          )}
        </div>
      )}

      {/* non-PDF notice */}
      {!canPreview && (
        <p style={{ marginTop: 16, color: "#9ca3af", fontSize: 13 }}>
          Inline preview isn't available for this file type — use View or
          Download above.
        </p>
      )}
    </div>
  );
};

// ── upload form ──────────────────────────────────────────────────────────────

interface UploadFormProps {
  onSuccess: (doc: CommissionDocument) => void;
  token: string | null;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSuccess, token }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!file) {
      toast.error("Please choose a file to upload");
      return;
    }

    setSubmitting(true);
    try {
      const response = await commissionApi.uploadAndReplace(
        title.trim(),
        file,
        token,
      );
      if (response.success && response.data) {
        toast.success(
          "Commission document updated — vendors will see it immediately",
        );
        setTitle("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess(response.data);
      } else {
        toast.error(response.message || "Failed to update commission document");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload document",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-staff__form">
      <div className="admin-staff__form-group">
        <label htmlFor="commissionTitle" className="admin-staff__label">
          Title <span aria-hidden>*</span>
        </label>
        <input
          id="commissionTitle"
          type="text"
          className="admin-staff__input"
          placeholder="e.g. Commission Structure 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="admin-staff__form-group">
        <label className="admin-staff__label">
          File (PDF only) <span aria-hidden>*</span>
        </label>

        {/*
          The native file input is hidden because an unscoped rule in AddVendorModal.css
          sets display:none on all file inputs globally.
        */}
        <input
          ref={fileInputRef}
          id="commissionFile"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
          disabled={submitting}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="admin-staff__btn admin-staff__btn--secondary"
          disabled={submitting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {file ? "Change File" : "Choose File"}
        </button>

        {file && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280" }}>
            Selected: <strong>{file.name}</strong> (
            {(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="admin-staff__form-actions">
        <button
          type="submit"
          className="admin-staff__btn admin-staff__btn--primary"
          disabled={submitting}
          style={{ minWidth: 220 }}
        >
          {submitting ? "Uploading…" : "Upload & Notify Vendors"}
        </button>
      </div>
    </form>
  );
};

// ── delete dialog ─────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  doc: CommissionDocument;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  doc,
  onConfirm,
  onCancel,
  isDeleting,
}) => (
  <div className="admin-staff__dialog-overlay">
    <div className="admin-staff__dialog">
      <h3>Delete Commission Document</h3>
      <p>
        Are you sure you want to delete <strong>{doc.title}</strong>? Vendors
        will no longer see it on their dashboard.
      </p>
      <div className="admin-staff__dialog-actions">
        <button
          className="admin-staff__btn admin-staff__btn--secondary"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          className="admin-staff__btn admin-staff__btn--danger"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ── page ──────────────────────────────────────────────────────────────────────

const AdminCommission: React.FC = () => {
  const { token } = useAuth();
  const docketHeight = useDocketHeight();

  const [commissionDoc, setCommissionDoc] = useState<CommissionDocument | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    previewUrl,
    previewLoading,
    actionLoading,
    previewOpen,
    handleView,
    handleDownload,
    handleTogglePreview,
  } = useCommissionFile(commissionDoc, token);

  const fetchDocument = useCallback(async () => {
    setLoading(true);
    try {
      const response = await commissionApi.getCurrentDocument(token);
      setCommissionDoc(response.success ? (response.data ?? null) : null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleUploadSuccess = useCallback((doc: CommissionDocument) => {
    setCommissionDoc(doc);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await commissionApi.deleteDocument(token);
      if (response.success) {
        toast.success("Commission document deleted");
        setCommissionDoc(null);
        setShowDeleteConfirm(false);
      } else {
        toast.error(response.message || "Failed to delete commission document");
      }
    } catch {
      toast.error("Failed to delete commission document");
    } finally {
      setIsDeleting(false);
    }
  }, [token]);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", height: "100vh" }}>
        <AdminSidebar />

        <main
          className="admin-main"
          style={{
            minHeight: docketHeight,
            overflow: "auto",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div className="admin-categories__content">
            <Header title="Commission Document" />

            <div className="admin-staff__header">
              <div className="admin-staff__title-section">
                <h1 className="admin-staff__title">Commission Document</h1>
                <p className="admin-staff__subtitle">
                  Upload the commission structure document vendors see on their
                  dashboard. Replacing it notifies all vendors instantly.
                </p>
              </div>
            </div>

            {/* ── current document card ── */}
            <div className="admin-staff__form-container">
              <div className="admin-staff__form-header">
                <h2>Current Document</h2>
              </div>

              {loading ? (
                <p style={{ padding: "20px 24px", color: "#6b7280" }}>
                  Loading…
                </p>
              ) : commissionDoc ? (
                <DocumentCard
                  doc={commissionDoc}
                  actionLoading={actionLoading}
                  previewOpen={previewOpen}
                  previewLoading={previewLoading}
                  previewUrl={previewUrl}
                  onView={handleView}
                  onDownload={handleDownload}
                  onTogglePreview={handleTogglePreview}
                  onDelete={() => setShowDeleteConfirm(true)}
                />
              ) : (
                <p style={{ padding: "20px 24px", color: "#6b7280" }}>
                  No commission document has been uploaded yet.
                </p>
              )}
            </div>

            {/* ── upload form card ── */}
            <div className="admin-staff__form-container">
              <div className="admin-staff__form-header">
                <h2>Upload New Document</h2>
              </div>
              <UploadForm onSuccess={handleUploadSuccess} token={token} />
            </div>
          </div>
        </main>
      </div>

      {showDeleteConfirm && commissionDoc && (
        <DeleteDialog
          doc={commissionDoc}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default AdminCommission;
