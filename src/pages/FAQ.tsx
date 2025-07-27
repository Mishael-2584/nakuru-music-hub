import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { BookOpen, UserCheck, Video, School, Film, FileText } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppChat from '@/components/WhatsAppChat';

const faqData = [
  {
    category: 'General Information & Programs',
    icon: <BookOpen className="w-6 h-6 text-blue-500 mr-2" />, 
    questions: [
      { q: 'What does Damon Music Academy offer beyond music?', a: 'While music is our core, we also offer programs in Photography, Art & Design, Music Production, Videography, and Live Sound.' },
      { q: 'Where are your physical locations?', a: 'We have physical campuses in Nakuru and Nairobi.' },
      { q: 'What age groups do you cater to?', a: 'We offer programs for various age groups, from beginners to advanced students. Please inquire about specific program age recommendations.' },
      { q: 'Do you hold student recitals?', a: 'Yes, we proudly host termly recitals to provide our students with valuable performance experience and to celebrate their musical achievements in a supportive environment.' },
      { q: "I'm a complete beginner with no prior music experience. Can I still join?", a: 'Absolutely! We welcome students of all ages and skill levels, including complete beginners. Our expert instructors are dedicated to guiding you from the very start of your creative journey.' },
      { q: 'What instruments can I learn at Damon Music Academy?', a: 'We offer instruction on a wide range of instruments, including Piano, Guitar, Drums, Violin, Voice, Trumpet, and more. Please contact us for a full list of available instruments.' },
      { q: 'How long are individual lessons, and how often do they occur?', a: 'Our individual lessons typically run for 30 minutes, with most students having two sessions per instrument per week to ensure consistent progress. Longer sessions or different frequencies can be arranged based on program and student needs.' },
      { q: 'Do I need to own an instrument to start lessons?', a: 'While owning your own instrument is beneficial for practice, we may be able to provide access to instruments for lessons on campus. Please contact us to discuss instrument availability for your chosen program.' },
      { q: 'What are your operating hours for lessons?', a: 'Our typical operating hours for lessons are [Insert your specific operating hours here, e.g., Monday-Friday: 9 AM - 6 PM, Saturday: 9 AM - 4 PM]. We also offer online options for flexibility.' },
      { q: 'What makes Damon Music Academy unique?', a: "We are Nakuru's premier Music & Creative Arts Hub, known for our expert instructors, comprehensive curricula (ABRSM, LCM, Trinity, RockSchool), personalized guidance, and a vibrant community. We offer a holistic approach, blending traditional instruction with modern skills like music production and live sound, preparing students for both classical and contemporary music environments." },
    ]
  },
  {
    category: 'Enrollment & Fees',
    icon: <UserCheck className="w-6 h-6 text-green-500 mr-2" />, 
    questions: [
      { q: 'How do I enroll in a program at Damon Music Academy?', a: 'You can apply by clicking "Enroll Now" on our website. Fill out the application form, and once submitted, you\'ll receive an email confirming receipt. Our admin team will review your application, and you\'ll receive a second email with our decision.' },
      { q: 'Do you offer trial lessons?', a: 'Please contact us directly to inquire about the availability of trial lessons for specific instruments or programs.' },
      { q: 'When do I make payment for my chosen course?', a: 'Payment is integrated into our online enrollment system. Once your application has been reviewed and officially accepted by our administration, you will receive a specific email with instructions and a secure link to complete your payment on our website.' },
      { q: 'How do existing clients pay for new courses or upcoming terms?', a: 'Existing clients can easily manage payments directly through their personalized Student Portal. You\'ll find sections for "My Billing" or "Invoices" with clear "Pay Now" options for outstanding fees or new program enrollments.' },
      { q: 'What payment methods do you accept?', a: 'We accept payments via M-Pesa, Stripe, and PayPal, integrated directly into our website\'s payment gateway.' },
    ]
  },
  {
    category: 'Live Online Classes',
    icon: <Video className="w-6 h-6 text-purple-500 mr-2" />, 
    questions: [
      { q: 'Do you offer online classes?', a: 'Yes, we offer live online classes for a professional and interactive learning experience, allowing students to learn from anywhere.' },
      { q: 'How do I access my live online class?', a: 'Once enrolled, all your scheduled live online classes will be accessible directly from your Student Portal. Simply log in and click the "Join Class" button for your session. You will receive clear instructions on how to set up your device for optimal online learning.' },
      { q: 'Will live online classes be recorded?', a: 'Yes, live classes are recorded (with student consent) and made available within your Student Portal for review.' },
      { q: 'What equipment do I need for live online classes?', a: 'A stable, high-speed internet connection (preferably wired), a modern computer, an external microphone (essential for music), and headphones are highly recommended. A good quality webcam and proper lighting are also beneficial. Specific requirements will be provided upon enrollment.' },
    ]
  },
  {
    category: 'Online Instructional Videos',
    icon: <Film className="w-6 h-6 text-pink-500 mr-2" />, 
    questions: [
      { q: 'Do you sell pre-recorded instructional videos?', a: 'Yes, we offer high-quality pre-recorded instructional videos across our music and creative arts disciplines, available for purchase directly on our website.' },
      { q: 'How do I access purchased instructional videos?', a: 'Purchased instructional videos and video courses are accessible anytime through your personalized Student Portal.' },
    ]
  },
  {
    category: 'Peripatetic Music Programs (For Schools)',
    icon: <School className="w-6 h-6 text-orange-500 mr-2" />, 
    questions: [
      { q: 'Do you offer music programs for schools in Nakuru?', a: 'Yes, we offer comprehensive peripatetic (visiting teacher) music programs for schools around Nakuru.' },
      { q: 'What types of programs do you offer for schools?', a: 'We offer individual lessons, small group lessons, whole-class music sessions, and can assist with school ensembles or choirs, covering various instruments and musical disciplines.' },
      { q: 'How are peripatetic programs structured and billed?', a: 'Programs are typically structured with 10 sessions per school term. We charge a termly fee per child. Payment is generally processed by Damon Music Academy directly with parents, ensuring clear financial terms.' },
      { q: 'How do you ensure safety and professionalism in schools?', a: 'All our peripatetic teachers undergo thorough background checks (e.g., Certificate of Good Conduct) and adhere to strict child protection policies. We maintain comprehensive public liability insurance.' },
    ]
  },
  {
    category: 'Curriculum & Examinations',
    icon: <FileText className="w-6 h-6 text-cyan-500 mr-2" />, 
    questions: [
      { q: 'What music examination boards do you follow?', a: 'For instrumental and music theory, we primarily follow the ABRSM, and also offer preparation for LCM (London College of Music) or Trinity College London syllabi. For Music Production, we integrate the RockSchool (RSL Awards) curriculum.' },
      { q: 'Can your programs prepare students for exams?', a: 'Absolutely. Our curriculum is designed to prepare students for practical and theory exams with their chosen board (ABRSM, LCM, or Trinity College), and for RockSchool Music Production exams, with clear milestone projections.' },
      { q: 'Do you offer advanced music theory beyond standard grades?', a: 'Yes, for exceptionally capable students, we introduce advanced music theory concepts that are typically covered in the initial stages of Bachelor of Music programs.' },
    ]
  },
];

const FAQ = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-pink-100 relative flex flex-col">
    <Header />
    <div className="flex-1 pt-32 pb-16 px-4 sm:px-8 lg:px-32">
      <Card className="max-w-4xl mx-auto shadow-2xl border-0 border-l-8 border-primary bg-white/90">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Frequently Asked Questions</CardTitle>
          <p className="text-lg text-muted-foreground mb-4">Find answers to common questions about our programs, enrollment, and more. If you need further assistance, please <a href="mailto:info@damonmusicacademy.co.ke" className="text-blue-600 underline">contact us</a> or use the chat below.</p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-6">
            {faqData.map((section, idx) => (
              <AccordionItem key={section.category} value={section.category} className="border rounded-xl bg-white/95 shadow-md hover:shadow-xl transition-shadow duration-300">
                <AccordionTrigger className="text-xl font-semibold text-blue-900 py-4 px-6 flex items-center gap-2 hover:text-primary focus:text-primary transition-colors">
                  {section.icon}{section.category}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <ul className="space-y-4">
                    {section.questions.map((q, i) => (
                      <li key={i}>
                        <div className="font-medium text-blue-800 mb-1">Q: {q.q}</div>
                        <div className="text-gray-700">A: {q.a}</div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center text-gray-600 text-sm">
            Didn't find your answer? Email <a href="mailto:info@damonmusicacademy.co.ke" className="text-blue-600 underline">info@damonmusicacademy.co.ke</a> or call <a href="tel:+254701195460" className="text-blue-600 underline">+254 701 195 460</a>.
          </div>
        </CardContent>
      </Card>
    </div>
    <WhatsAppChat />
    <Footer />
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Decorative gradients or SVGs can be added here for extra flair */}
    </div>
  </div>
);

export default FAQ; 