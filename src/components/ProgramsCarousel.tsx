import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Music, Mic, Camera, MonitorPlay } from "lucide-react";

const programs = [
  {
    icon: Music,
    color: "from-primary to-accent",
    title: "Instrumental Music & Music Theory",
    description:
      "Personalized one-on-one lessons in piano, violin, guitar, voice, and more. We prepare students for prestigious international exams like ABRSM, LCM, and Rockschool, setting the stage for global recognition.",
  },
  {
    icon: Mic,
    color: "from-accent to-secondary",
    title: "Music Production",
    description:
      "Dive into the exciting world of recording, mixing, mastering, and creative sound design.",
  },
  {
    icon: Camera,
    color: "from-secondary to-primary",
    title: "Videography & Photography",
    description:
      "Learn to tell powerful stories through images and film, from capturing moments to professional editing.",
  },
  {
    icon: MonitorPlay,
    color: "from-primary to-secondary",
    title: "Live Sound",
    description:
      "Get hands-on experience with event sound setup, mixer operation, and live broadcasting.",
  },
];

export function ProgramsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % programs.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-4 md:gap-6 lg:gap-8 transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
          width: `${(programs.length * 100) / cardsPerView}%`,
        }}
      >
        {programs.map((program, index) => (
          <div
            key={program.title}
            className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2"
          >
            <Card className="bg-gradient-to-br from-white to-gray-50/80 border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300 flex flex-col items-center text-center group h-full min-h-[220px] md:min-h-[240px] lg:min-h-[250px] p-4 md:p-5 lg:p-6">
              <div className="mb-3 flex items-center justify-center w-full">
                <div className={`mx-auto p-3 bg-gradient-to-r ${program.color} rounded-full w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <program.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{program.title}</h3>
              <div className="w-8 mx-auto border-b-2 border-primary/20 my-2" />
              <p className="text-gray-600 text-sm leading-relaxed">{program.description}</p>
            </Card>
          </div>
        ))}
      </div>
      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 md:mt-8 space-x-2">
        {programs.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-primary scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 