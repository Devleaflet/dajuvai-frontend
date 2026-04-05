import React, { useState } from "react";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext";
import "../Styles/AdminDelivery.css";

import ProcessingTab from "../Components/AdminDelivery/ProcessingTab";
import WarehouseQueueTab from "../Components/AdminDelivery/WarehouseQueueTab";
import AssignmentsTab from "../Components/AdminDelivery/AssignmentsTab";
import RidersTab from "../Components/AdminDelivery/RidersTab";
import FailedRecoveryTab from "../Components/AdminDelivery/FailedRecoveryTab";


type Tab = "processing" | "queue" | "assignments" | "riders" | "failed";

const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: "processing", label: "🔄 Processing Orders" },
    { key: "queue", label: "📦 Warehouse Queue" },
    { key: "assignments", label: "📋 All Assignments" },
    { key: "riders", label: "🏍️ Riders" },
    { key: "failed", label: "⚠️ Failed Recovery" },
];


const AdminDelivery: React.FC = () => {
    const { token, isAuthenticated, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("processing");

    if (authLoading) {
        return (
            <div className="admin-delivery">
                <AdminSidebar />
                <div className="admin-delivery__content">
                    <div className="admin-delivery__loading">
                        <div className="admin-delivery__spinner" />
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !token) {
        return (
            <div className="admin-delivery">
                <AdminSidebar />
                <div className="admin-delivery__content">
                    <div className="admin-delivery__loading">
                        Please log in to access delivery management.
                    </div>
                </div>
            </div>
        );
    }

    const renderTab = () => {
        switch (activeTab) {
            case "processing":
                return <ProcessingTab />;
            case "queue":
                return <WarehouseQueueTab />;
            case "assignments":
                return <AssignmentsTab />;
            case "riders":
                return <RidersTab />;
            case "failed":
                return <FailedRecoveryTab />;
        }
    };

    return (
        <div className="admin-delivery">
            <AdminSidebar />
            <div className="admin-delivery__content">
                <Header title="Delivery Management" showSearch={false} />
                <div className="admin-delivery__body">
                    <div className="admin-delivery__tabs">
                        {TAB_LABELS.map(({ key, label }) => (
                            <button
                                key={key}
                                className={`admin-delivery__tab${activeTab === key ? " admin-delivery__tab--active" : ""}`}
                                onClick={() => setActiveTab(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {renderTab()}
                </div>
            </div>
        </div>
    );
};

export default AdminDelivery;
