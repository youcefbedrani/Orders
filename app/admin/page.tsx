'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '' });

    useEffect(() => {
        // Check Admin Auth
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

        setUser(parsedUser);
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            alert('Error deleting user');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const startEditing = (u: any) => {
        setEditingId(u.id);
        setEditForm({ name: u.name || '', role: u.role });
    };

    const handleSaveEdit = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, ...editForm } : u));
                setEditingId(null);
            } else {
                alert('Failed to update user');
            }
        } catch (error) {
            alert('Error updating user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">🛡️</span>
                            <span className="font-bold text-xl text-gray-800">Hashtag Admin</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</span>
                                <span className="text-xs text-gray-500">{user?.email}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between sm:block">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Total Users</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{users.length}</p>
                        </div>
                        <div className="text-3xl sm:hidden">👤</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between sm:block">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Campaigns</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                                {users.reduce((acc, curr) => acc + (curr.campaignCount || 0), 0)}
                            </p>
                        </div>
                        <div className="text-3xl sm:hidden">📊</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between sm:block">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Status</p>
                            <div className="flex items-center mt-1">
                                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                <p className="text-xl sm:text-2xl font-bold text-green-600 uppercase tracking-tighter">Live</p>
                            </div>
                        </div>
                        <div className="text-3xl sm:hidden">⚡</div>
                    </div>
                </div>

                {/* Users Table / Mobile Cards */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800">User Management</h2>
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-bold">
                            {users.length} Active
                        </span>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaigns</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4 min-w-0">
                                                    {editingId === u.id ? (
                                                        <input
                                                            className="text-sm font-medium text-gray-900 border rounded px-2 py-1 w-full"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="text-sm font-medium text-gray-900 truncate">{u.name || u.email.split('@')[0]}</div>
                                                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingId === u.id ? (
                                                <select
                                                    className="text-xs leading-5 font-semibold rounded-full border px-2 py-1"
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="BLOCKED">BLOCKED</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-bold">{u.campaignCount || 0}</div>
                                            <div className="text-xs text-gray-500 uppercase tracking-tighter">Campaigns</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(u.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {editingId === u.id ? (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => handleSaveEdit(u.id)} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-md transition">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition font-bold">Activity</button>
                                                    <button onClick={() => startEditing(u)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition font-bold">Edit</button>
                                                    {u.email !== 'admin@admin.com' && (
                                                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="bg-red-50 p-1 rounded-md text-red-600 hover:bg-red-100 px-3 font-bold">Delete</button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-100">
                        {users.map((u) => (
                            <div key={u.id} className="p-4 bg-white hover:bg-gray-50 transition active:bg-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900 truncate">{u.name || 'No Name'}</p>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                    <div>
                                        <span className="font-bold text-gray-800">{u.campaignCount || 0}</span> Campaigns
                                    </div>
                                    <div>
                                        Joined <span className="font-bold text-gray-800">{formatDate(u.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => router.push(`/admin/users/${u.id}`)}
                                        className="text-indigo-600 text-xs font-bold uppercase tracking-wider bg-indigo-50 px-4 py-2 rounded-lg"
                                    >
                                        Activity
                                    </button>
                                    <button
                                        onClick={() => startEditing(u)}
                                        className="text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-4 py-2 rounded-lg"
                                    >
                                        Edit
                                    </button>
                                    {u.email !== 'admin@admin.com' && (
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                            className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <span className="text-4xl mb-2">🔎</span>
                            <p className="font-medium">No users found.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
