// api/commission.ts
import axiosInstance from "./axiosInstance";

export interface CommissionDocument {
  id: number;
  title: string;
  fileUrl: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: number; fullName: string };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export const getFileExtension = (fileNameOrUrl: string): string => {
  const clean = fileNameOrUrl.split(/[?#]/)[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

export const isPdf = (fileNameOrUrl: string): boolean =>
  getFileExtension(fileNameOrUrl) === "pdf";

const commissionApi = {
  /**
   * Fetch the document currently visible on vendor dashboards.
   * Returns { success: true, data: null } when no document exists — never rejects on 404.
   */
  async getCurrentDocument(
    token: string | null,
  ): Promise<ApiResponse<CommissionDocument | null>> {
    try {
      const response = await axiosInstance.get("/api/commission", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) {
        return { success: true, data: response.data.data ?? null };
      }

      return {
        success: false,
        message: response.data?.message ?? "Failed to load commission document",
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ?? "Failed to load commission document",
      };
    }
  },

  /**
   * Upload a new PDF. Replaces the currently active document.
   */
  async uploadAndReplace(
    title: string,
    file: File,
    token: string | null,
  ): Promise<ApiResponse<CommissionDocument>> {
    if (file.type !== "application/pdf") {
      return {
        success: false,
        message: "Only PDF files are allowed for the commission document",
      };
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);

      const response = await axiosInstance.post("/api/commission", formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: (status) => status < 500,
      });

      if (response.status === 201) {
        return { success: true, data: response.data.data };
      }

      return {
        success: false,
        message:
          response.data?.message ?? "Failed to upload commission document",
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ??
          "Failed to upload commission document",
      };
    }
  },

  /**
   * Stream the file from our own server as a Blob.
   * Pass download=true to set Content-Disposition: attachment.
   */
  async getFileBlob(download: boolean, token: string | null): Promise<Blob> {
    const response = await axiosInstance.get("/api/commission/file", {
      params: download ? { download: "1" } : undefined,
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data as Blob;
  },

  /**
   * Soft-delete the active commission document.
   * Backend broadcasts "commission:delete" to all connected vendors.
   */
  async deleteDocument(token: string | null): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete("/api/commission", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) return { success: true };

      return {
        success: false,
        message:
          response.data?.message ?? "Failed to delete commission document",
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ??
          "Failed to delete commission document",
      };
    }
  },
};

export default commissionApi;
