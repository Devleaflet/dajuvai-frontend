import VendorHeader from "../Components/VendorHeader";
import { useState } from "react";
import { VendorAuthService } from "../services/vendorAuthService";

const VendorProfile: React.FC = () => {
  const [isMobile] = useState<boolean>(window.innerWidth < 768);
  const [docketHeight] = useState<number>(80);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password state
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    const res = await VendorAuthService.forgotPassword(forgotEmail);
    setForgotMsg(res.message);
    setForgotLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg(null);
    const res = await VendorAuthService.resetPassword(newPass, confirmPass, resetToken);
    setResetMsg(res.message);
    setResetLoading(false);
  };

  return (
    <div className={`dashboard ${isMobile ? "dashboard--mobile" : ""}`}>
      <VendorHeader title="Profile Management" showSearch={false} />
      <main className="dashboard__main" style={{ paddingBottom: isMobile ? `${docketHeight + 24}px` : "24px" }}>
        <section style={{ maxWidth: 400, margin: "2rem auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
          <h2>Forgot Password</h2>
          <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <button type="submit" disabled={forgotLoading} style={{ padding: 8, borderRadius: 4, background: "#007bff", color: "#fff", border: "none" }}>
              {forgotLoading ? "Sending..." : "Send Reset Email"}
            </button>
            {forgotMsg && <div style={{ color: forgotMsg.toLowerCase().includes("success") ? "green" : "red" }}>{forgotMsg}</div>}
          </form>
        </section>
        <section style={{ maxWidth: 400, margin: "2rem auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}>
          <h2>Reset Password</h2>
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder="Reset token"
              value={resetToken}
              onChange={e => setResetToken(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <button type="submit" disabled={resetLoading} style={{ padding: 8, borderRadius: 4, background: "#28a745", color: "#fff", border: "none" }}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            {resetMsg && <div style={{ color: resetMsg.toLowerCase().includes("success") ? "green" : "red" }}>{resetMsg}</div>}
          </form>
        </section>
      </main>
    </div>
  );
};

export default VendorProfile; 