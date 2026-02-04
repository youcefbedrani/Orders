'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Login failed');
                setLoading(false);
                return;
            }

            // Save user info
            localStorage.setItem('user', JSON.stringify(data));

            // Redirect based on role
            if (data.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
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
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm sm:text-base text-slate-500 font-medium">
                    Log in to your PixWarm account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-[95%] mx-auto">
                <div className="bg-white py-8 sm:py-10 px-6 sm:px-10 shadow-2xl shadow-slate-200/60 rounded-3xl border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                <span className="ml-2 text-sm text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Forgot password?
                            </a>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="mt-8 text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline">
                            Sign up for free
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-slate-400">
                    © 2026 PixWarm. All rights reserved.
                </p>
            </div>
        </div>
    );
}
