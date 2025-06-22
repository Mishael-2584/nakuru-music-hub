import Header from "@/components/Header";
import Registration from "@/components/Registration";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";

const RegistrationPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Registration />
      </main>
      <Footer />
      <WhatsAppChat />
    </div>
  );
};

export default RegistrationPage; 