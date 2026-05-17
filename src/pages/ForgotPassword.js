import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [sent,  setSent]      = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://the-afia-lah1m4rmt-naomiopuni19s-projects.vercel.app/reset-password",
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div style={{
      minHeight:"100vh", background:"radial-gradient(circle at center,#0f172a,#020617)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',sans-serif", padding:20, color:"#fff",
    }}>
      <div style={{
        width:"100%", maxWidth:420, background:"linear-gradient(135deg,rgba(15,23,42,0.9),rgba(15,23,42,0.7))",
        backdropFilter:"blur(24px)", border:"1px solid rgba(59,130,246,0.18)",
        borderRadius:28, padding:"44px 38px", textAlign:"center",
        boxShadow:"0 30px 60px -15px rgba(0,0,0,0.6)",
      }}>
        <div style={{
          width:54, height:54, borderRadius:16, margin:"0 auto 20px",
          background:"linear-gradient(135deg,#3b82f6,#60a5fa)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
          boxShadow:"0 8px 24px rgba(59,130,246,0.35)",
        }}>✦</div>

        <div style={{ fontSize:10, color:"#3b82f6", fontWeight:700, letterSpacing:4, textTransform:"uppercase", marginBottom:10 }}>
          The Afia
        </div>

        {!sent ? (
          <>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:300, margin:"0 0 10px" }}>
              Forgot your password?
            </h2>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 28px" }}>
              No problem. Enter your email and we'll send you a reset link right away.
            </p>

            {error && (
              <div style={{ padding:"12px 14px", borderRadius:12, marginBottom:20,
                background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
                color:"#f87171", fontSize:12, textAlign:"left" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ textAlign:"left", marginBottom:20 }}>
                <label style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoFocus
                  style={{
                    width:"100%", padding:"14px 16px", borderRadius:14, boxSizing:"border-box",
                    background:"rgba(2,6,23,0.7)", border:"1px solid rgba(59,130,246,0.25)",
                    color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none",
                  }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{
                  width:"100%", padding:16, borderRadius:14, border:"none",
                  background:"linear-gradient(135deg,#3b82f6,#2563eb)",
                  color:"#fff", fontSize:13, fontWeight:700, letterSpacing:1.5,
                  textTransform:"uppercase", cursor:loading?"wait":"pointer",
                  fontFamily:"inherit", opacity:loading?0.7:1,
                }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:300, margin:"0 0 10px" }}>
              Check your inbox
            </h2>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 28px" }}>
              We've sent a password reset link to <strong style={{ color:"#fff" }}>{email}</strong>.
              Check your inbox — and your spam folder just in case.
            </p>
            <div style={{ padding:"14px 16px", borderRadius:12,
              background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)",
              color:"#10b981", fontSize:12, marginBottom:24 }}>
              ✓ Reset email sent successfully
            </div>
          </>
        )}

        <div style={{ marginTop:24, fontSize:12, color:"#475569" }}>
          Remember it now?{" "}
          <Link to="/login" style={{ color:"#3b82f6", fontWeight:700, textDecoration:"none" }}>
            Back to Sign In
          </Link>
        </div>

        <div style={{ marginTop:28, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.05)",
          fontSize:9, color:"#475569", letterSpacing:3, textTransform:"uppercase" }}>
          The Afia · Encrypted End-to-End
        </div>
      </div>
    </div>
  );
}