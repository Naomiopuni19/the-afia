import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, CreditCard, Phone, ArrowRight, Eye, EyeOff, Check, X, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../supabaseClient";

const animations = `
  @keyframes kenBurns {
    0%   { transform: scale(1.0)  translate(0, 0); }
    50%  { transform: scale(1.08) translate(-1%, -1%); }
    100% { transform: scale(1.0)  translate(0, 0); }
  }
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
  @keyframes strengthFill {
    from { width: 0%; }
  }
`;

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", ghanaCard: "", password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  // ── Validators ──────────────────────────────────────────────────
  const validators = {
    fullName: (v) => {
      if (!v.trim()) return "Full name is required";
      if (v.trim().length < 2) return "Name is too short";
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return "Name can only contain letters, spaces, hyphens, and apostrophes";
      return "";
    },
    email: (v) => {
      if (!v) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email (e.g. you@example.com)";
      return "";
    },
    phone: (v) => {
      if (!v) return "Phone is required";
      const cleaned = v.replace(/\s/g, "");
      if (!/^(\+233\d{9}|0\d{9})$/.test(cleaned)) {
        return "Enter a valid Ghana number (e.g. 0241234567 or +233241234567)";
      }
      return "";
    },
    ghanaCard: (v) => {
      if (!v) return "Ghana Card number is required";
      if (!/^GHA-\d{9}-\d$/i.test(v)) return "Format: GHA-123456789-0";
      return "";
    },
    password: (v) => {
      if (!v) return "Password is required";
      if (v.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Za-z]/.test(v)) return "Password must contain a letter";
      if (!/\d/.test(v)) return "Password must contain a number";
      return "";
    },
  };

  const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors(p => ({ ...p, [field]: validators[field](value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setFocusedField("");
    setErrors(p => ({ ...p, [field]: validators[field](form[field]) }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = {};
    Object.keys(validators).forEach(f => { newErrors[f] = validators[f](form[f]); });
    setErrors(newErrors);
    setTouched(Object.keys(validators).reduce((a, f) => ({ ...a, [f]: true }), {}));
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone.replace(/\s/g, ""),
          ghana_card: form.ghanaCard.toUpperCase(),
          role: "guest",
        },
      },
    });
    setLoading(false);

    if (error) {
      setServerError(error.message);
      return;
    }
    navigate("/book");
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const isValid = (field) => touched[field] && !errors[field] && form[field];
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

  const strength = passwordStrength(form.password);
  const strengthLabels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#475569", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  const styles = {
    container: {
      height: "100vh", width: "100%", minHeight: "100vh",
      display: "flex", justifyContent: "center", alignItems: "center",
      position: "relative",
      fontFamily: "'Inter', sans-serif",
      background: "#020617",
      overflow: "hidden",
      padding: "20px",
    },
    bgImage: {
      position: "absolute", inset: 0,
      backgroundImage: 'url("https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      opacity: 0.35,
      animation: "kenBurns 30s ease-in-out infinite",
      zIndex: 1,
    },
    overlay: {
      position: "absolute", inset: 0,
      background: "linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.55) 50%, rgba(2,6,23,0.85) 100%)",
      zIndex: 2,
    },
    aurora: {
      position: "absolute", top: "-15%", right: "-10%",
      width: "500px", height: "500px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)",
      filter: "blur(50px)",
      animation: "auroraShift 20s ease-in-out infinite",
      zIndex: 2,
      pointerEvents: "none",
    },
    card: {
      position: "relative",
      zIndex: 10,
      width: "100%",
      maxWidth: "440px",
      padding: "44px 38px",
      background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.65))",
      backdropFilter: "blur(28px)",
      borderRadius: "28px",
      border: "1px solid rgba(59,130,246,0.18)",
      boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
      textAlign: "center",
      animation: "cardEntrance 0.6s cubic-bezier(0.19,1,0.22,1)",
      overflow: "hidden",
      maxHeight: "94vh",
      overflowY: "auto",
    },
    shimmerStrip: {
      position: "absolute", top: 0, left: 0, right: 0, height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
      animation: "shimmerLine 4s ease-in-out infinite",
    },
    title: {
      color: "white", fontSize: "30px", fontWeight: 900,
      marginBottom: "6px", letterSpacing: "-1px",
      background: "linear-gradient(to bottom, #ffffff, #94a3b8)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subtitle: {
      color: "#3b82f6", fontSize: "10px", fontWeight: 800,
      letterSpacing: "3.5px", textTransform: "uppercase",
      marginBottom: "28px", display: "block",
    },
    badge: {
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "rgba(16,185,129,0.08)",
      border: "1px solid rgba(16,185,129,0.25)",
      color: "#10b981", fontSize: "10px", fontWeight: 700,
      padding: "5px 11px", borderRadius: "50px",
      letterSpacing: "1px", marginBottom: "22px",
    },
    inputGroup: { textAlign: "left", marginBottom: "4px" },
    label: {
      fontSize: "10px", color: "#64748b", fontWeight: 700,
      letterSpacing: "1.5px", textTransform: "uppercase",
      marginBottom: "6px", display: "block", marginLeft: "4px",
    },
    inputWrap: { position: "relative" },
    input: (field, hasRightIcon) => ({
      width: "100%",
      padding: hasRightIcon ? "13px 44px 13px 44px" : "13px 14px 13px 44px",
      borderRadius: "13px",
      border: inputBorder(field),
      background: "rgba(2,6,23,0.7)",
      color: "white",
      fontSize: "13.5px",
      outline: "none",
      transition: "all 0.25s ease",
      boxSizing: "border-box",
      boxShadow: inputGlow(field),
      fontFamily: "inherit",
    }),
    leftIcon: (field) => ({
      position: "absolute", left: "14px", top: "50%",
      transform: "translateY(-50%)",
      color: focusedField === field ? "#3b82f6" : "#475569",
      transition: "color 0.2s",
      pointerEvents: "none",
    }),
    rightIcon: (color) => ({
      position: "absolute", right: "14px", top: "50%",
      transform: "translateY(-50%)",
      color, animation: "iconPop 0.25s cubic-bezier(0.19,1,0.22,1)",
    }),
    eyeBtn: {
      position: "absolute", right: "12px", top: "50%",
      transform: "translateY(-50%)",
      background: "transparent", border: "none",
      color: "#64748b", cursor: "pointer", padding: "4px",
      display: "flex", alignItems: "center",
    },
    fieldError: {
      color: "#fb7185", fontSize: "11px",
      marginTop: "5px", marginLeft: "5px", marginBottom: "10px",
      display: "flex", alignItems: "center", gap: "5px",
      animation: "iconPop 0.25s ease",
      minHeight: "14px",
    },
    strengthWrap: { marginTop: "8px", marginBottom: "12px", marginLeft: "4px" },
    strengthBar: {
      height: "4px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "2px",
      overflow: "hidden",
      marginBottom: "5px",
    },
    strengthFill: {
      height: "100%", borderRadius: "2px",
      width: `${(strength / 5) * 100}%`,
      background: strengthColors[strength],
      transition: "width 0.3s ease, background 0.3s ease",
      animation: "strengthFill 0.3s ease",
    },
    strengthLabel: {
      fontSize: "10px",
      color: strengthColors[strength],
      fontWeight: 700,
      letterSpacing: "0.5px",
    },
    button: {
      width: "100%",
      padding: "15px",
      borderRadius: "14px",
      border: "none",
      background: loading
        ? "rgba(30,41,59,0.9)"
        : "linear-gradient(135deg, #3b82f6, #2563eb)",
      color: "white",
      fontWeight: 700,
      fontSize: "14px",
      letterSpacing: "0.5px",
      cursor: loading ? "wait" : "pointer",
      transition: "all 0.3s ease",
      animation: !loading ? "glow 3s ease-in-out infinite" : "none",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      marginTop: "18px",
    },
    serverErr: {
      display: "flex", alignItems: "center", gap: "10px",
      color: "#fb7185", background: "rgba(251,113,133,0.08)",
      padding: "12px 14px", borderRadius: "12px", fontSize: "12px",
      marginBottom: "18px", border: "1px solid rgba(251,113,133,0.2)",
      animation: "toastSlide 0.3s ease",
      textAlign: "left",
    },
    bottomLink: {
      color: "#64748b", fontSize: "11px",
      marginTop: "20px", letterSpacing: "1px",
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
      <div style={styles.bgImage} />
      <div style={styles.overlay} />
      <div style={styles.aurora} />

      <form onSubmit={handleRegister} style={styles.card}>
        <div style={styles.shimmerStrip} />

        <h2 style={styles.title}>Join StayPilot</h2>
        <span style={styles.subtitle}>Premium Reservation Access</span>

        <div style={styles.badge}>
          <ShieldCheck size={11} /> SECURE END-TO-END ENCRYPTED
        </div>

        {serverError && (
          <div style={styles.serverErr}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Full name */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Full Name</label>
          <div style={styles.inputWrap}>
            <User size={16} style={styles.leftIcon("fullName")} />
            <input
              type="text" placeholder="Kwame Asante"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => handleBlur("fullName")}
              style={styles.input("fullName", true)}
              autoComplete="name"
            />
            {isValid("fullName")   && <Check size={15} style={styles.rightIcon("#10b981")} />}
            {isInvalid("fullName") && <X     size={15} style={styles.rightIcon("#fb7185")} />}
          </div>
          <div style={styles.fieldError}>
            {isInvalid("fullName") && <><AlertCircle size={11}/> {errors.fullName}</>}
          </div>
        </div>

        {/* Email */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <div style={styles.inputWrap}>
            <Mail size={16} style={styles.leftIcon("email")} />
            <input
              type="email" placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => handleBlur("email")}
              style={styles.input("email", true)}
              autoComplete="email"
            />
            {isValid("email")   && <Check size={15} style={styles.rightIcon("#10b981")} />}
            {isInvalid("email") && <X     size={15} style={styles.rightIcon("#fb7185")} />}
          </div>
          <div style={styles.fieldError}>
            {isInvalid("email") && <><AlertCircle size={11}/> {errors.email}</>}
          </div>
        </div>

        {/* Phone */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone (Ghana)</label>
          <div style={styles.inputWrap}>
            <Phone size={16} style={styles.leftIcon("phone")} />
            <input
              type="tel" placeholder="0241234567"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => handleBlur("phone")}
              style={styles.input("phone", true)}
              autoComplete="tel"
            />
            {isValid("phone")   && <Check size={15} style={styles.rightIcon("#10b981")} />}
            {isInvalid("phone") && <X     size={15} style={styles.rightIcon("#fb7185")} />}
          </div>
          <div style={styles.fieldError}>
            {isInvalid("phone") && <><AlertCircle size={11}/> {errors.phone}</>}
          </div>
        </div>

        {/* Ghana Card */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Ghana Card Number</label>
          <div style={styles.inputWrap}>
            <CreditCard size={16} style={styles.leftIcon("ghanaCard")} />
            <input
              type="text" placeholder="GHA-123456789-0"
              value={form.ghanaCard}
              onChange={(e) => handleChange("ghanaCard", e.target.value.toUpperCase())}
              onFocus={() => setFocusedField("ghanaCard")}
              onBlur={() => handleBlur("ghanaCard")}
              style={styles.input("ghanaCard", true)}
            />
            {isValid("ghanaCard")   && <Check size={15} style={styles.rightIcon("#10b981")} />}
            {isInvalid("ghanaCard") && <X     size={15} style={styles.rightIcon("#fb7185")} />}
          </div>
          <div style={styles.fieldError}>
            {isInvalid("ghanaCard") && <><AlertCircle size={11}/> {errors.ghanaCard}</>}
          </div>
        </div>

        {/* Password */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.leftIcon("password")} />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => handleBlur("password")}
              style={styles.input("password", true)}
              autoComplete="new-password"
            />
            <button type="button" style={styles.eyeBtn}
              onClick={() => setShowPwd(s => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}>
              {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {form.password && (
            <div style={styles.strengthWrap}>
              <div style={styles.strengthBar}>
                <div style={styles.strengthFill} />
              </div>
              <span style={styles.strengthLabel}>{strengthLabels[strength]}</span>
            </div>
          )}
          <div style={styles.fieldError}>
            {isInvalid("password") && <><AlertCircle size={11}/> {errors.password}</>}
          </div>
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
            <>CREATE ACCOUNT <ArrowRight size={16} /></>
          )}
        </button>

        <p style={styles.bottomLink}>
          ALREADY A MEMBER?{" "}
          <Link to="/login" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 700 }}>
            SIGN IN
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;