'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { formatDuration, formatDate, shortenUrl } from '@/lib/utils';
import { detectColumns, isConfidentDetection, getConfidenceLabel, getConfidenceColor } from '@/lib/columnDetector';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState<'random' | 'excel'>('random');
    const [numberOfOrders, setNumberOfOrders] = useState(10);
    const [customPrice, setCustomPrice] = useState(6000); // Custom price for pixel warming
    const [file, setFile] = useState<File | null>(null);
    const [customerData, setCustomerData] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [campaignStats, setCampaignStats] = useState<any>(null);
    const [detectedColumns, setDetectedColumns] = useState<any>(null);
    const [showColumnMapping, setShowColumnMapping] = useState(false);
    const [manualMapping, setManualMapping] = useState<any>({ name: '', phone: '', city: '', price: '' });
    const [mappingConfirmed, setMappingConfirmed] = useState(false);
    const [rawExcelData, setRawExcelData] = useState<any[]>([]);
    const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [jobProgress, setJobProgress] = useState<any>(null);

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
        }
    }, [router]);

    // Timer effect
    useEffect(() => {
        if (processing || activeJobId) {
            // Only reset if we just started
            if (processing && !activeJobId) setElapsedTime(0);

            const interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [processing, activeJobId]);

    // Job Polling Effect
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (activeJobId) {
            pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/jobs/${activeJobId}/progress`);
                    if (response.ok) {
                        const data = await response.json();
                        setJobProgress(data);

                        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                            setActiveJobId(null);
                            setResults(data.results ? (typeof data.results === 'string' ? JSON.parse(data.results) : data.results) : data);
                            setProcessing(false);
                            clearInterval(pollInterval);
                        }
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 2000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [activeJobId]);

    // Fetch campaign history
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch(`/api/campaigns?limit=10&userId=${user.id}`);
                const data = await response.json();
                setCampaigns(data.campaigns || []);
                setCampaignStats(data.stats);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
            }
        };

        if (user) {
            fetchCampaigns();
        }

        // Refresh after completing a campaign
        if (results && !processing) {
            fetchCampaigns();
        }
    }, [user, results, processing]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setMappingConfirmed(false);

        const buffer = await uploadedFile.arrayBuffer();

        // Read with proper encoding to support Arabic characters
        const workbook = XLSX.read(buffer, {
            type: 'array',
            codepage: 65001, // UTF-8 encoding for Arabic support
            cellDates: true,
            cellNF: false,
            cellText: false
        });

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert to JSON with raw values to preserve Arabic text
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Convert to strings to preserve Arabic
            defval: '' // Default value for empty cells
        });

        setRawExcelData(jsonData);

        // Get headers from first row
        const headers = Object.keys(jsonData[0] || {});
        setAvailableHeaders(headers);

        // Automatically detect columns
        const detection = detectColumns(headers);
        setDetectedColumns(detection);

        // Pre-fill manual mapping with detection
        setManualMapping({
            name: detection.mapping.name || '',
            phone: detection.mapping.phone || '',
            city: detection.mapping.city || '',
            price: detection.mapping.price || ''
        });

        // Show mapping UI
        setShowColumnMapping(true);
    };

    const confirmMapping = () => {
        if (!manualMapping.name || !manualMapping.phone || !manualMapping.city) {
            alert('Please map Name, Phone, and City columns');
            return;
        }
        applyColumnMapping(rawExcelData, manualMapping);
        setMappingConfirmed(true);
    };

    const applyColumnMapping = (data: any[], mapping: any) => {
        // Transform data using user-selected mapping
        const transformedData = data.map(row => ({
            name: row[mapping.name] || '',
            phone: row[mapping.phone] || '',
            city: row[mapping.city] || '',
            price: row[mapping.price] || ''
        }));

        setCustomerData(transformedData);
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

        if (!user?.id) {
            alert('Your session has expired or is invalid. Please refresh the page or try logging in again.');
            return;
        }

        setProcessing(true);
        setResults(null);

        try {
            let uploadedFileInfo = null;

            // Upload file to server if in Excel mode
            if (mode === 'excel' && file) {
                const formData = new FormData();
                formData.append('file', file);

                const uploadResponse = await fetch('/api/upload-file', {
                    method: 'POST',
                    body: formData
                });

                if (uploadResponse.ok) {
                    uploadedFileInfo = await uploadResponse.json();
                } else {
                    console.error('File upload failed');
                }
            }

            // Create asynchronous background job
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    orderCount: mode === 'random' ? numberOfOrders : customerData.length,
                    mode,
                    customPrice,
                    customerData: mode === 'excel' ? JSON.stringify(customerData) : undefined,
                    userId: user?.id,
                    fileName: uploadedFileInfo?.filename || file?.name,
                    fileUrl: uploadedFileInfo?.fileUrl,
                    fileSize: uploadedFileInfo?.fileSize
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Job created successfully, real-time feedback will come from polling /api/jobs
                setActiveJobId(data.jobId);
                setJobProgress({
                    status: 'PENDING',
                    processedCount: 0,
                    orderCount: mode === 'random' ? numberOfOrders : customerData.length
                });
                setResults(null);
            } else {
                alert(data.error || 'Failed to start warming');
                setProcessing(false);
            }
        } catch (error) {
            console.error('Error starting warming:', error);
            alert('Error starting pixel warming');
            setProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 self-start sm:self-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">PixWarm Dashboard</h1>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Premium Pixel Warming</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-4 border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                            <p className="font-semibold text-sm sm:text-base text-slate-700">{user?.name || 'User'}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => router.push('/profile')}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition flex items-center space-x-2 text-sm font-medium"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition flex items-center space-x-2 text-sm font-medium"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Stats Cards or Progress */}
                {(results || jobProgress) && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 border-l-4 border-blue-500">
                            <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{results?.total || jobProgress?.orderCount || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
                            <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Successful</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">{results?.successful || jobProgress?.successCount || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 border-l-4 border-red-500">
                            <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Failed</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-600">{results?.failed || jobProgress?.failedCount || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 border-l-4 border-purple-500">
                            <p className="text-[10px] sm:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                                {jobProgress?.status === 'RUNNING' || jobProgress?.status === 'PENDING' ? 'Progress' : 'Success Rate'}
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                                {jobProgress?.status === 'RUNNING' || jobProgress?.status === 'PENDING'
                                    ? `${Math.round(((jobProgress.processedCount || 0) / (jobProgress.orderCount || 1)) * 100)}%`
                                    : `${results?.successRate}%`
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-8 mb-6 border border-slate-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <span className="bg-indigo-50 text-indigo-600 p-2 rounded-lg mr-3">⚙️</span>
                        Configuration
                    </h2>

                    {/* Landing Page URL */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Landing Page URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://your-website.com/product"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                        />
                        <p className="text-sm text-slate-500 mt-1">Any website URL (Shopify, WooCommerce, custom site, etc.)</p>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider text-xs">
                            Data Source
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <button
                                onClick={() => setMode('random')}
                                className={`p-4 rounded-xl border-2 transition text-left ${mode === 'random' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mode === 'random' ? 'border-indigo-500' : 'border-slate-300'}`}>
                                        {mode === 'random' && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Random Data</p>
                                        <p className="text-xs text-slate-500">Auto-generate customers</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('excel')}
                                className={`p-4 rounded-xl border-2 transition text-left ${mode === 'excel' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mode === 'excel' ? 'border-indigo-500' : 'border-slate-300'}`}>
                                        {mode === 'excel' && <div className="w-3 h-3 bg-indigo-500 rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Excel Upload</p>
                                        <p className="text-xs text-slate-500">Use your own data</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Custom Price Input - Shown for both modes */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            💰 Purchase Value (DZD)
                        </label>
                        <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(parseInt(e.target.value) || 6000)}
                            min="100"
                            max="1000000"
                            step="100"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                            {mode === 'random'
                                ? 'Set the purchase value to send to Facebook/TikTok pixels (e.g., 6000 DZD)'
                                : 'Default purchase value for Excel rows without prices (e.g., 6000 DZD)'
                            }
                        </p>
                    </div>

                    {/* Random Mode */}
                    {mode === 'random' && (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Number of Orders
                                </label>
                                <input
                                    type="number"
                                    value={numberOfOrders}
                                    onChange={(e) => setNumberOfOrders(parseInt(e.target.value) || 10)}
                                    min="1"
                                    max="500"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none text-slate-800 placeholder-slate-400"
                                />
                                <p className="text-sm text-slate-500 mt-1">Recommended: 10-200 orders (Max: 500)</p>
                            </div>
                        </>
                    )}

                    {/* Excel Mode */}
                    {mode === 'excel' && (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Upload Excel File
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 transition bg-slate-50/50">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {file ? (
                                            <span className="text-indigo-600 font-semibold">📄 {file.name} ({customerData.length} customers)</span>
                                        ) : (
                                            <>Click to upload Excel or CSV</>
                                        )}
                                    </p>
                                </label>
                            </div>

                            {/* Column Mapping Display */}
                            {showColumnMapping && (
                                <div className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center text-lg">
                                            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Column Mapping
                                        </h4>
                                        {mappingConfirmed ? (
                                            <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                                                ✓ Confirmed
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-bold">
                                                ⚠ Action Required
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {[
                                            { label: '👤 Name Column', key: 'name', required: true },
                                            { label: '📱 Phone Column', key: 'phone', required: true },
                                            { label: '🏙️ City Column', key: 'city', required: true },
                                            { label: '💰 Price Column', key: 'price', required: false }
                                        ].map((field) => {
                                            const isAutoDetected = detectedColumns?.mapping[field.key] === manualMapping[field.key] && manualMapping[field.key] !== '';
                                            const confidence = detectedColumns?.confidence[field.key] || 0;

                                            return (
                                                <div key={field.key}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        {isAutoDetected && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getConfidenceColor(confidence).replace('text-', 'bg-').replace('-600', '-100')} ${getConfidenceColor(confidence)}`}>
                                                                Auto: {getConfidenceLabel(confidence)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <select
                                                        value={manualMapping[field.key]}
                                                        onChange={(e) => {
                                                            setManualMapping({ ...manualMapping, [field.key]: e.target.value });
                                                            setMappingConfirmed(false);
                                                        }}
                                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm text-slate-700"
                                                    >
                                                        <option value="">Select Column...</option>
                                                        {availableHeaders.map(header => (
                                                            <option key={header} value={header}>{header}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {!mappingConfirmed ? (
                                        <button
                                            onClick={confirmMapping}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition transform hover:scale-[1.02]"
                                        >
                                            Confirm Column Mapping
                                        </button>
                                    ) : (
                                        <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                                            Mapping confirmed! Ready to start.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Start Button */}
                    <button
                        onClick={startWarming}
                        disabled={processing || !!activeJobId || !url || (mode === 'excel' && (!customerData.length || !mappingConfirmed))}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-[1.01] transition duration-200 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {processing || activeJobId ? (
                            <>
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>
                                    {jobProgress?.status === 'PENDING' ? 'Queued...' : `Warming Pixel... (${jobProgress?.processedCount || 0}/${jobProgress?.orderCount || (mode === 'random' ? numberOfOrders : customerData.length)})`} • {formatDuration(elapsedTime)}
                                </span>
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
                {results && results.orders && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 md:p-8 mb-6 border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 md:mb-0">Generated Orders</h2>
                            {results.duration && (
                                <div className="flex items-center space-x-2 text-sm text-slate-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Completed in {formatDuration(results.duration)}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1">
                            {results.orders.map((order: any, i: number) => (
                                <div key={i} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl gap-3 ${order.status?.toLowerCase() === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-center space-x-3">
                                        {order.status?.toLowerCase() === 'success' ? (
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{order.name}</p>
                                            <p className="text-xs sm:text-sm text-slate-600 truncate">{order.phone} • {order.city} • {order.price || order.value} DZD</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-1 sm:mt-0">
                                        <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-sm ${order.status?.toLowerCase() === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {order.status?.toLowerCase() === 'success' ? '✓ Pixel Fired' : '✗ Failed'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Next Steps */}
                        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h3 className="font-semibold text-indigo-900 mb-2">✅ Next Steps</h3>
                            <ul className="text-sm text-indigo-800 space-y-1">
                                <li>• Check Facebook Events Manager for Purchase events</li>
                                <li>• Check TikTok Events Manager for CompletePayment events</li>
                                <li>• Your pixel is warmed up for better ad performance!</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Campaign History */}
                {campaigns.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-4 md:p-8 border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Campaign History</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <p className="text-sm text-slate-600">Total Campaigns</p>
                                <p className="text-2xl font-bold text-slate-800">{campaignStats?.totalCampaigns || 0}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                                <p className="text-sm text-slate-600">Total Orders</p>
                                <p className="text-2xl font-bold text-green-600">{campaignStats?.totalOrders || 0}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                                <p className="text-sm text-slate-600">Success Rate</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {campaignStats?.totalOrders > 0
                                        ? ((campaignStats.totalSuccess / campaignStats.totalOrders) * 100).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                                <p className="text-sm text-slate-600">Total Success</p>
                                <p className="text-2xl font-bold text-indigo-600">{campaignStats?.totalSuccess || 0}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {campaigns.slice(0, 10).map((campaign: any, i: number) => (
                                <div key={campaign.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition bg-slate-50/30">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate" title={campaign.url}>
                                                🔗 {shortenUrl(campaign.url, 50)}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {formatDate(campaign.createdAt)} • {campaign.orderCount} orders • {campaign.successRate.toFixed(1)}% success
                                                {campaign.fileName && <span className="ml-2 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">📄 {campaign.fileName}</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <div className="flex items-center space-x-1 text-slate-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{formatDuration(campaign.duration)}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${campaign.mode === 'random' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {campaign.mode === 'random' ? '🎲 Random' : '📊 Excel'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
