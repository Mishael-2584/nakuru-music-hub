import { Award } from "lucide-react";
import { useEffect, useState } from "react";

const examBodies = [
  {
    name: "ABRSM",
    logoUrl: "https://www.abrsm.org/media/abrsm-logo.png",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/ABRSM_logo.svg/1200px-ABRSM_logo.svg.png",
    description: "The Associated Board of the Royal Schools of Music is a leading provider of music exams and assessments, offering graded music exams, diplomas, and assessments.",
  },
  {
    name: "LCM",
    logoUrl: "https://www.uwl.ac.uk/sites/default/files/styles/medium/public/2018-08/lcm-logo.png",
    fallbackUrl: "https://centrestagedance.org/wp-content/uploads/2016/11/lcm-logo.jpeg",
    description: "London College of Music Examinations is an international examinations board offering graded and diploma qualifications in music, drama, and communication.",
  },
  {
    name: "Rockschool",
    logoUrl: "https://www.rslawards.com/wp-content/uploads/2020/03/rsl-awards-logo.png",
    fallbackUrl: "https://mandm.academy/wp-content/uploads/2020/10/rockschool-logo-1.jpg",
    description: "RSL Awards is a leading global provider of contemporary music and performance arts qualifications, covering a range of popular genres and instruments.",
  },
  {
    name: "Trinity College London",
    logoUrl: "https://www.trinitycollege.com/images/trinity_college_london_logo.png",
    fallbackUrl: "https://www.trinitycollege.com/images/trinity_college_london_logo.png",
    description: "Trinity College London is a leading international exam board and independent education charity that promotes and advances the arts, offering qualifications in music, drama, and communication.",
  },
];

const ExamBodies = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2); // Tablet: 2 cards
      } else {
        setCardsPerView(3); // Desktop: 3 cards
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % examBodies.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

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
        
        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div 
            className="flex gap-4 md:gap-6 lg:gap-8 transition-transform duration-1000 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              width: `${(examBodies.length * 100) / cardsPerView}%`
            }}
          >
            {examBodies.map((body, index) => (
              <div 
                key={`${body.name}-${index}`} 
                className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2"
              >
                <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center group h-full min-h-[260px] md:min-h-[300px] lg:min-h-[320px]">
                  <div className="h-20 md:h-20 lg:h-24 flex items-center justify-center mb-3 md:mb-6 flex-shrink-0 w-full px-2">
                    {/* Desktop: Show image logos */}
                    <img 
                      src={body.logoUrl} 
                      alt={`${body.name} logo`} 
                      className="max-h-20 md:max-h-14 lg:max-h-16 object-contain transition-transform duration-300 group-hover:scale-105 hidden md:block" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (body.fallbackUrl && target.src !== body.fallbackUrl) {
                          target.src = body.fallbackUrl;
                        }
                      }}
                    />
                    {/* Mobile: Show text-based logo */}
                    <div className="md:hidden flex items-center justify-center w-full">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 border border-gray-300 max-w-[180px] w-full">
                        <span className="text-gray-700 font-semibold text-xs text-center block leading-tight">
                          {body.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base md:text-xl lg:text-2xl font-bold text-gray-800 mb-2 md:mb-3">{body.name}</h3>
                  <p className="text-gray-600 leading-relaxed text-xs md:text-sm lg:text-base">{body.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-6 md:mt-8 space-x-2">
          {examBodies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamBodies;
