
import React from "react";
import { Product } from "@/types/supabase-extensions";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image } from "lucide-react";

interface ProductSearchItemProps {
  product: Product;
  onAddToCart: (product: Product, size?: string) => void;
}

export const ProductSearchItem = ({ product, onAddToCart }: ProductSearchItemProps) => {
  const hasSizes = product.sizes_stock && Object.keys(product.sizes_stock).length > 0;
  
  const handleAddToCart = () => {
    if (!hasSizes) {
      onAddToCart(product);
    }
  };

  const handleSizeSelect = (selectedSize: string) => {
    onAddToCart(product, selectedSize);
  };

  return (
    <div className="flex items-center justify-between border rounded p-2 gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 relative rounded overflow-hidden bg-gray-100">
          <AspectRatio ratio={1}>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </AspectRatio>
        </div>
        <div>
          <div className="font-semibold">{product.name}</div>
          <div className="text-xs text-gray-500">
            {product.brand} • {product.category}
          </div>
          <div className="text-sm font-medium mt-1">
            ${product.price.toFixed(2)}
          </div>
        </div>
      </div>
      <div>
        {hasSizes ? (
          <div className="flex flex-col gap-2">
            {Object.entries(product.sizes_stock).map(([size, stock]) => (
              <Button
                key={size}
                size="sm"
                onClick={() => handleSizeSelect(size)}
                disabled={stock <= 0}
                variant="outline"
                className="w-20"
              >
                {size} ({stock})
              </Button>
            ))}
          </div>
        ) : (
          <Button 
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? "Add" : "Out of Stock"}
          </Button>
        )}
      </div>
    </div>
  );
};

