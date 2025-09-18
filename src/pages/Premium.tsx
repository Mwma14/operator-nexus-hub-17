
import { useMemo } from 'react';
import { products, Product } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Premium = () => {
  const navigate = useNavigate();

  // Filter premium products (price >= 50,000 MMK OR Beautiful Numbers category)
  const premiumProducts = useMemo(() => {
    return products.filter((product) =>
    product.price >= 50000 || product.category === 'Beautiful Numbers'
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:text-orange-400 hover:bg-white/10 transition-colors">

            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            Premium Products
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Discover our exclusive collection of premium telecommunications products and services
          </p>
        </div>

        {/* Premium Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {premiumProducts.map((product) =>
          <ProductCard
            key={product.id}
            product={product} />

          )}
        </div>

        {/* No premium products fallback */}
        {premiumProducts.length === 0 &&
        <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-semibold text-white mb-4">
                No Premium Products Available
              </h3>
              <p className="text-white/70 mb-6">
                We're working on bringing you exclusive premium products soon.
              </p>
              <Button
              onClick={() => navigate('/')}
              className="btn-premium">

                Browse All Products
              </Button>
            </div>
          </div>
        }
      </div>
    </div>);

};

export default Premium;