import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ProductListing from "@/components/ProductListing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner />
      <ProductListing />
    </div>
  );
};

export default Index;
