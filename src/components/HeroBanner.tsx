import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroBanner = () => {
  const handleBuyNow = () => {
    const premiumSection = document.getElementById('premium-products');
    if (premiumSection) {
      premiumSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden mesh-gradient py-8 md:py-16">
      {/* Floating gradient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-3 md:mb-4 font-space-grotesk leading-tight">
            Discover Operator
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Products
            </span>
          </h1>
        </div>

        {/* Premium description card */}
        <div className="relative mx-auto max-w-2xl mb-8 md:mb-12">
          <div className="glass-card rounded-2xl md:rounded-3xl p-4 md:p-8">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-amber-400 mr-2 md:mr-3" />
              <span className="text-amber-400 font-semibold text-base md:text-lg">Premium Network</span>
            </div>
            <p className="text-base md:text-xl text-gray-200 leading-relaxed">
              All your favorite telecom products from MPT, Ooredoo, Atom, and MyTel in one place. 
              Instantly top-up data, minutes, and more.
            </p>
          </div>
        </div>

        {/* Premium CTA Button */}
        <div className="relative">
          <Button
            size="lg"
            onClick={handleBuyNow}
            className="btn-premium text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-xl md:rounded-2xl font-semibold group">

            Buy Now
            <ArrowRight className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>);

};

export default HeroBanner;