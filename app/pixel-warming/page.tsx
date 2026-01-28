'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PixelWarming() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [numberOfOrders, setNumberOfOrders] = useState(10);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);

    const startWarming = async () => {
        if (!url) {
            alert('Please enter a landing page URL');
            return;
        }

        setProcessing(true);
        setResults(null);

        try {
            const response = await fetch('/api/warm-pixel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, numberOfOrders, mode: 'random' })
            });

            const data = await response.json();
            setResults(data);
        } catch (error) {
            alert('Error warming pixel');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">🔥 Pixel Warming</h1>
                    <p className="text-gray-600">Generate fake purchase events to warm up your Facebook/TikTok pixel</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    {/* URL Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Landing Page URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://your-store.com/product"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Number of Orders */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Number of Orders
                        </label>
                        <input
                            type="number"
                            value={numberOfOrders}
                            onChange={(e) => setNumberOfOrders(parseInt(e.target.value) || 10)}
                            min="1"
                            max="100"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">Recommended: 10-50 orders</p>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={startWarming}
                        disabled={processing || !url}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-200 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Warming Pixel... ({results?.successful || 0}/{numberOfOrders})</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Start Pixel Warming</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {results && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Results</h2>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-800">{results.total}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                <p className="text-sm text-gray-600">Success</p>
                                <p className="text-2xl font-bold text-green-600">{results.successful}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                                <p className="text-sm text-gray-600">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                                <p className="text-sm text-gray-600">Success Rate</p>
                                <p className="text-2xl font-bold text-purple-600">{results.successRate}%</p>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {results.orders?.map((order: any, i: number) => (
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
                                        {order.status === 'success' ? 'Success' : 'Failed'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Next Steps */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-2">✅ Next Steps</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Check your Facebook Events Manager to verify Purchase events</li>
                                <li>• Check your TikTok Events Manager for CompletePayment events</li>
                                <li>• Your pixel is now warmed up and ready for better ad performance!</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-3">ℹ️ How It Works</h3>
                    <ul className="space-y-2 text-sm">
                        <li>• Visits your landing page with a real browser</li>
                        <li>• Fires Facebook Pixel "Purchase" events</li>
                        <li>• Fires TikTok Pixel "CompletePayment" events</li>
                        <li>• Uses random customer data (names, phones, cities)</li>
                        <li>• <strong>Does NOT create real orders in your store</strong></li>
                        <li>• Helps warm up your pixel for better ad targeting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
