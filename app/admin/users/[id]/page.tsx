'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDuration, formatDate, shortenUrl } from '@/lib/utils';

export default function UserActivity() {
    const router = useRouter();
    const { id: userId } = useParams();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [targetUser, setTargetUser] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        setAdminUser(parsedUser);
        fetchUserDetails();
        fetchUserActivity();
    }, [router, userId]);

    const fetchUserDetails = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const users = await res.json();
            const user = users.find((u: any) => u.id === userId);
            setTargetUser(user);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    const fetchUserActivity = async () => {
        try {
            const res = await fetch(`/api/campaigns?userId=${userId}&limit=100`);
            const data = await res.json();
            setCampaigns(data.campaigns || []);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching user activity:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/admin')}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <span className="font-bold text-xl text-gray-800">User Activity History</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* User Info Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-4">
                    <div className="flex flex-col sm:flex-row items-center">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-inner">
                            {targetUser?.name?.charAt(0) || targetUser?.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="sm:ml-6 mt-3 sm:mt-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{targetUser?.name || 'Unknown User'}</h2>
                            <p className="text-sm text-gray-500">{targetUser?.email}</p>
                            <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${targetUser?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {targetUser?.role}
                            </span>
                        </div>
                    </div>
                    <div className="sm:text-right border-t sm:border-0 pt-4 sm:pt-0 w-full sm:w-auto">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Joined Date</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">{targetUser ? formatDate(targetUser.createdAt) : 'N/A'}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase">Campaigns</p>
                        <p className="text-xl sm:text-3xl font-bold text-gray-800 mt-1">{stats?.totalCampaigns || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase">Orders</p>
                        <p className="text-xl sm:text-3xl font-bold text-indigo-600 mt-1">{stats?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase">Success</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1">
                            {stats?.totalOrders > 0 ? ((stats.totalSuccess / stats.totalOrders) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase">Points</p>
                        <p className="text-xl sm:text-3xl font-bold text-orange-500 mt-1">{stats?.totalSuccess || 0}</p>
                    </div>
                </div>

                {/* Activity List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Campaign History</h3>
                        <span className="text-sm text-gray-500">{campaigns.length} total entries</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store/URL</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-blue-600 truncate max-w-[120px] sm:max-w-xs" title={campaign.url}>
                                                {shortenUrl(campaign.url, 30)}
                                            </div>
                                            {campaign.fileName && (
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center bg-gray-50 px-2 py-0.5 rounded inline-flex">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {campaign.fileName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {formatDate(campaign.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                            <span className={`px-2 inline-flex text-[10px] font-bold uppercase rounded-full ${campaign.mode === 'random' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {campaign.mode === 'random' ? 'Random' : 'Excel'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            {campaign.orderCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-bold">{campaign.successCount}</div>
                                            <div className="text-[10px] text-green-600 font-bold">{campaign.successRate.toFixed(1)}%</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 hidden lg:table-cell">
                                            {formatDuration(campaign.duration)}
                                        </td>
                                    </tr>
                                ))}
                                {campaigns.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                            No activity found for this user.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
