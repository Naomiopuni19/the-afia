import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [checking,  setChecking]  = useState(true);

  // Supabase puts the session tokens in the URL hash when
  // the user clicks the reset link. We need to exchange them.
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const accessToken  = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type         = hashParams.get("type");

    if (type === "recovery" && accessToken) {
      // Set the session from the URL tokens
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setError("This reset link is invalid or has expired. Please request a new one.");
            setValidLink(false);
          } else {
            setValidLink(true);
          }
          setChecking(false);
        });
    } else {
      setError("Invalid reset link. Please request a new password reset.");
      setValidLink(false);
      setChecking(false);
    }
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match. Please try again.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      return;
    }

    setSuccess(true);
    // Auto-redirect after 3 seconds
    setTimeout(() => navigate("/login"), 3000);
  }

  const strengthScore = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)  s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["","Weak","Fair","Good","Strong","Very Strong"][strengthScore] || "";
  const strengthColor = ["","#ef4444","#f59e0b","#3b82f6","#10b981","#10b981"][strengthScore] || "#ef4444";

  return (
    <div style={{
      minHeight:"100vh",
      background:"radial-gradient(circle at center,#0f172a,#020617)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',sans-serif", padding:20, color:"#fff",
      position:"relative", overflow:"hidden",
    }}>
      {/* Aurora glows */}
      <div style={{ position:"absolute", top:"-20%", left:"-10%", width:500, height:500,
        borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.12),transparent 70%)",
        filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:400, height:400,
        borderRadius:"50%", background:"radial-gradient(circle,rgba(96,165,250,0.10),transparent 70%)",
        filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{
        width:"100%", maxWidth:420, position:"relative", zIndex:2,
        background:"linear-gradient(135deg,rgba(15,23,42,0.9),rgba(15,23,42,0.7))",
        backdropFilter:"blur(24px)", border:"1px solid rgba(59,130,246,0.18)",
        borderRadius:28, padding:"44px 38px", textAlign:"center",
        boxShadow:"0 30px 60px -15px rgba(0,0,0,0.6)",
        animation:"cardIn 0.6s cubic-bezier(0.19,1,0.22,1)",
      }}>
        <style>{`
          @keyframes cardIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spin   { to{transform:rotate(360deg)} }
        `}</style>

        {/* Logo */}
        <div style={{ width:54, height:54, borderRadius:16, margin:"0 auto 20px",
          background:"linear-gradient(135deg,#3b82f6,#60a5fa)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
          boxShadow:"0 8px 24px rgba(59,130,246,0.35)" }}>✦</div>

        <div style={{ fontSize:10, color:"#3b82f6", fontWeight:700, letterSpacing:4,
          textTransform:"uppercase", marginBottom:10 }}>The Afia</div>

        {/* Checking link validity */}
        {checking && (
          <div style={{ padding:"40px 0" }}>
            <div style={{ width:32, height:32, border:"3px solid rgba(59,130,246,0.2)",
              borderTop:"3px solid #3b82f6", borderRadius:"50%", margin:"0 auto 16px",
              animation:"spin 1s linear infinite" }} />
            <p style={{ color:"#94a3b8", fontSize:13 }}>Verifying your reset link...</p>
          </div>
        )}

        {/* Invalid link */}
        {!checking && !validLink && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:300, margin:"0 0 10px" }}>
              Link expired
            </h2>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 24px" }}>
              {error || "This reset link has expired or already been used."}
            </p>
            <a href="/forgot" style={{
              display:"block", padding:16, borderRadius:14,
              background:"linear-gradient(135deg,#3b82f6,#2563eb)",
              color:"#fff", fontSize:13, fontWeight:700, letterSpacing:1.5,
              textTransform:"uppercase", textDecoration:"none",
            }}>
              Request New Link
            </a>
          </>
        )}

        {/* Success */}
        {!checking && success && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:300, margin:"0 0 10px" }}>
              Password updated!
            </h2>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 20px" }}>
              Your password has been reset successfully. Redirecting you to sign in...
            </p>
            <div style={{ padding:"12px 16px", borderRadius:12,
              background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)",
              color:"#10b981", fontSize:12 }}>
              ✓ Redirecting to sign in in 3 seconds...
            </div>
          </>
        )}

        {/* Reset form */}
        {!checking && validLink && !success && (
          <>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:300, margin:"0 0 10px" }}>
              Set new password
            </h2>
            <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 28px" }}>
              Choose a strong password for your account at The Afia.
            </p>

            {error && (
              <div style={{ padding:"12px 14px", borderRadius:12, marginBottom:20,
                background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
                color:"#f87171", fontSize:12, textAlign:"left" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleReset}>
              {/* New password */}
              <div style={{ textAlign:"left", marginBottom:16 }}>
                <label style={{ fontSize:10, color:"#64748b", fontWeight:700,
                  letterSpacing:1.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  New Password
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{
                      width:"100%", padding:"14px 44px 14px 16px", borderRadius:14,
                      boxSizing:"border-box",
                      background:"rgba(2,6,23,0.7)",
                      border:`1px solid ${password ? (strengthScore >= 3 ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)") : "rgba(59,130,246,0.25)"}`,
                      color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none",
                    }}
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:16 }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:2, transition:"all 0.3s",
                        width:`${(strengthScore/5)*100}%`, background:strengthColor,
                      }} />
                    </div>
                    <div style={{ fontSize:10, color:strengthColor, marginTop:4, fontWeight:700 }}>
                      {strengthLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ textAlign:"left", marginBottom:24 }}>
                <label style={{ fontSize:10, color:"#64748b", fontWeight:700,
                  letterSpacing:1.5, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  Confirm Password
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  style={{
                    width:"100%", padding:"14px 16px", borderRadius:14, boxSizing:"border-box",
                    background:"rgba(2,6,23,0.7)",
                    border:`1px solid ${confirm ? (confirm === password ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)") : "rgba(59,130,246,0.25)"}`,
                    color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none",
                  }}
                />
                {confirm && confirm !== password && (
                  <div style={{ fontSize:11, color:"#f87171", marginTop:6 }}>
                    Passwords don't match
                  </div>
                )}
                {confirm && confirm === password && (
                  <div style={{ fontSize:11, color:"#10b981", marginTop:6 }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading || password !== confirm || password.length < 8}
                style={{
                  width:"100%", padding:16, borderRadius:14, border:"none",
                  background: (password === confirm && password.length >= 8)
                    ? "linear-gradient(135deg,#3b82f6,#2563eb)"
                    : "rgba(30,41,59,0.9)",
                  color:"#fff", fontSize:13, fontWeight:700, letterSpacing:1.5,
                  textTransform:"uppercase", cursor:(loading || password !== confirm || password.length < 8) ? "not-allowed" : "pointer",
                  fontFamily:"inherit", opacity:loading ? 0.7 : 1,
                  transition:"all 0.3s",
                }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop:24, fontSize:12, color:"#475569" }}>
          <a href="/login" style={{ color:"#3b82f6", fontWeight:700, textDecoration:"none" }}>
            ← Back to Sign In
          </a>
        </div>

        <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.05)",
          fontSize:9, color:"#475569", letterSpacing:3, textTransform:"uppercase" }}>
          The Afia · Encrypted End-to-End
        </div>
      </div>
    </div>
  );
}