'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Notification state
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Campaign history state
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null); // For details modal

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
        } else {
            const parsedUser = JSON.parse(userData);

            // Check if email is verified
            // If emailVerified is undefined, we assume true because the login API enforces it before returning a user object
            // This prevents redirect loops if the user object in localStorage is missing the field
            if (parsedUser.emailVerified === false && parsedUser.role !== 'ADMIN') {
                router.push(`/verify-email?email=${parsedUser.email}`);
                return;
            }

            setUser(parsedUser);
            fetchProfile(parsedUser.id);
            fetchCampaigns(parsedUser.id);
        }
    }, [router]);

    const fetchProfile = async (userId: string) => {
        try {
            const response = await fetch(`/api/user/profile?userId=${userId}`);
            const data = await response.json();

            if (response.ok) {
                setUser(data);
                setName(data.name || '');
                setEmail(data.email || '');
            } else {
                showNotification('error', data.error || 'Failed to load profile');
            }
        } catch (error) {
            showNotification('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async (userId: string) => {
        setLoadingCampaigns(true);
        try {
            const response = await fetch(`/api/campaigns?limit=50&userId=${userId}`);
            const data = await response.json();

            if (response.ok) {
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error('Failed to load campaigns:', error);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name || !email) {
            showNotification('error', 'Name and email are required');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            showNotification('error', 'New passwords do not match');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            showNotification('error', 'New password must be at least 6 characters');
            return;
        }

        // Check if anything changed
        const nameChanged = name !== user.name;
        const emailChanged = email !== user.email;
        const passwordChanged = !!newPassword;

        if (!nameChanged && !emailChanged && !passwordChanged) {
            showNotification('error', 'No changes to save');
            return;
        }

        // Require current password for email or password changes
        if ((emailChanged || passwordChanged) && !currentPassword) {
            showNotification('error', 'Current password is required to change email or password');
            return;
        }

        setSaving(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    name,
                    email,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update local storage
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                setEditing(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                showNotification('success', 'Profile updated successfully!');

                // Refresh profile data
                fetchProfile(data.id);
            } else {
                showNotification('error', data.error || 'Failed to update profile');
            }
        } catch (error) {
            showNotification('error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleCancel = () => {
        setEditing(false);
        setName(user.name || '');
        setEmail(user.email || '');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (seconds: number | null) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center text-white hover:text-orange-100 transition"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-bold whitespace-nowrap">👤 My Profile</h1>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
                    <div className={`p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                        <div className="flex items-center">
                            {notification.type === 'success' ? (
                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                {/* Profile Info Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-8 mb-6 border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Account Information</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center space-x-2 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-semibold">Edit Profile</span>
                            </button>
                        )}
                    </div>

                    {!editing ? (
                        // View Mode
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Name</label>
                                <p className="text-lg text-slate-800">{user.name || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Email</label>
                                <p className="text-lg text-slate-800">{user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Role</label>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-500 mb-1">Member Since</label>
                                <p className="text-lg text-slate-800">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>
                    ) : (
                        // Edit Mode
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800"
                                />
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Change Password (Optional)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password *</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Required for changes"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800"
                                        />
                                        <p className="text-sm text-slate-500 mt-1">Required to change email or password</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Leave blank to keep current"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Campaign Statistics Card */}
                {user.stats && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-8 mb-6 border border-slate-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center">
                            <span className="bg-indigo-50 p-2 rounded-lg mr-3 text-lg sm:text-xl">📈</span>
                            Campaign Statistics
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <p className="text-sm text-slate-600">Total Campaigns</p>
                                <p className="text-2xl font-bold text-slate-800">{user.stats.totalCampaigns}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                <p className="text-sm text-slate-600">Total Orders</p>
                                <p className="text-2xl font-bold text-green-600">{user.stats.totalOrders}</p>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                                <p className="text-sm text-slate-600">Successful</p>
                                <p className="text-2xl font-bold text-indigo-600">{user.stats.totalSuccess}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                                <p className="text-sm text-slate-600">Success Rate</p>
                                <p className="text-2xl font-bold text-purple-600">{user.stats.successRate}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Campaign History Section */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">📊 Campaign History</h2>

                    {loadingCampaigns ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-slate-600">Loading history...</p>
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-500 text-lg">No campaigns yet</p>
                            <p className="text-slate-400 text-sm mt-2">Start your first pixel warming campaign from the dashboard</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="border-2 border-slate-100 rounded-2xl p-4 sm:p-6 hover:border-indigo-200 transition bg-slate-50/20 shadow-sm">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                    <span className="mr-1">✅</span>
                                                    Completed
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatDateTime(campaign.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                                                <span className="font-semibold">Mode:</span>
                                                <span className={`px-2 py-1 rounded ${campaign.mode === 'excel' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {campaign.mode === 'excel' ? '📊 Excel' : '🎲 Random'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {campaign.results && (
                                                <button
                                                    onClick={() => {
                                                        try {
                                                            const details = JSON.parse(campaign.results);
                                                            setSelectedCampaign({ ...campaign, details });
                                                        } catch (e) {
                                                            alert('Details not available for this campaign');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-sm border border-indigo-200 transition"
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* URL */}
                                    <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Landing Page URL</p>
                                        <a
                                            href={campaign.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline break-all"
                                        >
                                            {campaign.url}
                                        </a>
                                    </div>

                                    {/* File Info */}
                                    {campaign.fileName && (
                                        <div className="mb-4 bg-purple-50 rounded-lg p-3 border border-purple-100">
                                            <p className="text-xs text-purple-600 mb-1">Excel File Used</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-purple-900">📄 {campaign.fileName}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress/Results */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs text-slate-600">Total Orders</p>
                                            <p className="text-lg font-bold text-blue-900">{campaign.orderCount}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                            <p className="text-xs text-slate-600">Successful</p>
                                            <p className="text-lg font-bold text-green-700">{campaign.successCount}</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                            <p className="text-xs text-slate-600">Failed</p>
                                            <p className="text-lg font-bold text-red-700">{campaign.failedCount}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                            <p className="text-xs text-slate-600">Duration</p>
                                            <p className="text-lg font-bold text-orange-700">{formatTime(campaign.duration)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Campaign Details</h3>
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700">Generated Orders ({selectedCampaign.details.length})</h4>
                                <div className="space-y-2">
                                    {selectedCampaign.details.map((order: any, i: number) => (
                                        <div key={i} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border ${order.status?.toLowerCase() === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${order.status?.toLowerCase() === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {order.status?.toLowerCase() === 'success' ? '✓' : '✗'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{order.name}</p>
                                                    <p className="text-xs text-slate-500">{order.phone} • {order.city}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:mt-0 text-right">
                                                <p className="text-sm font-bold text-slate-800">{order.price || order.value} DZD</p>
                                                <p className={`text-xs font-semibold ${order.status?.toLowerCase() === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {order.status?.toLowerCase() === 'success' ? 'Pixel Fired' : 'Failed'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition"
                            >
                                Close info
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
