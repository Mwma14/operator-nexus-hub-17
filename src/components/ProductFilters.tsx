import { Button } from "@/components/ui/button";
import { operators, categories, type Operator, type Category } from "@/lib/products";

interface ProductFiltersProps {
  selectedOperator: string | null;
  selectedCategory: string | null;
  onOperatorChange: (operator: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

const ProductFilters = ({
  selectedOperator,
  selectedCategory,
  onOperatorChange,
  onCategoryChange
}: ProductFiltersProps) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Operator Filters */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Filter by Operator</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={selectedOperator === null ? "default" : "outline"}
            onClick={() => onOperatorChange(null)}
            className={selectedOperator === null ? "bg-primary text-primary-foreground" : ""}
          >
            All
          </Button>
          {operators.map((operator) => (
            <Button
              key={operator}
              variant={selectedOperator === operator ? "default" : "outline"}
              onClick={() => onOperatorChange(operator)}
              className={selectedOperator === operator ? "bg-primary text-primary-foreground" : ""}
            >
              {operator}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Filter by Category</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => onCategoryChange(null)}
            className={selectedCategory === null ? "bg-primary text-primary-foreground" : ""}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => onCategoryChange(category)}
              className={selectedCategory === category ? "bg-primary text-primary-foreground" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;