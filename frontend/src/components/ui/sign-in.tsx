"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trophy, Eye, EyeOff, Check } from "lucide-react";

export type AuthMode = "login" | "signup";
export type SignupStep = "phone" | "otp" | "mpin" | "done";

export type SignInCardProps = {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  phone: string;
  setPhone: (v: string) => void;
  mpin: string;
  setMpin: (v: string) => void;
  signupPhone: string;
  setSignupPhone: (v: string) => void;
  signupOtp: string;
  setSignupOtp: (v: string) => void;
  signupMpin: string;
  setSignupMpin: (v: string) => void;
  signupStep: SignupStep;
  signupMessage: string | null;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp?: () => void;
};

export function SignInCard({
  mode,
  onSwitchMode,
  phone,
  setPhone,
  mpin,
  setMpin,
  signupPhone,
  setSignupPhone,
  signupOtp,
  setSignupOtp,
  signupMpin,
  setSignupMpin,
  signupStep,
  signupMessage,
  error,
  onSubmit,
  onResendOtp,
}: SignInCardProps) {
  const [showMpin, setShowMpin] = useState(false);
  const mpinInputRef = useRef<HTMLInputElement>(null);
  const isSignupSuccess = mode === "signup" && signupStep === "done";

  useEffect(() => {
    if (signupStep === "mpin") {
      const t = setTimeout(() => mpinInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [signupStep]);

  return (
    <div className="sign-in-screen min-h-screen flex items-center justify-center p-4">
      <div className="sign-in-card w-full max-w-md min-w-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        <div className="sign-in">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
              <Trophy size={48} strokeWidth={1.5} className="text-blue-600" />
            </div>
            <div className="p-0">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                DHSA Sports
              </h2>
              <p className="text-center text-gray-500 mt-2">Secure login</p>
            </div>
          </div>

          {isSignupSuccess ? (
            <>
              <div className="space-y-1 mb-4">
                <h3 className="sign-in__success-title">Account created</h3>
              </div>
              <div className="sign-in__success-block" role="status">
                <span className="sign-in__success-icon">
                  <Check size={32} strokeWidth={2.5} aria-hidden />
                </span>
                <p className="sign-in__success-message">
                  Account created successfully. Log in using your phone number and MPIN.
                </p>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  className="sign-in__btn-primary"
                  onClick={() => onSwitchMode("login")}
                >
                  Go to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {mode === "login" ? "Sign in" : "Create account"}
                </h3>
                <p className="text-sm text-gray-500">
                  {mode === "login"
                    ? "Use your phone and MPIN to login (admin, coach, referee, or player)."
                    : "Register as a new user with phone, OTP, and MPIN."}
                </p>
              </div>

              {/* Login / Sign up tabs */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === "login"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => onSwitchMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === "signup"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => onSwitchMode("signup")}
                >
                  Sign up
                </button>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                {mode === "login" ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        className="bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:border-blue-500 w-full px-3 py-2 text-sm"
                        placeholder="Enter 10-digit phone number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        MPIN
                      </label>
                      <div className="relative">
                        <input
                          type={showMpin ? "text" : "password"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="bg-gray-50 border border-gray-200 text-gray-900 pr-12 h-12 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:border-blue-500 w-full px-3 py-2 text-sm"
                          placeholder="Enter your MPIN"
                          value={mpin}
                          onChange={(e) => setMpin(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 inline-flex items-center justify-center h-9 px-2"
                          onClick={() => setShowMpin(!showMpin)}
                          aria-label={showMpin ? "Hide MPIN" : "Show MPIN"}
                        >
                          {showMpin ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        MPIN is 4-6 digits and case sensitive.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="sign-in__btn-primary"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <div
                        className={
                          signupStep === "mpin"
                            ? "sign-in__phone-wrapper sign-in__phone--verified"
                            : "sign-in__phone-wrapper"
                        }
                      >
                        <input
                          className="bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 rounded-[10px] focus-visible:ring-2 focus-visible:ring-blue-500/50 w-full px-3 py-2 text-sm disabled:opacity-60"
                          placeholder="Enter 10-digit phone number"
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          autoComplete="tel"
                          readOnly={signupStep === "mpin"}
                          disabled={signupStep !== "phone" && signupStep !== "mpin"}
                          aria-readonly={signupStep === "mpin"}
                        />
                        {signupStep === "mpin" && (
                          <span className="sign-in__phone-check" aria-hidden>
                            <Check size={20} />
                          </span>
                        )}
                      </div>
                      {signupStep === "mpin" && (
                        <p className="sign-in__helper--success">OTP verified</p>
                      )}
                    </div>
                    {signupStep === "otp" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            OTP Code
                          </label>
                          <input
                            className="bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/50 w-full px-3 py-2 text-sm"
                            placeholder="Enter OTP code"
                            type="text"
                            inputMode="numeric"
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value)}
                          />
                        </div>
                        <div className="sign-in__form-row flex gap-3">
                          <button
                            type="submit"
                            className="flex-1 sign-in__btn-primary min-w-0"
                          >
                            Verify OTP
                          </button>
                          {onResendOtp && (
                            <button
                              type="button"
                              className="px-4 h-12 text-sm font-medium text-blue-600 hover:underline"
                              onClick={onResendOtp}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      </>
                    )}
                    {signupStep === "mpin" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            MPIN
                          </label>
                          <div className="sign-in__mpin-wrapper--active relative">
                            <input
                              ref={mpinInputRef}
                              type={showMpin ? "text" : "password"}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="bg-gray-50 border border-gray-200 text-gray-900 h-12 rounded-[10px] w-full px-3 py-2 text-sm pr-12"
                              placeholder="Enter your MPIN (4-6 digits)"
                              value={signupMpin}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setSignupMpin(v);
                              }}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--color-primary-blue)] inline-flex items-center justify-center h-9 px-2"
                              onClick={() => setShowMpin(!showMpin)}
                              aria-label={showMpin ? "Hide MPIN" : "Show MPIN"}
                            >
                              {showMpin ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            MPIN must be 4-6 digits.
                          </p>
                        </div>
                        <button
                          type="submit"
                          className="sign-in__btn-primary"
                        >
                          Set MPIN
                        </button>
                      </>
                    )}
                    {signupStep === "phone" && (
                      <button
                        type="submit"
                        className="sign-in__btn-primary"
                      >
                        Send OTP
                      </button>
                    )}
                  </>
                )}
              </form>
            </>
          )}

          {signupMessage && mode === "signup" && signupStep !== "mpin" && !isSignupSuccess && (
            <p className="mt-4 text-sm text-blue-600 text-center">
              {signupMessage}
            </p>
          )}

          {error && (
            <div className="sign-in__error mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
