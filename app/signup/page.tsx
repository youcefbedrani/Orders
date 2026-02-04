'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        setLoading(true);

        if (!termsAccepted) {
            alert('Please accept the Terms & Conditions and Privacy Policy');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    termsAccepted: true
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Signup failed');
                setLoading(false);
                return;
            }

            // Save user info
            // Save user info
            localStorage.setItem('user', JSON.stringify(data));
            router.push(`/verify-email?email=${formData.email}`);
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred during signup');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md w-[95%] mx-auto">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 transform -rotate-6">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-center text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
                    Join PixWarm
                </h2>
                <p className="mt-2 text-center text-sm sm:text-base text-slate-500 font-medium">
                    Start warming your pixels today
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl w-[95%] mx-auto">
                <div className="bg-white py-8 sm:py-10 px-6 sm:px-12 shadow-2xl shadow-slate-200/60 rounded-3xl border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400 font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400 font-medium"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Terms & Conditions */}
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="w-4 h-4 mt-1 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 bg-slate-50"
                                required
                            />
                            <label className="ml-2 text-sm text-slate-600">
                                I agree to the{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                                >
                                    Terms & Conditions
                                </button>
                                {' '}and{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyModal(true)}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                                >
                                    Privacy Policy
                                </button>
                            </label>
                        </div>

                        {/* Signup Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-lg transition duration-200 shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Join Link */}
                    <p className="mt-8 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-slate-400">
                    © 2026 PixWarm. All rights reserved.
                </p>
            </div>

            {/* Modals */}
            <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
            <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
}
