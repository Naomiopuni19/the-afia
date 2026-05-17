import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Check, X, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../supabaseClient";

const animations = `
  @keyframes auroraShift {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33%      { transform: translate(30px, -20px) rotate(120deg); }
    66%      { transform: translate(-20px, 20px) rotate(240deg); }
  }
  @keyframes cardEntrance {
    from { opacity: 0; transform: translateY(30px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmerLine {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes toastSlide {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes loadingDot {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40%           { opacity: 1;   transform: scale(1.1); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 10px 40px rgba(245,158,11,0.25); }
    50%      { box-shadow: 0 10px 50px rgba(245,158,11,0.45); }
  }
  @keyframes iconPop {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

const StaffLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email";
    return "";
  };
  const validatePassword = (val) => {
    if (!val) return "Password is required";
    if (val.length < 6) return "At least 6 characters";
    return "";
  };

  const handleChange = (field, value) => {
    if (field === "email") {
      setEmail(value);
      if (touched.email) setErrors(p => ({ ...p, email: validateEmail(value) }));
    } else {
      setPassword(value);
      if (touched.password) setErrors(p => ({ ...p, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setFocusedField("");
    if (field === "email") setErrors(p => ({ ...p, email: validateEmail(email) }));
    if (field === "password") setErrors(p => ({ ...p, password: validatePassword(password) }));
  };

  const handleKey = (e) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);
    setErrors({ email: emailErr, password: pwdErr });
    setTouched({ email: true, password: true });
    if (emailErr || pwdErr) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setServerError(error.message === "Invalid login credentials"
        ? "Access denied — invalid credentials"
        : error.message);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role === "admin") {
      navigate("/dashboard");
    } else if (role === "staff") {
      navigate("/dashboard");
    } else {
      // Not authorized for staff portal — sign them back out
      await supabase.auth.signOut();
      setServerError("This account is not authorized for the Staff Portal. Guests should use the main login page.");
    }
  };

  const isValid = (field) => touched[field] && !errors[field] && (field === "email" ? email : password);
  const isInvalid = (field) => touched[field] && errors[field];

  const inputBorder = (field) => {
    if (focusedField === field) return "1px solid rgba(245,158,11,0.6)";
    if (isInvalid(field))       return "1px solid rgba(251,113,133,0.55)";
    if (isValid(field))         return "1px solid rgba(16,185,129,0.45)";
    return "1px solid rgba(255,255,255,0.08)";
  };
  const inputGlow = (field) => {
    if (focusedField === field) return "0 0 0 4px rgba(245,158,11,0.10), inset 0 1px 0 rgba(255,255,255,0.04)";
    return "inset 0 1px 0 rgba(255,255,255,0.04)";
  };

  const styles = {
    container: {
      background: "radial-gradient(circle at center, #1a1407, #020617)",
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", color: "white",
      position: "relative", overflow: "hidden", padding: "20px",
    },
    aurora1: {
      position: "absolute", top: "-20%", left: "-10%",
      width: "600px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)",
      filter: "blur(40px)",
      animation: "auroraShift 18s ease-in-out infinite",
      pointerEvents: "none",
    },
    aurora2: {
      position: "absolute", bottom: "-20%", right: "-10%",
      width: "500px", height: "500px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(251,191,36,0.08), transparent 70%)",
      filter: "blur(50px)",
      animation: "auroraShift 22s ease-in-out infinite reverse",
      pointerEvents: "none",
    },
    card: {
      background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.65))",
      backdropFilter: "blur(24px)",
      padding: "48px 40px",
      borderRadius: "28px",
      border: "1px solid rgba(245,158,11,0.22)",
      width: "100%", maxWidth: "420px",
      boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      textAlign: "center", position: "relative", zIndex: 2,
      animation: "cardEntrance 0.6s cubic-bezier(0.19,1,0.22,1)",
      overflow: "hidden",
    },
    shimmerStrip: {
      position: "absolute", top: 0, left: 0, right: 0, height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)",
      animation: "shimmerLine 4s ease-in-out infinite",
    },
    badge: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "rgba(245,158,11,0.10)",
      border: "1px solid rgba(245,158,11,0.3)",
      color: "#f59e0b", fontSize: "10px", fontWeight: 800,
      padding: "6px 14px", borderRadius: "50px",
      letterSpacing: "2px", marginBottom: "20px",
    },
    title: {
      fontSize: "32px", fontWeight: 900, letterSpacing: "-1.5px",
      margin: "0 0 6px 0",
      background: "linear-gradient(to bottom, #ffffff, #fbbf24)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subtitle: {
      color: "#f59e0b", fontSize: "10px", fontWeight: 800,
      letterSpacing: "4px", textTransform: "uppercase",
      marginBottom: "32px", display: "block",
    },
    inputGroup: { textAlign: "left", marginBottom: "8px" },
    label: {
      fontSize: "10px", color: "#64748b", fontWeight: 700,
      letterSpacing: "1.5px", textTransform: "uppercase",
      marginBottom: "8px", display: "block", marginLeft: "4px",
    },
    inputWrap: { position: "relative" },
    input: (field) => ({
      width: "100%", padding: "15px 44px 15px 46px",
      borderRadius: "14px", border: inputBorder(field),
      background: "rgba(2,6,23,0.7)", color: "white",
      fontSize: "14px", outline: "none",
      transition: "all 0.25s ease", boxSizing: "border-box",
      boxShadow: inputGlow(field), fontFamily: "inherit",
    }),
    leftIcon: {
      position: "absolute", left: "16px", top: "50%",
      transform: "translateY(-50%)",
      color: focusedField ? "#f59e0b" : "#475569",
      transition: "color 0.2s", pointerEvents: "none",
    },
    rightIcon: (color) => ({
      position: "absolute", right: "16px", top: "50%",
      transform: "translateY(-50%)",
      color, animation: "iconPop 0.25s cubic-bezier(0.19,1,0.22,1)",
    }),
    eyeBtn: {
      position: "absolute", right: "14px", top: "50%",
      transform: "translateY(-50%)",
      background: "transparent", border: "none",
      color: "#64748b", cursor: "pointer", padding: "4px",
      display: "flex", alignItems: "center",
    },
    fieldError: {
      color: "#fb7185", fontSize: "11px",
      marginTop: "6px", marginLeft: "5px",
      display: "flex", alignItems: "center", gap: "5px",
      animation: "iconPop 0.25s ease", minHeight: "16px",
    },
    capsWarning: {
      display: "flex", alignItems: "center", gap: "6px",
      fontSize: "10px", color: "#f59e0b",
      marginTop: "6px", marginLeft: "5px",
      animation: "iconPop 0.25s ease",
    },
    button: {
      width: "100%", padding: "16px", borderRadius: "14px",
      border: "none",
      background: loading
        ? "rgba(30,41,59,0.9)"
        : "linear-gradient(135deg, #f59e0b, #d97706)",
      color: "white", fontWeight: 700, fontSize: "14px",
      letterSpacing: "0.5px",
      cursor: loading ? "wait" : "pointer",
      transition: "all 0.3s ease",
      animation: !loading ? "glow 3s ease-in-out infinite" : "none",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      marginTop: "20px",
    },
    serverErr: {
      display: "flex", alignItems: "center", gap: "10px",
      color: "#fb7185", background: "rgba(251,113,133,0.08)",
      padding: "12px 14px", borderRadius: "12px", fontSize: "12px",
      marginBottom: "20px", border: "1px solid rgba(251,113,133,0.2)",
      animation: "toastSlide 0.3s ease", textAlign: "left",
    },
    bottomLink: {
      marginTop: "26px", fontSize: "11px", color: "#64748b",
      letterSpacing: "1px",
    },
    footer: {
      marginTop: "30px", paddingTop: "20px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      fontSize: "9px", color: "#475569",
      letterSpacing: "3px", textTransform: "uppercase",
    },
    loadingDot: (i) => ({
      width: "6px", height: "6px", borderRadius: "50%",
      background: "white",
      animation: `loadingDot 1.4s ease-in-out ${i * 0.16}s infinite`,
    }),
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.aurora1} />
      <div style={styles.aurora2} />

      <form onSubmit={handleLogin} style={styles.card}>
        <div style={styles.shimmerStrip} />

        <div style={styles.badge}>
          <ShieldCheck size={11} /> RESTRICTED ACCESS
        </div>

        <h2 style={styles.title}>STAFF PORTAL</h2>
        <span style={styles.subtitle}>Authorized Personnel Only</span>

        {serverError && (
          <div style={styles.serverErr}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Staff Email</label>
          <div style={styles.inputWrap}>
            <Mail size={17} style={styles.leftIcon} />
            <input
              type="email" placeholder="staff@staypilot.com"
              value={email}
              onChange={(e) => handleChange("email", e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => handleBlur("email")}
              style={styles.input("email")}
              autoComplete="email"
            />
            {isValid("email")   && <Check size={16} style={styles.rightIcon("#10b981")} />}
            {isInvalid("email") && <X     size={16} style={styles.rightIcon("#fb7185")} />}
          </div>
          <div style={styles.fieldError}>
            {touched.email && errors.email && <><AlertCircle size={11}/> {errors.email}</>}
          </div>
        </div>

        <div style={{ ...styles.inputGroup, marginTop: 14 }}>
          <label style={styles.label}>Access Key</label>
          <div style={styles.inputWrap}>
            <Lock size={17} style={styles.leftIcon} />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => handleBlur("password")}
              onKeyDown={handleKey}
              onKeyUp={handleKey}
              style={styles.input("password")}
              autoComplete="current-password"
            />
            <button type="button" style={styles.eyeBtn}
              onClick={() => setShowPwd(s => !s)}>
              {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <div style={styles.fieldError}>
            {touched.password && errors.password && <><AlertCircle size={11}/> {errors.password}</>}
          </div>
          {capsOn && (
            <div style={styles.capsWarning}>
              <AlertCircle size={11}/> Caps Lock is on
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={styles.button}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {loading ? (
            <>
              <span style={styles.loadingDot(0)} />
              <span style={styles.loadingDot(1)} />
              <span style={styles.loadingDot(2)} />
            </>
          ) : (
            <>SECURE LOGIN <ArrowRight size={16}/></>
          )}
        </button>

        <div style={styles.bottomLink}>
          NOT STAFF?{" "}
          <Link to="/login" style={{ color: "#f59e0b", fontWeight: 700, textDecoration: "none" }}>
            GUEST SIGN-IN
          </Link>
        </div>

        <div style={styles.footer}>
          STAYPILOT · OPERATIONS COMMAND
        </div>
      </form>
    </div>
  );
};

export default StaffLogin;