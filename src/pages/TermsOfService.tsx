import React from "react";
import { FileText } from "lucide-react";

const TermsOfService = () => (
  <div className="min-h-screen bg-muted/50 py-12 px-2">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-3xl border-l-8 border-primary/80 p-8 relative overflow-hidden">
      <div className="absolute opacity-10 right-6 top-6 text-primary -z-10">
        <FileText size={96} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-primary" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Terms of Service</h1>
      </div>
      <p className="mb-2 text-sm text-gray-500">Last Updated: July 8, 2025</p>
      <p className="mb-6">By accessing our website or enrolling in our services, you agree to be bound by the following Terms of Service ("Terms").</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Services</h2>
      <p className="mb-4">Damon Music Academy provides educational services in music, arts, and technology, as well as professional audio-visual production services, as described on our website.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Enrollment and Payments</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>Full payment for courses and lessons is required before the start of the term, as per the fee structure on our "Fees" page.</li>
        <li>All payments are subject to our Cancellation Policy, which is incorporated by reference into these Terms. By making a payment, you agree to the terms of the Cancellation Policy.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Intellectual Property</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>All course materials, lesson content, videos, documents, and the Damon Music Academy logo provided to you are the exclusive property of Damon Music Academy.</li>
        <li>These materials are for your personal, non-commercial use only. You may not reproduce, redistribute, or sell our course materials without our express written consent.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Code of Conduct</h2>
      <p className="mb-4">All students and clients agree to abide by the Damon Music Academy Student Code of Conduct to ensure a safe and respectful environment for everyone.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Limitation of Liability</h2>
      <p className="mb-4">Damon Music Academy is not liable for any personal injury or loss/damage to personal property that occurs at our physical locations or during our online lessons.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Governing Law</h2>
      <p className="mb-4">These Terms shall be governed by and construed in accordance with the laws of Kenya.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Contact Us</h2>
      <p>For any questions about these Terms, please contact us at <a href="mailto:admin@damonmusicacademy.co.ke" className="text-accent underline">admin@damonmusicacademy.co.ke</a>.</p>
    </div>
  </div>
);

export default TermsOfService; 