import { useState, useMemo, useEffect } from "react";
import { type Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import LoadingSpinner from "./LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PurchaseDialog from "./PurchaseDialog";
import { useNavigate } from "react-router-dom";

const ProductListing = () => {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
    fetchProducts();
  }, []);

  // Scroll to products section when filters are applied
  useEffect(() => {
    if (selectedOperator || selectedCategory) {
      const productsSection = document.getElementById('products-grid');
      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [selectedOperator, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await window.ezsite.apis.tablePage(44172, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'created_at',
        IsAsc: false,
        Filters: [
        {
          name: 'is_active',
          op: 'Equal',
          value: true
        }]

      });

      if (error) throw new Error(error);
      setProducts(data?.List || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const userResponse = await window.ezsite.apis.getUserInfo();
      if (userResponse.error) {
        setIsAuthenticated(false);
        setUserBalance(0);
      } else {
        setIsAuthenticated(true);
        await loadUserBalance(userResponse.data.ID);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUserBalance(0);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadUserBalance = async (userId: number) => {
    try {
      const profileResponse = await window.ezsite.apis.tablePage(44173, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        {
          name: "user_id",
          op: "Equal",
          value: userId
        }]

      });

      if (!profileResponse.error && profileResponse.data.List.length > 0) {
        setUserBalance(profileResponse.data.List[0].credits_balance || 0);
      } else {
        // Create initial profile with 0 balance
        const userInfoResponse = await window.ezsite.apis.getUserInfo();
        if (!userInfoResponse.error) {
          await window.ezsite.apis.tableCreate(44173, {
            user_id: userId,
            email: userInfoResponse.data.Email,
            full_name: userInfoResponse.data.Name || '',
            credits_balance: 0,
            phone_number: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setUserBalance(0);
        }
      }
    } catch (error) {
      console.error('Failed to load user balance:', error);
      setUserBalance(0);
    }
  };

  const handleProductSelect = (product: Product) => {
    try {
      setSelectedProduct(selectedProduct?.id === product.id ? null : product);
    } catch (error) {
      console.error('Error selecting product:', error);
      toast({
        title: "Error selecting product",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePurchase = async (product: Product) => {
    if (checkingAuth) {
      toast({
        title: "Please wait",
        description: "Checking authentication status..."
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase products.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    setSelectedProduct(product);
    setIsPurchaseDialogOpen(true);
  };

  const handlePurchaseComplete = (newBalance: number) => {
    setUserBalance(newBalance);
    setIsPurchaseDialogOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesOperator = !selectedOperator || product.operator === selectedOperator;
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesOperator && matchesCategory;
    });
  }, [selectedOperator, selectedCategory]);

  return (
    <section id="premium-products" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 font-space-grotesk">
            Premium Products
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Choose from our curated selection of telecom products from Myanmar's leading network operators
          </p>
          {isAuthenticated &&
          <div className="mt-6 flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-6 py-3 rounded-xl border border-blue-500/30">
                <span className="text-sm font-medium">Current Balance:</span>
                <span className="font-bold">{userBalance.toLocaleString()} MMK</span>
              </div>
              <Button
              onClick={() => {
                toast({
                  title: "Buy Credit",
                  description: "Credit purchase feature coming soon!"
                });
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">

                Buy Credit
              </Button>
            </div>
          }
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
        <div id="products-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingProducts ?
          <div className="col-span-full flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div> :

          filteredProducts.map((product) =>
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProduct?.id === product.id}
            onSelect={handleProductSelect}
            onPurchase={handlePurchase} />
          )
          }
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

        <PurchaseDialog
          isOpen={isPurchaseDialogOpen}
          onClose={() => {
            setIsPurchaseDialogOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          userBalance={userBalance}
          onPurchaseComplete={handlePurchaseComplete} />

      </div>
    </section>);

};

export default ProductListing;