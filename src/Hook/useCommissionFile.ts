import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import commissionApi, { CommissionDocument } from "../api/commission";

type ActionKind = "view" | "download" | "preview";

interface UseCommissionFileReturn {
  /** Blob URL for the inline <iframe> preview — null until the user clicks "Preview" */
  previewUrl: string | null;
  /** True while the preview blob is being fetched */
  previewLoading: boolean;
  /** Which action button is currently in-flight */
  actionLoading: ActionKind | null;
  /** Open the document in a new browser tab */
  handleView: () => Promise<void>;
  /** Trigger a file download */
  handleDownload: () => Promise<void>;
  /** Toggle the inline preview panel (lazy — fetches on first open) */
  handleTogglePreview: () => Promise<void>;
  /** Whether the preview panel is currently open */
  previewOpen: boolean;
}

/**
 * All commission file interactions in one place.
 *
 * Key design decisions
 * ─────────────────────
 * • Preview is **lazy** — the blob is only fetched when the user explicitly opens the panel.
 * • The blob is **cached** for the lifetime of the component so toggling open/close is free.
 * • Every blob URL is revoked on unmount to avoid memory leaks.
 * • View and Download each create a short-lived, independent blob URL so they don't
 *   interfere with the cached preview URL.
 */
export function useCommissionFile(
  commissionDoc: CommissionDocument | null,
  token: string | null,
): UseCommissionFileReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<ActionKind | null>(null);

  // Stable ref for the cached preview blob URL — survives re-renders without triggering them
  const cachedPreviewUrlRef = useRef<string | null>(null);
  // Track whether we've already fetched the preview blob for the current document
  const fetchedForDocIdRef = useRef<number | null>(null);

  // Revoke the cached URL and reset state whenever the document changes
  useEffect(() => {
    if (cachedPreviewUrlRef.current) {
      URL.revokeObjectURL(cachedPreviewUrlRef.current);
      cachedPreviewUrlRef.current = null;
    }
    fetchedForDocIdRef.current = null;
    setPreviewUrl(null);
    setPreviewOpen(false);
  }, [commissionDoc?.id]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      if (cachedPreviewUrlRef.current) {
        URL.revokeObjectURL(cachedPreviewUrlRef.current);
      }
    };
  }, []);

  const handleTogglePreview = useCallback(async () => {
    if (!commissionDoc) return;

    // Close if already open
    if (previewOpen) {
      setPreviewOpen(false);
      return;
    }

    // Open — serve from cache if available
    if (cachedPreviewUrlRef.current) {
      setPreviewUrl(cachedPreviewUrlRef.current);
      setPreviewOpen(true);
      return;
    }

    // First open — fetch the blob
    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      const blob = await commissionApi.getFileBlob(false, token);
      const url = URL.createObjectURL(blob);
      cachedPreviewUrlRef.current = url;
      fetchedForDocIdRef.current = commissionDoc.id;
      setPreviewUrl(url);
    } catch {
      toast.error("Failed to load document preview");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [commissionDoc, previewOpen, token]);

  const handleView = useCallback(async () => {
    if (!commissionDoc || actionLoading) return;
    setActionLoading("view");
    try {
      const blob = await commissionApi.getFileBlob(false, token);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Give the new tab time to receive the blob before revoking
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Failed to open document");
    } finally {
      setActionLoading(null);
    }
  }, [commissionDoc, actionLoading, token]);

  const handleDownload = useCallback(async () => {
    if (!commissionDoc || actionLoading) return;
    setActionLoading("download");
    try {
      const blob = await commissionApi.getFileBlob(true, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = commissionDoc.fileName || "commission-document.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
    } finally {
      setActionLoading(null);
    }
  }, [commissionDoc, actionLoading, token]);

  return {
    previewUrl,
    previewLoading,
    actionLoading,
    handleView,
    handleDownload,
    handleTogglePreview,
    previewOpen,
  };
}
