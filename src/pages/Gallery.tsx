import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Camera } from "lucide-react";

const images = [
  { src: "/lovable-uploads/29861c9f-1df3-42f1-982f-ef38574fb617.png", alt: "A vibrant classroom of young students learning music theory." },
  { src: "/lovable-uploads/cc2f7a6b-1ce1-4921-a0b6-b29db99b5d4a.png", alt: "A student practicing guitar with an instructor." },
  { src: "/lovable-uploads/31a53eab-3aed-45c3-b91e-339ed5bb7893.png", alt: "A young girl smiling while playing the piano." },
  { src: "/lovable-uploads/70f23f35-6eb2-49a1-8bf6-677fe0c49746.png", alt: "A group of students performing together on stage." },
  { src: "/about-art-class.jpg", alt: "An art class in session with a teacher guiding a young student." },
  { src: "/about-happy-kids.jpg", alt: "A group of happy Damon Music Academy students posing outdoors." },
  { src: "/lovable-uploads/SMC02260.png", alt: "A student receiving one-on-one violin instruction." },
  { src: "/lovable-uploads/_MWS4407.png", alt: "A young student concentrating during a piano lesson." },
];

const Gallery = () => {
  return (
    <div className="bg-gray-50">
      <Header />
      
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full text-sm mb-4">
              <Camera className="w-5 h-5" />
              Our Gallery
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Moments from Our Creative Journey
            </h1>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-600">
              Explore the vibrant life at Damon Music Academy. A collection of our students' performances, classes, and special moments.
            </p>
          </div>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {images.map((image, index) => (
              <img
                key={index}
                className="w-full h-auto object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"
                src={image.src}
                alt={image.alt}
              />
            ))}
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Want to see more?</h3>
            <p className="text-gray-600">Follow us on social media for the latest updates, photos, and videos!</p>
            {/* You can add your SocialMedia component here if you have one */}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
