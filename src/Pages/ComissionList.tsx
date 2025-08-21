import React from "react";
import { Toaster } from "react-hot-toast";

const CommissionList: React.FC = () => {
    const handleGoBack = () => {
        window.close(); 
    };

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#f4f4f4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontFamily: "Arial, sans-serif"
        }}>
            <Toaster position="top-center" />
            <div style={{
                width: "100%",
                maxWidth: "800px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                textAlign: "center"
            }}>
                <h1 style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    marginBottom: "16px"
                }}>
                    Commission List
                </h1>
                <div style={{
                    width: "100%",
                    height: "600px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    overflow: "hidden"
                }}>
                    <iframe
                        src="https://res.cloudinary.com/dxvyc12au/raw/upload/v1755774646/CommisionList/uzhk4v26kdc2sim44ihl"
                        width="100%"
                        height="100%"
                        title="Commission List"
                        style={{ border: "none" }}
                    ></iframe>
                </div>
                <div style={{
                    marginTop: "24px",
                    display: "flex",
                    justifyContent: "center"
                }}>
                    <button
                        onClick={handleGoBack}
                        style={{
                            padding: "10px 24px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                    >
                        Go Back to Form
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommissionList;