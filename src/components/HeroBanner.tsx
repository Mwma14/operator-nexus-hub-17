import { ArrowRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroBanner = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-pattern" />
      
      {/* Floating Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-primary/15 rounded-full blur-2xl pulse-glow" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 font-space-grotesk">
          Discover Operator
          <span className="block text-primary">Products</span>
        </h1>

        {/* Animated SIM Card Network Indicator */}
        <div className="relative mx-auto mb-12 w-64 h-32 flex items-center justify-center">
          <div className="sim-wave">
            <Smartphone className="h-16 w-16 text-primary" />
          </div>
          {/* Signal waves */}
          <div className="absolute top-4 right-8 flex space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full"
                style={{
                  height: `${i * 6}px`,
                  animation: `pulse 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Description in Blurred Container */}
        <div className="relative mx-auto max-w-2xl mb-12">
          <div className="absolute inset-0 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50" />
          <div className="relative p-8">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              All your favorite telecom products in one place. Data packages, minutes, 
              points and beautiful numbers from MPT, OOREDOO, ATOM, and MYTEL.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          size="lg" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-xl group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
        >
          Buy Now
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};

export default HeroBanner;