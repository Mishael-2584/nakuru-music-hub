import React from "react";
import { Users } from "lucide-react";

const StudentCodeOfConduct = () => (
  <div className="min-h-screen bg-muted/50 py-12 px-2">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-3xl border-l-8 border-primary/80 p-8 relative overflow-hidden">
      <div className="absolute opacity-10 right-6 top-6 text-primary -z-10">
        <Users size={96} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="text-primary" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Student Code of Conduct</h1>
      </div>
      <p className="mb-6">Damon Music Academy is dedicated to fostering a positive, respectful, and productive learning community. We expect all students, parents, and guardians to adhere to this Code of Conduct.</p>
      <hr className="my-6 border-accent/30" />
      <ul className="list-disc pl-6 mb-4 text-base">
        <li><b>Respect:</b> Show courtesy and respect to all instructors, staff, and fellow students at all times. Bullying, harassment, or disruptive behavior will not be tolerated.</li>
        <li><b>Punctuality and Preparation:</b> Arrive on time for all scheduled lessons, whether in-person or online. Come prepared with all necessary materials (instruments, books, etc.).</li>
        <li><b>Facility Care:</b> Students at our physical locations are expected to treat the academy's property, instruments, and facilities with care and respect.</li>
        <li><b>Online Lesson Etiquette:</b> For online lessons, students are expected to be in a quiet, distraction-free environment. Appropriate attire is required. Unauthorized recording of lessons is strictly prohibited.</li>
        <li><b>Communication:</b> All communication with staff and instructors should be respectful and professional.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <p className="mb-4">Violation of this Code of Conduct may result in disciplinary action, up to and including suspension or termination of enrollment without a refund.</p>
    </div>
  </div>
);

export default StudentCodeOfConduct; 