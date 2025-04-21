
import { Product, ProductWithStatus } from "@/types/supabase-extensions";
import { toast } from "@/hooks/use-toast";

// Re-export functions from the refactored modules
export { getProducts, getProduct } from "./product/productQueries";
export { updateProduct, addProduct, deleteProduct, decreaseStock } from "./product/productMutations";
export { getProductStockStatus } from "./product/productHelpers";

// Export an online mode flag to control behavior throughout the app
export const ONLINE_MODE = true; // Force online mode to ensure direct Supabase writes

/**
 * Helper function to show toast notifications for product operations
 */
export const showProductToast = (
  type: 'success' | 'error',
  title: string,
  description: string
) => {
  toast({
    variant: type === 'error' ? 'destructive' : 'default',
    title,
    description,
    duration: type === 'error' ? 5000 : 3000, // Show error messages longer
  });
};
