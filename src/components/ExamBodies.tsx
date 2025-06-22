import { Award } from "lucide-react";

const examBodies = [
  {
    name: "ABRSM",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/ABRSM_logo.svg/1200px-ABRSM_logo.svg.png",
    description: "The Associated Board of the Royal Schools of Music is a leading provider of music exams and assessments, offering graded music exams, diplomas, and assessments.",
  },
  {
    name: "LCM",
    logoUrl: "https://centrestagedance.org/wp-content/uploads/2016/11/lcm-logo.jpeg",
    description: "London College of Music Examinations is an international examinations board offering graded and diploma qualifications in music, drama, and communication.",
  },
  {
    name: "Rockschool",
    logoUrl: "https://mandm.academy/wp-content/uploads/2020/10/rockschool-logo-1.jpg",
    description: "RSL Awards is a leading global provider of contemporary music and performance arts qualifications, covering a range of popular genres and instruments.",
  },
];

const ExamBodies = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full text-sm mb-4">
            <Award className="w-5 h-5" />
            Examining Bodies
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Globally Recognized Certifications
          </h2>
          <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-600">
            We are proud to prepare our students for examinations with the world's leading music and performance arts exam boards, opening doors to global opportunities.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {examBodies.map((body) => (
            <div key={body.name} className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center group">
              <div className="h-20 md:h-24 flex items-center justify-center mb-6">
                <img src={body.logoUrl} alt={`${body.name} logo`} className="max-h-14 md:max-h-16 object-contain transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{body.name}</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">{body.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamBodies;
