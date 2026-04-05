import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "../Styles/RiderDelivery.css";
import {
    getRiderAssignments,
    confirmPickup,
    markDelivered,
    markFailed,
} from "../services/deliveryService";
import type { DeliveryAssignment } from "../types/delivery";
import { AssignmentStatus } from "../types/delivery";
import StatusModal, { ModalState } from "../Components/RiderDelivery/StatusModal";
import CompletedAssignments from "../Components/RiderDelivery/CompletedAssignments";
import ActiveAssignments from "../Components/RiderDelivery/ActiveAssignments";


const RiderDelivery: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [modal, setModal] = useState<ModalState | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getRiderAssignments();
            setAssignments(data);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Failed to load assignments",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) load();
    }, [authLoading, load]);

    const openModal = (
        assignment: DeliveryAssignment,
        action: ModalState["action"],
    ) => {
        setModal({ assignment, action });
    };

    const closeModal = () => {
        if (!submitting) setModal(null);
    };

    const handlePickup = async (orderId: number) => {
        try {
            setSubmitting(true);
            await confirmPickup(orderId);
            toast.success("Pickup confirmed! Order is now Out for Delivery.");
            setModal(null);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to confirm pickup",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelivered = async (orderId: number) => {
        try {
            setSubmitting(true);
            await markDelivered(orderId);
            toast.success("Order marked as Delivered! 🎉");
            setModal(null);
            load();
        } catch (e) {
            toast.error(
                e instanceof Error ? e.message : "Failed to mark as delivered",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleFailed = async (orderId: number, reason: string) => {
        if (!reason.trim()) {
            toast.error("Please enter a failure reason");
            return;
        }
        try {
            setSubmitting(true);
            await markFailed(orderId, reason.trim());
            toast.success("Delivery marked as failed.");
            setModal(null);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    // Render States

    if (authLoading || loading) {
        return (
            <div className="rd-page">
                <div className="rd-loading">
                    <div className="rd-spinner" />
                    <span>Loading your assignments...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="rd-page">
                <div className="rd-error">
                    Please log in to view your delivery assignments.
                </div>
            </div>
        );
    }

    // Partition assignments
    const active = assignments.filter(
        (a) =>
            a.assignmentStatus === AssignmentStatus.ASSIGNED ||
            a.assignmentStatus === AssignmentStatus.PICKED_UP,
    );
    const completed = assignments.filter(
        (a) =>
            a.assignmentStatus === AssignmentStatus.DELIVERED ||
            a.assignmentStatus === AssignmentStatus.FAILED,
    );

    return (
        <div className="rd-page">
            {/* Page Header */}
            <div className="rd-page-header">
                <button
                    className="rd-back-btn"
                    onClick={() => navigate(-1)}
                    title="Go Back"
                >
                    ← Back
                </button>
                <div className="rd-header-text">
                    <h1 className="rd-page-title">My Deliveries</h1>
                    <p className="rd-page-subtitle">
                        {active.length} active · {completed.length} completed
                    </p>
                </div>
                <button
                    className="rd-refresh-btn"
                    onClick={load}
                    title="Refresh"
                >
                    ↻ Refresh
                </button>
            </div>

            {error && <div className="rd-error">{error}</div>}

            {assignments.length === 0 ? (
                <div className="rd-empty">
                    <div className="rd-empty-icon">📭</div>
                    <div className="rd-empty-title">No assignments yet</div>
                    <p className="rd-empty-sub">
                        When orders are assigned to you, they'll appear here.
                    </p>
                </div>
            ) : (
                <div className="rd-content">
                    {/* active assignment */}
                    <ActiveAssignments active={active} openModal={openModal} />

                    {/* Completed Assignments */}
                    <CompletedAssignments completed={completed} />
                </div>
            )}

            {/* Modal */}
            {modal && (
                <StatusModal
                    modal={modal}
                    onClose={closeModal}
                    onPickup={handlePickup}
                    onDelivered={handleDelivered}
                    onFailed={handleFailed}
                    submitting={submitting}
                />
            )}
        </div>
    );
};

export default RiderDelivery;
