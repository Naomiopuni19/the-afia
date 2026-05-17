import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Check, X, ArrowRight, AlertCircle } from "lucide-react";
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
    0%, 100% { box-shadow: 0 10px 40px rgba(59,130,246,0.25); }
    50%      { box-shadow: 0 10px 50px rgba(59,130,246,0.45); }
  }
  @keyframes iconPop {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [stayedIn, setStayedIn]   = useState(true);
  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [capsOn, setCapsOn]       = useState(false);
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
      setServerError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : error.message
      );
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role === "admin" || role === "staff") {
      await supabase.auth.signOut();
      setServerError("This is a guest sign-in. Staff use the Staff Portal — redirecting…");
      setTimeout(() => navigate("/staff-portal"), 1800);
      return;
    }
    navigate("/welcome");
  };

  const isValid = (field) => touched[field] && !errors[field] && (field === "email" ? email : password);
  const isInvalid = (field) => touched[field] && errors[field];

  const inputBorder = (field) => {
    if (focusedField === field) return "1px solid rgba(59,130,246,0.6)";
    if (isInvalid(field))       return "1px solid rgba(251,113,133,0.55)";
    if (isValid(field))         return "1px solid rgba(16,185,129,0.45)";
    return "1px solid rgba(255,255,255,0.08)";
  };
  const inputGlow = (field) => {
    if (focusedField === field) return "0 0 0 4px rgba(59,130,246,0.10), inset 0 1px 0 rgba(255,255,255,0.04)";
    return "inset 0 1px 0 rgba(255,255,255,0.04)";
  };

  const styles = {
    container: {
      background: "radial-gradient(circle at center, #0f172a, #020617)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      color: "white",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    },
    aurora1: {
      position: "absolute", top: "-20%", left: "-10%",
      width: "600px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)",
      filter: "blur(40px)",
      animation: "auroraShift 18s ease-in-out infinite",
      pointerEvents: "none",
    },
    aurora2: {
      position: "absolute", bottom: "-20%", right: "-10%",
      width: "500px", height: "500px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(96,165,250,0.10), transparent 70%)",
      filter: "blur(50px)",
      animation: "auroraShift 22s ease-in-out infinite reverse",
      pointerEvents: "none",
    },
    card: {
      background: "linear-gradient(135deg, rgba(15,23,42,0.75), rgba(15,23,42,0.55))",
      backdropFilter: "blur(24px)",
      padding: "44px 38px",
      borderRadius: "28px",
      border: "1px solid rgba(59,130,246,0.18)",
      width: "100%",
      maxWidth: "420px",
      boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      textAlign: "center",
      position: "relative",
      zIndex: 2,
      animation: "cardEntrance 0.6s cubic-bezier(0.19,1,0.22,1)",
      overflow: "hidden",
    },
    shimmerStrip: {
      position: "absolute", top: 0, left: 0, right: 0, height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
      animation: "shimmerLine 4s ease-in-out infinite",
    },
    logoMark: {
      width: 54, height: 54, margin: "0 auto 18px",
      borderRadius: 16,
      background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, color: "#fff",
      boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
      animation: "floatLogo 4s ease-in-out infinite",
    },
    brandLine: {
      fontSize: "10px", color: "#3b82f6", fontWeight: 700,
      letterSpacing: "4px", textTransform: "uppercase",
      marginBottom: "8px",
    },
    title: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: "34px", fontWeight: 300, letterSpacing: "-1px",
      margin: "0 0 8px 0",
      color: "#fff",
    },
    subtitle: {
      color: "#94a3b8", fontSize: "13px",
      marginBottom: "28px", lineHeight: 1.6,
    },
    inputGroup: { textAlign: "left", marginBottom: "8px" },
    label: {
      fontSize: "10px", color: "#64748b", fontWeight: 700,
      letterSpacing: "1.5px", textTransform: "uppercase",
      marginBottom: "8px", display: "block", marginLeft: "4px",
    },
    inputWrap: { position: "relative" },
    input: (field) => ({
      width: "100%",
      padding: "15px 44px 15px 46px",
      borderRadius: "14px",
      border: inputBorder(field),
      background: "rgba(2,6,23,0.7)",
      color: "white",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.25s ease",
      boxSizing: "border-box",
      boxShadow: inputGlow(field),
      fontFamily: "inherit",
    }),
    leftIcon: {
      position: "absolute", left: "16px", top: "50%",
      transform: "translateY(-50%)",
      color: focusedField ? "#3b82f6" : "#475569",
      transition: "color 0.2s",
      pointerEvents: "none",
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
      animation: "iconPop 0.25s ease",
      minHeight: "16px",
    },
    capsWarning: {
      display: "flex", alignItems: "center", gap: "6px",
      fontSize: "10px", color: "#f59e0b",
      marginTop: "6px", marginLeft: "5px",
      animation: "iconPop 0.25s ease",
    },
    rowBetween: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      margin: "18px 0 22px",
    },
    checkbox: {
      display: "flex", alignItems: "center", gap: "8px",
      cursor: "pointer", fontSize: "12px", color: "#94a3b8",
      userSelect: "none",
    },
    checkboxBox: (checked) => ({
      width: "16px", height: "16px", borderRadius: "5px",
      border: `1.5px solid ${checked ? "#3b82f6" : "#475569"}`,
      background: checked ? "#3b82f6" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
    }),
    forgotLink: {
      fontSize: "11px", color: "#3b82f6", textDecoration: "none",
      fontWeight: 600,
    },
    button: {
      width: "100%",
      padding: "16px",
      borderRadius: "14px",
      border: "none",
      background: loading
        ? "rgba(30,41,59,0.9)"
        : "linear-gradient(135deg, #3b82f6, #2563eb)",
      color: "white",
      fontWeight: 700,
      fontSize: "13px",
      letterSpacing: "1.5px",
      textTransform: "uppercase",
      cursor: loading ? "wait" : "pointer",
      transition: "all 0.3s ease",
      animation: !loading ? "glow 3s ease-in-out infinite" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      fontFamily: "inherit",
    },
    serverErr: {
      display: "flex", alignItems: "center", gap: "10px",
      color: "#fb7185", background: "rgba(251,113,133,0.08)",
      padding: "12px 14px", borderRadius: "12px", fontSize: "12px",
      marginBottom: "20px", border: "1px solid rgba(251,113,133,0.2)",
      animation: "toastSlide 0.3s ease",
      textAlign: "left",
    },
    bottomLink: {
      marginTop: "24px", fontSize: "12px", color: "#64748b",
    },
    staffLink: {
      marginTop: "14px", fontSize: "11px", color: "#475569",
      display: "block",
    },
    footer: {
      marginTop: "30px", paddingTop: "20px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      fontSize: "9px", color: "#475569",
      letterSpacing: "3px", textTransform: "uppercase",
    },
    loadingDot: (i) => ({
      width: "6px", height: "6px", borderRadius: "50%",
      background: "#3b82f6",
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

        <div style={styles.logoMark}>✦</div>
        <div style={styles.brandLine}>The Afia · Guest Sign-In</div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>
          Sign in to access your suite, place orders,<br/>
          and manage your stay.
        </p>

        {serverError && (
          <div style={styles.serverErr}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <div style={styles.inputWrap}>
            <Mail size={17} style={styles.leftIcon} />
            <input
              type="email"
              placeholder="you@example.com"
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
          <label style={styles.label}>Password</label>
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
              onClick={() => setShowPwd(s => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}>
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

        <div style={styles.rowBetween}>
          <label style={styles.checkbox} onClick={() => setStayedIn(s => !s)}>
            <span style={styles.checkboxBox(stayedIn)}>
              {stayedIn && <Check size={11} color="white" strokeWidth={3}/>}
            </span>
            Keep me signed in
          </label>
          <Link to="/forgot" style={styles.forgotLink}>Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
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
            <>Sign In <ArrowRight size={16}/></>
          )}
        </button>

        <div style={styles.bottomLink}>
          New guest?{" "}
          <Link to="/register" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}>
            Create an account
          </Link>
        </div>

        <Link to="/staff-portal" style={styles.staffLink}>
          Hotel staff? <span style={{ color: "#f59e0b", fontWeight: 600 }}>Use the Staff Portal →</span>
        </Link>

        <div style={styles.footer}>
          The Afia · Designed for those who notice
        </div>
      </form>
    </div>
  );
};

export default Login;