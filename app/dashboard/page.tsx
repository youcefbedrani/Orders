'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState<'random' | 'excel'>('random');
    const [numberOfOrders, setNumberOfOrders] = useState(10);
    const [file, setFile] = useState<File | null>(null);
    const [customerData, setCustomerData] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);

        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setCustomerData(jsonData as any[]);
    };

    const startWarming = async () => {
        if (!url) {
            alert('Please enter a landing page URL');
            return;
        }

        if (mode === 'excel' && customerData.length === 0) {
            alert('Please upload an Excel file');
            return;
        }

        const ordersCount = mode === 'random' ? numberOfOrders : customerData.length;
        if (!ordersCount || isNaN(ordersCount) || ordersCount < 1) {
            alert('Please enter a valid number of orders');
            return;
        }

        setProcessing(true);
        setResults(null);

        try {
            const response = await fetch('/api/warm-pixel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    numberOfOrders: mode === 'random' ? numberOfOrders : customerData.length,
                    mode,
                    customerData: mode === 'excel' ? customerData : undefined
                })
            });

            const data = await response.json();
            setResults(data);
        } catch (error) {
            alert('Error warming pixel');
        } finally {
            setProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">🔥 Warm Lead</h1>
                            <p className="text-sm text-orange-100">Pixel Warming Tool</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="font-semibold">{user?.name || 'User'}</p>
                            <p className="text-xs text-orange-100">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                {results && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-800">{results.total}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                            <p className="text-sm text-gray-600 mb-1">Successful</p>
                            <p className="text-3xl font-bold text-green-600">{results.successful}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                            <p className="text-sm text-gray-600 mb-1">Failed</p>
                            <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                            <p className="text-3xl font-bold text-purple-600">{results.successRate}%</p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Pixel Warming Configuration</h2>

                    {/* Landing Page URL */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Landing Page URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://your-website.com/product"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">Any website URL (Shopify, WooCommerce, custom site, etc.)</p>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Data Source
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('random')}
                                className={`p-4 rounded-lg border-2 transition ${mode === 'random' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${mode === 'random' ? 'border-orange-500' : 'border-gray-300'}`}>
                                        {mode === 'random' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">Random Data</p>
                                        <p className="text-xs text-gray-600">Auto-generate fake customers</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('excel')}
                                className={`p-4 rounded-lg border-2 transition ${mode === 'excel' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${mode === 'excel' ? 'border-orange-500' : 'border-gray-300'}`}>
                                        {mode === 'excel' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-800">Excel Upload</p>
                                        <p className="text-xs text-gray-600">Use your own customer data</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Random Mode */}
                    {mode === 'random' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Number of Orders
                            </label>
                            <input
                                type="number"
                                value={numberOfOrders}
                                onChange={(e) => setNumberOfOrders(parseInt(e.target.value))}
                                min="1"
                                max="500"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">Recommended: 10-200 orders (Max: 500)</p>
                        </div>
                    )}

                    {/* Excel Mode */}
                    {mode === 'excel' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Upload Excel File
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-600">
                                        {file ? (
                                            <span className="text-orange-600 font-semibold">📄 {file.name} ({customerData.length} customers)</span>
                                        ) : (
                                            <>Click to upload Excel or CSV</>
                                        )}
                                    </p>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Start Button */}
                    <button
                        onClick={startWarming}
                        disabled={processing || !url || (mode === 'excel' && customerData.length === 0)}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-200 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Warming Pixel... ({results?.successful || 0}/{mode === 'random' ? numberOfOrders : customerData.length})</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>🔥 Start Pixel Warming</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {results && results.orders && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Generated Orders</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {results.orders.map((order: any, i: number) => (
                                <div key={i} className={`flex items-center justify-between p-4 rounded-lg ${order.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-center space-x-3">
                                        {order.status === 'success' ? (
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-800">{order.name}</p>
                                            <p className="text-sm text-gray-600">{order.phone} • {order.city} • {order.value} DZD</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {order.status === 'success' ? '✓ Pixel Fired' : '✗ Failed'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Next Steps */}
                        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h3 className="font-semibold text-orange-900 mb-2">✅ Next Steps</h3>
                            <ul className="text-sm text-orange-800 space-y-1">
                                <li>• Check Facebook Events Manager for Purchase events</li>
                                <li>• Check TikTok Events Manager for CompletePayment events</li>
                                <li>• Your pixel is warmed up for better ad performance!</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
