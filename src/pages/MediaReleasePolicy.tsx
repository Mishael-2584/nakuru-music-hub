import React from "react";
import { Camera } from "lucide-react";

const MediaReleasePolicy = () => (
  <div className="min-h-screen bg-muted/50 py-12 px-2">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-3xl border-l-8 border-primary/80 p-8 relative overflow-hidden">
      <div className="absolute opacity-10 right-6 top-6 text-primary -z-10">
        <Camera size={96} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <Camera className="text-primary" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Media Release Policy</h1>
      </div>
      <p className="mb-6">Damon Music Academy is proud of our students and our vibrant community. From time to time, we may take photographs or record videos of students during lessons, recitals, workshops, and other events.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">How We Use Images and Videos</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>The Damon Music Academy website (damonmusicacademy.co.ke)</li>
        <li>Official social media channels (Facebook, Instagram, YouTube, etc.)</li>
        <li>Printed materials such as brochures and posters.</li>
        <li>Digital and print advertisements.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Consent</h2>
      <p className="mb-4">Upon enrollment, students (or their parent/guardian if under 18) will be provided with a Media Release Consent Form. By signing this form, you grant Damon Music Academy permission to use you or your child's likeness in promotional materials as described above, without payment or other consideration.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Opting Out</h2>
      <p>If you do not wish for you or your child's image to be used, you may decline to sign the Media Release Consent Form or notify our office in writing at <a href="mailto:admin@damonmusicacademy.co.ke" className="text-accent underline">admin@damonmusicacademy.co.ke</a>. We will ensure your or your child's likeness is not used in any future marketing materials.</p>
    </div>
  </div>
);

export default MediaReleasePolicy; 