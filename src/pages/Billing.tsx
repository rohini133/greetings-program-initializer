import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductSearch } from "@/components/billing/ProductSearch";
import { ShoppingCart } from "@/components/billing/ShoppingCart";
import { CheckoutDialog } from "@/components/billing/CheckoutDialog";
import { useToast } from "@/hooks/use-toast";
import { useBillingCart } from "@/hooks/useBillingCart";
import { createBill } from "@/services/billService";
import { BillWithItems, Product } from "@/types/supabase-extensions";
import { useProductsSync } from "@/hooks/useProductsSync";
import { getProductStockStatus } from "@/services/product/productHelpers";

function Billing() {
  const { toast } = useToast();
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [billCreated, setBillCreated] = useState<BillWithItems | null>(null);
  const { products, isLoading, error, refetchProducts } = useProductsSync();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    discountAmount,
    discountType,
    discountValue,
    applyDiscount,
    removeDiscount,
    updateStock,
  } = useBillingCart();

  useEffect(() => {
    if (error) {
      toast({
        title: "Sync Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to the cart before checking out.",
      });
      return;
    }
    try {
      const billData = {
        cartItems: cartItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        paymentMethod: paymentMethod,
        discountAmount: discountAmount,
        discountType: discountType,
        discountValue: discountValue,
      };
      
      console.log("Creating bill with customer info:", {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email
      });
      
      const newBill = await createBill(billData);
      console.log("Bill created with customer info:", {
        name: newBill.customerName,
        phone: newBill.customerPhone,
        email: newBill.customerEmail
      });
      
      // Update stock for all cart items
      const stockUpdatePromises = cartItems.map(item => updateStock(item));
      
      try {
        await Promise.all(stockUpdatePromises);
        console.log("All stock updates completed successfully");
        
        // Refresh products list to update UI with new stock values
        await refetchProducts();
      } catch (stockError) {
        console.error("Error updating stock:", stockError);
        toast({
          title: "Stock Update Warning",
          description: "Bill was created but there was an issue updating inventory. Please check stock levels.",
          variant: "destructive",
        });
      }
      
      setBillCreated(newBill);
      clearCart();
      setIsCheckoutDialogOpen(true);
      toast({
        title: "Bill created",
        description: `Bill #${newBill.id} created successfully.`,
      });
    } catch (error: any) {
      console.error("Bill creation error:", error);
      toast({
        title: "Bill creation failed",
        description: error.message || "Failed to create bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (product: Product, size?: string) => {
    if (getProductStockStatus(product) === "out-of-stock") {
      toast({
        title: "Cannot add to cart",
        description: `${product.name} is out of stock.`,
        variant: "destructive",
      });
      return;
    }
    if (
      product.sizes_stock &&
      Object.keys(product.sizes_stock).length > 0 &&
      !size
    ) {
      toast({
        title: "Size required",
        description: "Please select a size for this product.",
        variant: "destructive",
      });
      return;
    }
    if (
      size &&
      product.sizes_stock &&
      (product.sizes_stock[size] === undefined || product.sizes_stock[size] <= 0)
    ) {
      toast({
        title: "Size out of stock",
        description: `${product.name} in size ${size} is out of stock.`,
        variant: "destructive",
      });
      return;
    }
    addToCart(product, size);
    toast({
      title: "Added to cart",
      description: `${product.name}${size ? ` (${size})` : ""} added to cart.`,
    });
  };

  return (
    <PageContainer title="Billing" subtitle="Create and manage bills">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ProductSearch onAddToCart={handleAddToCart} />
          {isLoading && <div>Loading products...</div>}
          {error && <div>Error: {error}</div>}
        </div>
        <div>
          <ShoppingCart
            cartItems={cartItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            discountAmount={discountAmount}
            discountType={discountType}
            discountValue={discountValue}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onApplyDiscount={applyDiscount}
            onRemoveDiscount={removeDiscount}
            onCheckout={handleCheckout}
            customerInfo={customerInfo}
            onCustomerInfoChange={setCustomerInfo}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        </div>
      </div>
      <CheckoutDialog
        open={isCheckoutDialogOpen}
        onOpenChange={(open) => setIsCheckoutDialogOpen(open)}
        bill={billCreated}
        subtotal={subtotal}
        tax={tax}
        total={total}
        discountAmount={discountAmount}
        discountType={discountType}
        discountValue={discountValue}
        customerInfo={customerInfo}
        onCustomerInfoChange={setCustomerInfo}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onCreateBill={() => {}}
      />
    </PageContainer>
  );
}

export default Billing;
