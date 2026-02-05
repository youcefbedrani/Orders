'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Get email from URL
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            setError('No email provided. Please login first.');
        }
    }, [searchParams]);

    // Handle countdown
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    // ... handleCodeChange, handleKeyDown, handlePaste kept specific to this file ... 
    // (I need to include them or carefully partial replace. The previous view showed them. 
    // Use partial replace for the top part of the component to update state, and then another one for functions if needed.
    // Actually, it's safer to specific logic blocks.)

    // I will replace the State definition block first.
    // And then the handlers.

    // Let's do the handlers first since they are largely compatible but I need to rename them or map them.
    // In JSX I used `handleVerify` and `handleResend`. I should rename `submitVerification` to `handleVerify` 
    // and `handleResendCode` to `handleResend` to match JSX, OR update JSX. 
    // Updating function names in logic is cleaner.

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (!/^\d{6}$/.test(pastedData)) return;
        const newCode = pastedData.split('');
        setCode(newCode);
        handleVerify(pastedData);
    };

    const handleVerify = async (paramCode?: string) => {
        const fullCode = paramCode || code.join('');
        if (fullCode.length !== 6) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: fullCode })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Email verified successfully! Redirecting...');

                // Update local storage to reflect verification and store full user data
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    // Fallback for safety
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        parsedUser.emailVerified = true;
                        localStorage.setItem('user', JSON.stringify(parsedUser));
                    }
                }

                setTimeout(() => router.push('/dashboard'), 2000);
            } else {
                setError(data.error + (data.attemptsLeft ? ` (${data.attemptsLeft} attempts left)` : ''));
            }
        } catch (error) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendDisabled || resendLoading) return;

        setResendLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/auth/resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('New verification code sent! Check your email.');
                setCode(['', '', '', '', '', '']);
                setResendDisabled(true);
                setCountdown(60); // 60s cooldown
            } else {
                setError(data.error || 'Failed to resend code');
            }
        } catch (error) {
            setError('Failed to resend code');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex flex-col justify-center items-center py-8 px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 border border-slate-100">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 transform rotate-3">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                        Verify Email
                    </h1>
                    <p className="text-sm text-slate-500 font-medium px-2">
                        Sent to <span className="font-bold text-indigo-600">{email}</span>
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Code Input */}
                    <div className="flex justify-center gap-1.5 sm:gap-3" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`code-${index}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-9 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 focus:outline-none transition-all text-slate-800"
                            />
                        ))}
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center font-medium border border-green-100">
                            {success}
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify()}
                        disabled={loading || code.join('').length !== 6}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-lg transition duration-200 shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            'Verify Email'
                        )}
                    </button>

                    {/* Resend Code */}
                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resendDisabled || resendLoading}
                            className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline py-1 px-3 rounded transition disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        >
                            {resendLoading ? 'Sending...' : resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-slate-400">
                © 2026 PixWarm. All rights reserved.
            </p>
        </div>

    );
}

// Wrap in Suspense as required by Next.js for useSearchParams
export default function VerifyEmail() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
