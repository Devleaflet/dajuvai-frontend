import React, { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { Sidebar } from "../Components/Sidebar";
import VendorHeader from "../Components/VendorHeader";
import { useVendorAuth } from "../context/VendorAuthContext";
import { useDocketHeight } from "../Hook/UseDockerHeight";
import commissionApi, { CommissionDocument, isPdf } from "../api/commission";
import { useCommissionFile } from "../Hook/useCommissionFile";
import { API_BASE_URL } from "../config";

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

// ─── empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px",
      color: "#9ca3af",
      textAlign: "center",
      gap: 12,
    }}
  >
    <span style={{ fontSize: 48 }}>📭</span>
    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#6b7280" }}>
      No commission document yet
    </p>
    <p style={{ margin: 0, fontSize: 14 }}>
      The admin hasn't uploaded a commission document yet. Check back later.
    </p>
  </div>
);

// ─── page ────────────────────────────────────────────────────────────────────

const VendorCommission: React.FC = () => {
  const { authState } = useVendorAuth();
  const docketHeight = useDocketHeight();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [commissionDoc, setCommissionDoc] = useState<CommissionDocument | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const {
    previewUrl,
    previewLoading,
    actionLoading,
    previewOpen,
    handleView,
    handleDownload,
    handleTogglePreview,
  } = useCommissionFile(commissionDoc, authState.token);

  // ── responsive ────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── initial fetch ─────────────────────────────────────────────────────────

  const fetchDocument = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const response = await commissionApi.getCurrentDocument(authState.token);
      setCommissionDoc(response.success ? (response.data ?? null) : null);
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // ── real-time updates via Socket.io ──────────────────────────────────────

  useEffect(() => {
    if (!authState.token) return;

    const socket: Socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: authState.token },
    });

    const handleCommissionUpdate = (updated: CommissionDocument) => {
      setCommissionDoc(updated);
      toast.success("Commission document was updated by admin");
    };

    const handleCommissionDelete = () => {
      setCommissionDoc(null);
      toast("The commission document was removed by admin", { icon: "ℹ️" });
    };

    socket.on("commission:update", handleCommissionUpdate);
    socket.on("commission:delete", handleCommissionDelete);
    socket.on("connect_error", (err) =>
      console.error("[Socket] connect error:", err),
    );

    return () => {
      socket.off("commission:update", handleCommissionUpdate);
      socket.off("commission:delete", handleCommissionDelete);
      socket.disconnect();
    };
  }, [authState.token]);

  // ── render ────────────────────────────────────────────────────────────────

  const canPreview = commissionDoc
    ? isPdf(commissionDoc.fileName || commissionDoc.fileUrl)
    : false;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="vendor-dash-container">
        <Sidebar />

        <div className={`dashboard${isMobile ? " dashboard--mobile" : ""}`}>
          <VendorHeader title="Commission" showSearch={false} />

          <main
            className="dashboard__main"
            style={{
              paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px",
            }}
          >
            <div
              className="section-card"
              style={{ maxWidth: "100%", margin: "24px auto", padding: 24 }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>
                Commission Document
              </h2>

              {/* ── loading ── */}
              {loading && <p style={{ color: "#6b7280" }}>Loading…</p>}

              {/* ── empty ── */}
              {!loading && !commissionDoc && <EmptyState />}

              {/* ── document ── */}
              {!loading && commissionDoc && (
                <>
                  {/* metadata row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                      padding: "16px",
                      background: "#f9fafb",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
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
                      {fileIcon(commissionDoc.fileName)}
                    </div>

                    {/* text */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                        {commissionDoc.title}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#6b7280",
                          fontSize: 14,
                        }}
                      >
                        {commissionDoc.fileName || "document"}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          color: "#9ca3af",
                          fontSize: 13,
                        }}
                      >
                        Last updated{" "}
                        {new Date(commissionDoc.updatedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* action buttons */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {canPreview && (
                        <button
                          type="button"
                          onClick={handleTogglePreview}
                          disabled={actionLoading !== null}
                          style={{
                            padding: "10px 18px",
                            background: previewOpen ? "#f3f4f6" : "#fff",
                            color: "#F97316",
                            border: "1px solid #F97316",
                            borderRadius: 6,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
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
                        onClick={handleView}
                        disabled={actionLoading !== null}
                        style={{
                          padding: "10px 18px",
                          background: "#fff",
                          color: "#F97316",
                          border: "1px solid #F97316",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {actionLoading === "view" ? "Opening…" : "View"}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={actionLoading !== null}
                        style={{
                          padding: "10px 18px",
                          background: "#F97316",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {actionLoading === "download"
                          ? "Downloading…"
                          : "Download"}
                      </button>
                    </div>
                  </div>

                  {/* non-PDF notice */}
                  {!canPreview && (
                    <p
                      style={{ marginTop: 16, color: "#9ca3af", fontSize: 13 }}
                    >
                      Inline preview isn't available for this file type — use
                      View or Download above.
                    </p>
                  )}

                  {/* inline preview panel — only rendered after user requests it */}
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
                            height: isMobile ? 500 : 800,
                            border: "none",
                            display: "block",
                          }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default VendorCommission;
