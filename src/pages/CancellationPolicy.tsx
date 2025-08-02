import React from "react";
import { CalendarClock } from "lucide-react";

const CancellationPolicy = () => (
  <div className="min-h-screen bg-muted/50 py-12 px-2">
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-3xl border-l-8 border-primary/80 p-8 relative overflow-hidden">
      <div className="absolute opacity-10 right-6 top-6 text-primary -z-10">
        <CalendarClock size={96} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <CalendarClock className="text-primary" size={32} />
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Cancellation & Make-up Lesson Policy</h1>
      </div>
      <p className="mb-6">At Damon Music Academy, we are committed to providing a high-quality learning experience. Our cancellation policy is designed to be fair to our students while respecting the professional commitment and time of our dedicated instructors.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Individual Lesson Cancellations</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li><b>24-Hour Notice Required:</b> To be eligible for a make-up lesson, we require a minimum of 24 hours' notice before your scheduled lesson time.</li>
        <li><b>Timely Cancellations (&gt;24 hours):</b> If you provide more than 24 hours' notice via the Student Portal, a make-up credit will be automatically added to your account. Students are eligible for two make-up lesson credits per student, per month. Make-up lessons are subject to teacher availability and must be completed within the current billing period/term. Once a make-up lesson is scheduled, it cannot be cancelled or rescheduled again; missing it will result in forfeiture.</li>
        <li><b>Late Cancellations (&lt;24 hours):</b> Cancellations made with less than 24 hours' notice will be forfeited. The student will be charged the full fee for the missed lesson.</li>
        <li><b>No-Shows:</b> Failure to attend a lesson without notice is considered a forfeited lesson, and the full fee will be charged.</li>
        <li><b>Group Sessions:</b> Make-up lessons are not provided for missed group sessions due to the collaborative and progressive nature of these classes.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Cancellation by the Academy</h2>
      <p className="mb-4">If an instructor must cancel a lesson, we will notify you as soon as possible. A make-up lesson will be scheduled, or a credit will be applied to your account at no charge.</p>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">Term/Program Withdrawal</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>All registration and material fees are non-refundable.</li>
        <li>If you wish to withdraw from a multi-week program, please provide 30 days' written notice to our administrative office. Tuition fees are non-refundable after the second week of any given term.</li>
      </ul>
      <hr className="my-6 border-accent/30" />
      <h2 className="text-xl font-semibold mt-8 mb-2 text-primary">How to Cancel or Reschedule a Lesson</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li><b>The Student Portal (Preferred Method):</b> For your convenience, the quickest way to manage your lessons is through your account on the Student Portal, which is available 24/7.</li>
        <li><b>Contacting the Office (Alternative Method):</b> For urgent matters or if you are unable to access the portal, you may also cancel by contacting our admin office at <a href="mailto:admin@damonmusicacademy.co.ke" className="text-accent underline">admin@damonmusicacademy.co.ke</a> or <a href="tel:0701195460" className="text-accent underline">0701195460</a> during business hours.</li>
      </ul>
    </div>
  </div>
);

export default CancellationPolicy; 