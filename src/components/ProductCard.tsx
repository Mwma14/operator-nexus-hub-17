import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/lib/products";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
}

const ProductCard = ({ product, isSelected = false, onSelect }: ProductCardProps) => {
  const operatorColors = {
    MPT: "bg-blue-600",
    OOREDOO: "bg-red-600", 
    ATOM: "bg-green-600",
    MYTEL: "bg-purple-600"
  };

  return (
    <Card 
      className={`
        relative transition-all duration-300 cursor-pointer group
        ${isSelected 
          ? 'border-primary shadow-lg shadow-primary/20 selection-corners' 
          : 'border-border hover:border-border/70 hover:shadow-md'
        }
        bg-card hover:bg-card/80
      `}
      onClick={() => onSelect?.(product)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-3 h-3 rounded-full ${operatorColors[product.operator]}`} />
          <span className="text-xs text-muted-foreground font-medium">
            {product.operator}
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-primary">
              {product.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              {product.currency}
            </span>
          </div>
          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 group-hover:shadow-md transition-all"
          onClick={(e) => {
            e.stopPropagation();
            // Handle purchase logic here
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Purchase
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;