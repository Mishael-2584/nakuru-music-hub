import React from "react";
import { ShieldCheck } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-muted/50 py-12 px-2">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-3xl border-l-8 border-primary/80 p-8 relative overflow-hidden">
      <div className="absolute opacity-10 right-6 top-6 text-primary -z-10">
        <ShieldCheck size={96} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-primary" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Privacy Policy</h1>
      </div>
      <p className="mb-2 text-sm text-gray-500">Effective Date: July 8, 2025</p>
      <p className="mb-6">Damon Music Academy ("we," "us," or "our") is committed to protecting the privacy of our students, clients, and website users. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Information We Collect</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li><b>Personal Identification Information:</b> Name, email address, phone number, physical address, and date of birth of the student.</li>
        <li><b>Payment Information:</b> Credit card details or other payment information, which are processed securely by our third-party payment gateways. We do not store your full credit card information on our servers.</li>
        <li><b>Usage Data:</b> Information about how you use our website, such as your IP address, browser type, and pages visited, collected through cookies to help us improve our user experience.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">How We Use Your Information</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>To provide and manage our educational and production services.</li>
        <li>To process enrollments and payments.</li>
        <li>To communicate with you about your lessons, schedules, and academy news.</li>
        <li>To improve our website, services, and customer support.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Data Security</h2>
      <p className="mb-4">We implement a variety of security measures to maintain the safety of your personal information. All sensitive payment information is encrypted via Secure Socket Layer (SSL) technology.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Third-Party Disclosure</h2>
      <p className="mb-4">We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or conducting our business (e.g., payment processors), so long as those parties agree to keep this information confidential.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Your Rights</h2>
      <p className="mb-4">You have the right to request access to the personal data we hold about you and to ask that your personal data be corrected, updated, or deleted.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Contact Us</h2>
      <p>If you have any questions regarding this privacy policy, you may contact us at <a href="mailto:admin@damonmusicacademy.co.ke" className="text-accent underline">admin@damonmusicacademy.co.ke</a>.</p>
    </div>
  </div>
);

export default PrivacyPolicy; 