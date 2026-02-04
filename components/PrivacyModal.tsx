'use client';

import { useState } from 'react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">🔒 Privacy Policy</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="prose max-w-none">
                        <p className="text-sm text-gray-500 mb-4">Last Updated: February 3, 2026</p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">1. Introduction</h3>
                        <p className="text-gray-700 mb-4">
                            Warm Lead ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
                            use, store, and protect your personal information when you use our pixel warming service.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">2. Information We Collect</h3>

                        <p className="text-gray-700 mb-2"><strong>2.1 Account Information</strong></p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Password (encrypted with bcrypt)</li>
                            <li>Account creation date</li>
                        </ul>

                        <p className="text-gray-700 mb-2"><strong>2.2 Campaign Data</strong></p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                            <li>Landing page URLs you provide</li>
                            <li>Number of orders per campaign</li>
                            <li>Campaign success rates and statistics</li>
                            <li>Campaign creation dates and durations</li>
                        </ul>

                        <p className="text-gray-700 mb-2"><strong>2.3 Uploaded Files</strong></p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                            <li>Excel files containing customer data (names, phone numbers, cities, prices)</li>
                            <li>File names and upload dates</li>
                            <li>File sizes</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">3. How We Use Your Information</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>We use your information to:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li><strong>Provide Services:</strong> Execute pixel warming campaigns by visiting your landing pages and firing pixel events</li>
                            <li><strong>Generate Events:</strong> Use customer data from your Excel files to create realistic purchase events</li>
                            <li><strong>Track Performance:</strong> Monitor campaign success rates and provide you with statistics</li>
                            <li><strong>Account Management:</strong> Authenticate your account and manage your profile</li>
                            <li><strong>Service Improvement:</strong> Analyze usage patterns to improve our service</li>
                            <li><strong>Support:</strong> Respond to your questions and provide customer support</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">4. Data Storage & Security</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>4.1 Storage Location</strong>
                        </p>
                        <p className="text-gray-700 mb-4">
                            All data is stored on secure servers. Uploaded Excel files are stored in a protected directory accessible only to authorized administrators.
                        </p>

                        <p className="text-gray-700 mb-2">
                            <strong>4.2 Security Measures</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                            <li>Passwords are encrypted using bcrypt (10 rounds)</li>
                            <li>HTTPS encryption for all data transmission</li>
                            <li>Access controls to limit who can view your data</li>
                            <li>Regular security updates and monitoring</li>
                        </ul>

                        <p className="text-gray-700 mb-2">
                            <strong>4.3 Data Retention</strong>
                        </p>
                        <p className="text-gray-700 mb-4">
                            We retain your data for as long as your account is active. Uploaded files are kept to allow administrators to review campaigns
                            and provide support. You may request deletion of your data at any time.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">5. Data Sharing</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>We do NOT sell your personal information.</strong>
                        </p>
                        <p className="text-gray-700 mb-4">
                            Your data is shared only in the following limited circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li><strong>With Advertising Platforms:</strong> When we visit your landing pages, pixel events are sent to Facebook, TikTok,
                                and Google Analytics as part of the pixel warming service</li>
                            <li><strong>With Administrators:</strong> Our admin team can view your campaigns and uploaded files for support and quality assurance purposes</li>
                            <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">6. Your Rights</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>You have the right to:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li><strong>Access:</strong> View your account information and campaign data at any time</li>
                            <li><strong>Update:</strong> Edit your name, email, and password through your profile page</li>
                            <li><strong>Delete:</strong> Request deletion of your account and all associated data</li>
                            <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
                            <li><strong>Opt-Out:</strong> Stop using our service at any time</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">7. Cookies & Tracking</h3>
                        <p className="text-gray-700 mb-4">
                            We use local storage to keep you logged in. We do not use third-party tracking cookies for advertising purposes.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">8. Children's Privacy</h3>
                        <p className="text-gray-700 mb-4">
                            Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">9. Changes to Privacy Policy</h3>
                        <p className="text-gray-700 mb-4">
                            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the service.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">10. Contact Us</h3>
                        <p className="text-gray-700 mb-4">
                            For questions about this Privacy Policy or to exercise your rights, contact us at: <strong>privacy@warmlead.com</strong>
                        </p>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                            <p className="text-sm text-blue-800">
                                <strong>📌 Important:</strong> By using Warm Lead, you consent to the collection and use of your information as described in this Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
