import { useState, useMemo } from "react";
import { products, type Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";

const ProductListing = () => {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesOperator = !selectedOperator || product.operator === selectedOperator;
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesOperator && matchesCategory;
    });
  }, [selectedOperator, selectedCategory]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(selectedProduct?.id === product.id ? null : product);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4 font-space-grotesk">
            Available Products
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our wide selection of telecom products from leading operators
          </p>
        </div>

        {/* Filters */}
        <ProductFilters
          selectedOperator={selectedOperator}
          selectedCategory={selectedCategory}
          onOperatorChange={setSelectedOperator}
          onCategoryChange={setSelectedCategory}
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            {selectedOperator && ` from ${selectedOperator}`}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
              onSelect={handleProductSelect}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No products found matching your criteria
            </p>
            <button
              onClick={() => {
                setSelectedOperator(null);
                setSelectedCategory(null);
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductListing;