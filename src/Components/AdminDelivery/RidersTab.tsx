import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
    getAllRiders,
    getRiderById,
    createRider,
    resetRiderPassword,
    uploadDocument,
} from "../../services/deliveryService";
import type { Rider } from "../../types/delivery";
import { set } from "lodash";

export default function RidersTab() {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newDocument, setNewDocument] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    const [changedPassword, setChangedPassword] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllRiders();
            setRiders(data);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load riders",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !newName.trim() ||
            !newPhone.trim() ||
            !newEmail.trim() ||
            !newPassword.trim()
        ) {
            toast.error("All fields are required");
            return;
        }

        if (!newDocument) {
            toast.error("Document is required");
            return;
        }

        try {
            setCreating(true);

            const docUrl = await uploadDocument(newDocument);

            await createRider({
                fullName: newName.trim(),
                email: newEmail.trim(),
                phoneNumber: newPhone.trim(),
                password: newPassword.trim(),
                documentUrl: docUrl,
            });

            toast.success("Rider created successfully!");
            setNewName("");
            setNewEmail("");
            setNewPhone("");
            setNewPassword("");
            setNewDocument(null);
            setShowForm(false);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to create rider",
            );
        } finally {
            setCreating(false);
        }
    };

    const viewRider = async (riderId: number) => {
        try {
            const data = await getRiderById(riderId);
            setSelectedRider(data);
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to load rider",
            );
        }
    };

    if (loading) {
        return (
            <div className="admin-delivery__loading">
                <div className="admin-delivery__spinner" />
                Loading riders...
            </div>
        );
    }

    if (selectedRider) {
        return (
            <div className="admin-delivery__rider-detail">
                <button
                    className="admin-delivery__detail-back"
                    onClick={() => setSelectedRider(null)}
                >
                    ← Back to riders
                </button>
                <div className="admin-delivery__section-header">
                    <h3 className="admin-delivery__section-title">
                        Rider Profile
                    </h3>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    <div
                        className="admin-delivery__rider-avatar"
                        style={{ width: 56, height: 56, fontSize: "1.4rem" }}
                    >
                        {(selectedRider.name || selectedRider.fullName || "?")
                            .charAt(0)
                            .toUpperCase()}
                    </div>
                    <div>
                        <div
                            style={{
                                fontWeight: 700,
                                color: "#111827",
                                fontSize: "1.1rem",
                            }}
                        >
                            {selectedRider.name ||
                                selectedRider.fullName ||
                                "Unknown"}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                            {selectedRider.phoneNumber}
                        </div>
                    </div>
                </div>
                <div className="admin-delivery__detail-grid">
                    <div>
                        <div className="admin-delivery__detail-label">
                            Rider ID
                        </div>
                        <div className="admin-delivery__detail-value">
                            #{selectedRider.id}
                        </div>
                    </div>
                    {selectedRider.userId && (
                        <div>
                            <div className="admin-delivery__detail-label">
                                Linked User ID
                            </div>
                            <div className="admin-delivery__detail-value">
                                #{selectedRider.userId}
                            </div>
                        </div>
                    )}
                    {selectedRider.createdAt && (
                        <div>
                            <div className="admin-delivery__detail-label">
                                Created
                            </div>
                            <div className="admin-delivery__detail-value">
                                {new Date(
                                    selectedRider.createdAt,
                                ).toLocaleDateString()}
                            </div>
                        </div>
                    )}
                    <div>
                        <div>Reset Rider Password</div>
                        <input
                            value={changedPassword}
                            onChange={(e) => setChangedPassword(e.target.value)}
                            type="text"
                            placeholder="Enter new password"
                            style={{
                                border: "1px solid black",
                                width: "fit-content",
                                height: "100%",
                                margin: "0 5px 0 0",
                                padding: "0px 8px",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={async () => {
                                await resetRiderPassword(
                                    selectedRider.id,
                                    changedPassword,
                                );
                                toast.success("password changed successfully");
                                setChangedPassword("");
                            }}
                            style={{
                                height: "100%",
                                padding: "0px 16px",
                                borderRadius: "10px",
                                border: "1px solid black",
                                cursor: "pointer",
                            }}
                        >
                            Change
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="admin-delivery__section-header">
                <h3 className="admin-delivery__section-title">
                    Riders ({riders.length})
                </h3>
                <button
                    className="admin-delivery__btn admin-delivery__btn--primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "✕ Cancel" : "+ New Rider"}
                </button>
            </div>

            {showForm && (
                <form className="admin-delivery__form" onSubmit={handleCreate}>
                    <div className="admin-delivery__form-title">New Rider</div>
                    <div className="admin-delivery__form-group">
                        <label className="admin-delivery__form-label">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            className="admin-delivery__form-input"
                            placeholder="e.g. Ram Bahadur"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-delivery__form-group">
                        <label className="admin-delivery__form-label">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            className="admin-delivery__form-input"
                            placeholder="e.g. 98XXXXXXXX"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-delivery__form-group">
                        <label className="admin-delivery__form-label">
                            Email *
                        </label>
                        <input
                            type="email"
                            className="admin-delivery__form-input"
                            placeholder="e.g. rider@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-delivery__form-group">
                        <label className="admin-delivery__form-label">
                            Password *
                        </label>
                        <input
                            type="password"
                            className="admin-delivery__form-input"
                            placeholder="Minimum 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-delivery__form-group">
                        <label
                            className="admin-delivery__form-label"
                            htmlFor="document"
                        >
                            Document
                        </label>
                        <label className="admin-delivery__file-upload">
                            <span>
                                {newDocument
                                    ? newDocument.name
                                    : "Choose a file"}
                            </span>
                            <span className="admin-delivery__file-upload-hint">
                                (max 5MB)
                            </span>
                            <input
                                id="document"
                                type="file"
                                className="admin-delivery__file-input"
                                accept="application/pdf,image/*"
                                onChange={(e) =>
                                    setNewDocument(e.target.files?.[0] ?? null)
                                }
                            />
                        </label>
                    </div>
                    <div className="admin-delivery__form-actions">
                        <button
                            type="submit"
                            className="admin-delivery__btn admin-delivery__btn--success"
                            disabled={creating}
                        >
                            {creating ? "Creating..." : "Create Rider"}
                        </button>
                        <button
                            type="button"
                            className="admin-delivery__btn admin-delivery__btn--ghost"
                            onClick={() => {
                                setShowForm(false);
                                setNewName("");
                                setNewEmail("");
                                setNewPhone("");
                                setNewPassword("");
                                setNewDocument(null);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
            {!showForm && (
                <>
                    {riders.length === 0 ? (
                        <div className="admin-delivery__empty">
                            <div className="admin-delivery__empty-icon">🏍️</div>
                            No riders yet. Create one above.
                        </div>
                    ) : (
                        <div className="admin-delivery__rider-grid">
                            {riders.map((rider) => (
                                <div
                                    key={rider.id}
                                    className="admin-delivery__rider-card"
                                    onClick={() => viewRider(rider.id)}
                                >
                                    <div className="admin-delivery__rider-avatar">
                                        {(rider.name || rider.fullName || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="admin-delivery__rider-name">
                                        {rider.name ||
                                            rider.fullName ||
                                            "Unknown"}
                                    </div>
                                    <div className="admin-delivery__rider-phone">
                                        📞 {rider.phoneNumber}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            fontSize: "0.75rem",
                                            color: "#9ca3af",
                                        }}
                                    >
                                        ID #{rider.id} · Click to view
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
}
