import { useState, useMemo } from "react";
import { products, type Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import LoadingSpinner from "./LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const ProductListing = () => {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesOperator = !selectedOperator || product.operator === selectedOperator;
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesOperator && matchesCategory;
    });
  }, [selectedOperator, selectedCategory]);

  const handleProductSelect = (product: Product) => {
    try {
      setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    } catch (error) {
      console.error('Error selecting product:', error);
      toast({
        title: "Error selecting product",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 font-space-grotesk">
            Premium Products
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Choose from our curated selection of telecom products from Myanmar's leading network operators
          </p>
        </div>

        {/* Filters */}
        <ProductFilters
          selectedOperator={selectedOperator}
          selectedCategory={selectedCategory}
          onOperatorChange={setSelectedOperator}
          onCategoryChange={setSelectedCategory} />


        {/* Results Count */}
        <div className="mb-8">
          <p className="text-white/60 text-lg">
            Showing {filteredProducts.length} premium product{filteredProducts.length !== 1 ? 's' : ''}
            {selectedOperator && ` from ${selectedOperator}`}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) =>
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={handleProductSelect} />

          )}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 &&
        <div className="text-center py-20">
            <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
              <p className="text-xl text-white/80 mb-4">
                No products found matching your criteria
              </p>
              <button
              onClick={() => {
                setSelectedOperator(null);
                setSelectedCategory(null);
              }}
              className="btn-premium px-8 py-3 rounded-xl font-semibold">

                Clear all filters
              </button>
            </div>
          </div>
        }
      </div>
    </section>);

};

export default ProductListing;