import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, register } = useAuth();
  
  // Auth mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');
  // Role type: 'admin' | 'staff'
  const [loginType, setLoginType] = useState('admin');
  // Staff specific role: 'PHARMACIST' | 'BILLING' | 'INVENTORY_MANAGER'
  const [staffRole, setStaffRole] = useState('PHARMACIST');

  // Sign In state
  const [identifier, setIdentifier] = useState('priya.sharma@pharmacare.in');
  const [password, setPassword] = useState('RxShield#2024');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  // Switch between Admin and Staff tabs
  const handleTabChange = (type) => {
    setLoginType(type);
    setError('');
    if (authMode === 'signin') {
      if (type === 'admin') {
        setIdentifier('priya.sharma@pharmacare.in');
        setPassword('RxShield#2024');
      } else {
        setStaffRole('PHARMACIST');
        setIdentifier('arun.kumar@pharmacare.in');
        setPassword('Pharma#2024');
      }
    }
  };

  const handleStaffRoleSelect = (roleCode) => {
    setStaffRole(roleCode);
    setError('');
    if (authMode === 'signin') {
      if (roleCode === 'PHARMACIST') {
        setIdentifier('arun.kumar@pharmacare.in');
        setPassword('Pharma#2024');
      } else if (roleCode === 'BILLING') {
        setIdentifier('cashier.dispense@pharmacare.in');
        setPassword('PosKey#9931');
      } else if (roleCode === 'INVENTORY_MANAGER') {
        setIdentifier('rajesh.verma@pharmacare.in');
        setPassword('Stock#2024');
      }
    }
  };

  // Switch between Sign In and Sign Up modes
  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setError('');
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const targetRole = loginType === 'admin' ? 'ADMIN' : staffRole;

    try {
      if (authMode === 'signin') {
        await login(identifier, password, targetRole);
      } else {
        // Sign Up validation
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        if (!signupEmail.trim()) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        if (signupPassword.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (signupPassword !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        await register({
          name: name.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          roleCode: targetRole,
          licenseNumber: licenseNumber.trim(),
          phone: signupPhone.trim(),
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotPassword(false);
      setForgotEmail('');
    }, 2800);
  };

  const handleGoogleLogin = () => {
    setGoogleNotice(true);
    setTimeout(() => {
      if (loginType === 'admin') {
        login('priya.sharma@pharmacare.in', 'RxShield#2024', 'ADMIN');
      } else {
        login('arun.kumar@pharmacare.in', 'Pharma#2024', staffRole);
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030d1a] text-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Background Lighting & Radial Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[130px]" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[150px]" />
        <div className="absolute -bottom-32 right-1/4 w-[650px] h-[650px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute top-20 right-10 w-[450px] h-[450px] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00d8be] to-[#00f5c4] flex items-center justify-center text-[#041a29] shadow-[0_0_20px_rgba(0,245,196,0.5)]">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1">
              PharmaCare<span className="text-[#00f5c4]">Rx</span>
            </h1>
            <span className="text-[11px] text-[#7b9ab4] tracking-wider uppercase font-medium">
              Smart Pharmacy Management System
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081e36]/80 border border-cyan-500/20 text-xs text-[#8fa8c2]">
          <span className="w-2 h-2 rounded-full bg-[#00f5c4] animate-ping" />
          <span>Secure • Reliable • Efficient</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-14 py-4 sm:py-6 flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* LEFT COLUMN: HERO MARKETING & VISUAL BRANDING */}
        <div className="w-full lg:w-[54%] flex flex-col items-start space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your Trusted Partner <br />
              in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5c4] via-[#38e6ff] to-[#00c8ff]">Better Healthcare</span>
            </h2>
            <p className="text-sm sm:text-base text-[#8ea8be] font-medium tracking-wide">
              Manage Pharmacy • Track Inventory • Serve Better
            </p>
          </div>

          {/* Glowing Hero Medical Device Illustration Card */}
          <div className="relative w-full max-w-xl group">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0a2342]/90 via-[#07192f]/90 to-[#041122]/90 border border-cyan-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_35px_rgba(0,245,196,0.15)] flex items-center justify-center min-h-[290px]">
              
              {/* Background Glow Ring */}
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-80" />

              {/* Glowing Shield & Bottle & Capsule Graphic */}
              <div className="relative flex items-center justify-center gap-6">
                {/* Shield Icon */}
                <div className="relative flex items-center justify-center w-28 h-32 rounded-3xl bg-gradient-to-b from-[#00f5c4]/20 to-transparent border border-cyan-400/40 backdrop-blur-md shadow-[0_0_30px_rgba(0,245,196,0.3)]">
                  <svg
                    className="w-16 h-16 text-[#00f5c4]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="14" />
                    <line x1="9" y1="11" x2="15" y2="11" />
                  </svg>
                </div>

                {/* Medicine Bottle & Pills */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-28 rounded-2xl bg-gradient-to-b from-cyan-400/25 to-[#061b30] border border-cyan-400/50 flex flex-col items-center justify-between p-2 shadow-[0_0_25px_rgba(0,240,255,0.35)]">
                    <div className="w-12 h-3.5 rounded-md bg-cyan-300/60 border border-cyan-200" />
                    <svg className="w-8 h-8 text-[#00f5c4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="7" x2="12" y2="17" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                    </svg>
                    <div className="text-[9px] font-mono text-cyan-200 uppercase tracking-widest font-semibold">FIRST AID</div>
                  </div>
                  {/* Pills Scatter */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-cyan-300 rotate-45 shadow-[0_0_8px_#00f5c4]" />
                    <span className="w-3.5 h-1.5 rounded-full bg-teal-400 -rotate-12 shadow-[0_0_8px_#00f5c4]" />
                    <span className="w-3 h-1.5 rounded-full bg-cyan-200 rotate-12 shadow-[0_0_8px_#00f5c4]" />
                  </div>
                </div>
              </div>

              {/* FLOATING BADGE 1: Inventory Control */}
              <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#09223e]/85 backdrop-blur-xl border border-cyan-400/30 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(0,245,196,0.2)]">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-[#00f5c4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white leading-none">Inventory</span>
                  <span className="text-[10px] text-[#8ea8be] leading-none mt-0.5">Control</span>
                </div>
              </div>

              {/* FLOATING BADGE 2: Smart Analytics */}
              <div className="absolute bottom-4 left-4 sm:left-6 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#09223e]/85 backdrop-blur-xl border border-cyan-400/30 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(0,245,196,0.2)]">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-[#00f5c4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">analytics</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-white leading-none">Smart</span>
                  <span className="text-[10px] text-[#8ea8be] leading-none mt-0.5">Analytics</span>
                </div>
              </div>
            </div>

            {/* Bottom Pulse Banner Pill */}
            <div className="mt-4 w-full flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#081e36]/75 border border-cyan-500/30 backdrop-blur-xl shadow-sm">
              <span className="material-symbols-outlined text-[#00f5c4] text-lg animate-pulse">ecg_heart</span>
              <p className="text-xs font-medium text-white tracking-wide">
                PharmaCareRx <span className="text-cyan-400 mx-1">—</span> Caring for a Healthier Tomorrow
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FROSTED GLASS AUTH CARD (Sign In & Sign Up) */}
        <div className="w-full lg:w-[46%] max-w-[500px]">
          <div className="relative rounded-[28px] bg-[#091d36]/75 border border-cyan-400/30 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_45px_rgba(0,240,255,0.18)]">
            
            {/* Top Mortar & Pestle Icon */}
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,196,0.3)]">
                <span className="material-symbols-outlined text-[#00f5c4] text-3xl">medication_liquid</span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-0.5 mb-5">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {authMode === 'signin' ? 'Welcome Back!' : 'Create an Account'}
              </h3>
              <p className="text-xs text-[#8fa8c2]">
                {authMode === 'signin'
                  ? 'Sign in to continue to your pharmacy dashboard'
                  : 'Register a new administrator or dispensary staff member'}
              </p>
            </div>

            {/* 1. AUTH MODE TABS: [ Sign In ] vs [ Sign Up ] */}
            <div className="p-1 rounded-xl bg-[#05182e]/90 border border-cyan-500/20 grid grid-cols-2 gap-1 mb-3">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-[#00f5c4] to-[#00d8be] text-[#012228] shadow-[0_0_15px_rgba(0,245,196,0.45)] font-bold'
                    : 'text-[#8fa8c2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-[#00f5c4] to-[#00d8be] text-[#012228] shadow-[0_0_15px_rgba(0,245,196,0.45)] font-bold'
                    : 'text-[#8fa8c2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Sign Up</span>
              </button>
            </div>

            {/* 2. ROLE TABS: [ Admin ] vs [ Staff ] */}
            <div className="p-1 rounded-full bg-[#05182e]/60 border border-cyan-500/20 grid grid-cols-2 gap-1 mb-4">
              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginType === 'admin'
                    ? 'bg-[#00f5c4]/20 text-[#00f5c4] border border-cyan-400/40 shadow-xs'
                    : 'text-[#8fa8c2] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">shield_person</span>
                <span>{authMode === 'signin' ? 'Admin Login' : 'Admin Sign Up'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('staff')}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginType === 'staff'
                    ? 'bg-[#00f5c4]/20 text-[#00f5c4] border border-cyan-400/40 shadow-xs'
                    : 'text-[#8fa8c2] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">group</span>
                <span>{authMode === 'signin' ? 'Staff Login' : 'Staff Sign Up'}</span>
              </button>
            </div>

            {/* Staff Sub-Role Selector Pills */}
            {loginType === 'staff' && (
              <div className="flex items-center justify-between gap-1 mb-4 p-1 rounded-xl bg-[#041427]/60 border border-cyan-500/20 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleStaffRoleSelect('PHARMACIST')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                    staffRole === 'PHARMACIST'
                      ? 'bg-cyan-500/20 text-[#00f5c4] font-semibold border border-cyan-400/30'
                      : 'text-[#8fa8c2] hover:text-white'
                  }`}
                >
                  Pharmacist
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffRoleSelect('BILLING')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                    staffRole === 'BILLING'
                      ? 'bg-cyan-500/20 text-[#00f5c4] font-semibold border border-cyan-400/30'
                      : 'text-[#8fa8c2] hover:text-white'
                  }`}
                >
                  Billing / POS
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffRoleSelect('INVENTORY_MANAGER')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                    staffRole === 'INVENTORY_MANAGER'
                      ? 'bg-cyan-500/20 text-[#00f5c4] font-semibold border border-cyan-400/30'
                      : 'text-[#8fa8c2] hover:text-white'
                  }`}
                >
                  Inventory
                </button>
              </div>
            )}

            {/* Error Notification Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {googleNotice && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                <span>Connecting with Google authentication...</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* ==================== SIGN IN FIELDS ==================== */}
              {authMode === 'signin' && (
                <>
                  {/* Email Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#8fa8c2] text-lg">mail</span>
                      <input
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Email Address"
                        className="w-full h-11 pl-11 pr-4 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-sm focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[#8fa8c2] text-lg">lock</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full h-11 pl-11 pr-11 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-sm focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-[#8fa8c2] hover:text-[#00f5c4] transition-colors focus:outline-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[#98b0c7] hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#05172d] border border-cyan-500/30 text-[#00f5c4] accent-[#00f5c4] cursor-pointer"
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[#00f5c4] hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {/* ==================== SIGN UP FIELDS ==================== */}
              {authMode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8fa8c2] text-lg">badge</span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={loginType === 'admin' ? "Full Name (e.g. Dr. Priya Sharma)" : "Staff Full Name"}
                      className="w-full h-10 pl-11 pr-4 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs sm:text-sm focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all"
                    />
                  </div>

                  {/* Work / Official Email */}
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8fa8c2] text-lg">mail</span>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Work Email Address"
                      className="w-full h-10 pl-11 pr-4 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs sm:text-sm focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all"
                    />
                  </div>

                  {/* Phone & License / Staff ID Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#8fa8c2] text-base">call</span>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full h-10 pl-9 pr-3 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all"
                      />
                    </div>

                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#8fa8c2] text-base">verified</span>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder={loginType === 'admin' ? "License / Reg #" : "Staff ID / Reg #"}
                        className="w-full h-10 pl-9 pr-3 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#8fa8c2] text-base">lock</span>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create Password"
                        className="w-full h-10 pl-9 pr-8 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 text-[#8fa8c2] hover:text-[#00f5c4] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">
                          {showSignupPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#8fa8c2] text-base">lock_clock</span>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full h-10 pl-9 pr-3 bg-[#05172d]/80 rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-xs focus:outline-none focus:border-[#00f5c4] focus:ring-2 focus:ring-[#00f5c4]/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#00f5c4] via-[#00e2cb] to-[#00d2e8] hover:brightness-110 active:scale-[0.99] text-[#012228] font-bold text-sm shadow-[0_4px_25px_rgba(0,245,196,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                    <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      {authMode === 'signin' ? 'arrow_forward' : 'how_to_reg'}
                    </span>
                    <span>
                      {authMode === 'signin'
                        ? loginType === 'admin'
                          ? 'Sign In as Administrator'
                          : `Sign In as ${staffRole === 'PHARMACIST' ? 'Pharmacist' : staffRole === 'BILLING' ? 'Billing Staff' : 'Inventory'}`
                        : loginType === 'admin'
                          ? 'Create Admin Account'
                          : `Create ${staffRole === 'PHARMACIST' ? 'Pharmacist' : staffRole === 'BILLING' ? 'Billing Staff' : 'Inventory'} Account`}
                    </span>
                  </>
                )}
              </button>

              {/* Divider & Google Login (only on signin) */}
              {authMode === 'signin' && (
                <>
                  <div className="relative flex items-center justify-center my-2">
                    <div className="w-full border-t border-cyan-500/20" />
                    <span className="absolute px-3 bg-[#091e36] text-[10px] text-[#718b9f] uppercase tracking-wider font-medium">
                      or
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-10 rounded-xl bg-[#07192f]/80 hover:bg-[#0c2442] border border-cyan-500/20 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </form>

            {/* Bottom Card Footer: Toggle between Sign In and Sign Up */}
            <div className="mt-4 text-center text-xs text-[#8fa8c2]">
              {authMode === 'signin' ? (
                <>
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="text-[#00f5c4] hover:text-cyan-300 font-semibold transition-colors ml-0.5 cursor-pointer"
                  >
                    Sign Up now
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="text-[#00f5c4] hover:text-cyan-300 font-semibold transition-colors ml-0.5 cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-3 flex items-center justify-between text-[11px] text-[#637d95] border-t border-cyan-500/10">
        <div>
          <span>Apollo Clinical Dispensary OS • Unit #104</span>
        </div>
        <div>
          <span>NABH & CDSCO Standard Compliant • TLS 1.3 End-to-End Encrypted</span>
        </div>
      </footer>

      {/* MODAL 1: Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#091f3a] border border-cyan-400/30 p-6 shadow-[0_0_50px_rgba(0,245,196,0.25)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f5c4]">lock_reset</span>
                <h4 className="text-lg font-bold text-white">Reset Account Password</h4>
              </div>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-[#8fa8c2] hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-teal-950/60 border border-[#00f5c4]/40 text-teal-200 text-xs text-center space-y-1">
                <span className="material-symbols-outlined text-2xl text-[#00f5c4]">check_circle</span>
                <p className="font-semibold text-sm text-white">Reset Link Dispatched</p>
                <p>A recovery token has been transmitted to your verified address.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#8fa8c2]">
                  Enter your registered corporate email to receive a password reset link.
                </p>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#8fa8c2] text-lg">mail</span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@pharmacare.in"
                    className="w-full h-11 pl-11 pr-4 bg-[#05172d] rounded-xl border border-cyan-500/20 text-white placeholder-[#68819a] text-sm focus:outline-none focus:border-[#00f5c4]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#00f5c4] to-[#00d8be] text-[#012228] font-bold text-sm shadow-[0_0_20px_rgba(0,245,196,0.4)] cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Contact Administrator Modal */}
      {showContactAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#091f3a] border border-cyan-400/30 p-6 shadow-[0_0_50px_rgba(0,245,196,0.25)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f5c4]">support_agent</span>
                <h4 className="text-lg font-bold text-white">Contact Dispensary Admin</h4>
              </div>
              <button
                onClick={() => setShowContactAdmin(false)}
                className="text-[#8fa8c2] hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#8fa8c2]">
              <p>For immediate credential provisioning or role escalation, reach out directly:</p>
              <div className="p-3 rounded-xl bg-[#05172d] border border-cyan-500/20 space-y-2 text-white">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#00f5c4]">person</span>
                  <span>Chief Pharmacist: Dr. Priya Sharma</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#00f5c4]">mail</span>
                  <span className="font-mono text-cyan-300">admin@pharmacare.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#00f5c4]">phone</span>
                  <span className="font-mono">+91 (80) 4920-3300 (Ext. 104)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
