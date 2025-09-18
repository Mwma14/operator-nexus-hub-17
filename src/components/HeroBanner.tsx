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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient">
      {/* Floating gradient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Title */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 font-space-grotesk leading-tight">
            Discover Operator
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Products
            </span>
          </h1>
        </div>

        {/* Premium description card */}
        <div className="relative mx-auto max-w-2xl mb-12">
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-amber-400 mr-3" />
              <span className="text-amber-400 font-semibold text-lg">Premium Network</span>
            </div>
            <p className="text-xl text-gray-200 leading-relaxed">
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
            className="btn-premium text-xl px-12 py-8 rounded-2xl font-semibold group">

            Buy Now
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>);

};

export default HeroBanner;