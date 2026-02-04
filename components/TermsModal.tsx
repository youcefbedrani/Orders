'use client';

import { useState } from 'react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">📜 Terms & Conditions</h2>
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

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">1. Acceptance of Terms</h3>
                        <p className="text-gray-700 mb-4">
                            By creating an account and using Warm Lead's pixel warming service, you agree to these Terms & Conditions.
                            If you do not agree, please do not use our service.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">2. Service Description</h3>
                        <p className="text-gray-700 mb-4">
                            Warm Lead provides a pixel warming service that helps you optimize your advertising pixels (Facebook, TikTok, Google Analytics)
                            by generating simulated purchase events. This service is designed to improve your ROAS (Return on Ad Spend) and pixel performance.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">3. Data Collection & Usage</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>We collect and use the following data:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li><strong>Account Information:</strong> Your name, email address, and password (encrypted)</li>
                            <li><strong>Landing Page URLs:</strong> The URLs you provide for pixel warming campaigns</li>
                            <li><strong>Excel Files:</strong> Customer data files you upload (names, phone numbers, cities, prices)</li>
                            <li><strong>Campaign Data:</strong> Number of orders, success rates, and campaign statistics</li>
                        </ul>

                        <p className="text-gray-700 mb-4">
                            <strong>How we use your data:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li>To provide pixel warming services by visiting your landing pages and firing pixel events</li>
                            <li>To generate purchase events using the customer data you provide</li>
                            <li>To track campaign performance and provide you with statistics</li>
                            <li>To improve our service and user experience</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">4. Data Storage & Security</h3>
                        <p className="text-gray-700 mb-4">
                            All uploaded Excel files are stored securely on our servers. Your password is encrypted using industry-standard bcrypt hashing.
                            We implement reasonable security measures to protect your data from unauthorized access.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">5. User Responsibilities</h3>
                        <p className="text-gray-700 mb-2">
                            <strong>You agree to:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                            <li>Provide accurate and truthful information</li>
                            <li>Use the service only for legitimate pixel warming purposes</li>
                            <li>Not upload malicious files or attempt to harm our system</li>
                            <li>Comply with Facebook, TikTok, and Google's advertising policies</li>
                            <li>Not share your account credentials with others</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">6. Service Limitations</h3>
                        <p className="text-gray-700 mb-4">
                            We provide pixel warming services on a best-effort basis. We do not guarantee specific ROAS improvements or pixel performance results.
                            Campaign success depends on many factors including your landing page, pixel configuration, and advertising platform algorithms.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">7. Account Termination</h3>
                        <p className="text-gray-700 mb-4">
                            We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity,
                            or misuse our service. You may delete your account at any time by contacting support.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">8. Intellectual Property</h3>
                        <p className="text-gray-700 mb-4">
                            All content, features, and functionality of Warm Lead are owned by us and protected by copyright and trademark laws.
                            You may not copy, modify, or distribute our service without permission.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">9. Limitation of Liability</h3>
                        <p className="text-gray-700 mb-4">
                            Warm Lead is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service,
                            including but not limited to loss of data, revenue, or advertising performance.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">10. Changes to Terms</h3>
                        <p className="text-gray-700 mb-4">
                            We may update these Terms & Conditions from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
                        </p>

                        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">11. Contact Information</h3>
                        <p className="text-gray-700 mb-4">
                            For questions about these Terms & Conditions, please contact us at: <strong>support@warmlead.com</strong>
                        </p>
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
