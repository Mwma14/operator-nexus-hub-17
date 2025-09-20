import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ProductListing from "@/components/ProductListing";

const Index = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    const operator = searchParams.get('operator');
    
    if (scrollTo === 'products') {
      setTimeout(() => {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100); // Small delay to ensure component is rendered
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner />
      <div id="products-section">
        <ProductListing />
      </div>
    </div>
  );
};

export default Index;