
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch sales dashboard stats from Supabase's `bills` table in real-time.
 * Returns { totalSales, todaySales, lowStockItems, outOfStockItems, topSellingProducts }
 */
export const getDashboardStats = async () => {
  // Fetch total sales
  const { data: totalSalesData, error: totalSalesError } = await supabase
    .from("bills")
    .select("total, created_at")
    .gte("status", "completed");

  if (totalSalesError) throw totalSalesError;

  const allBills: { total: number, created_at: string }[] = totalSalesData || [];

  // Compute total sales sum
  const totalSales = allBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

  // Today's sales
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const todayBills = allBills.filter(
    (bill) => bill.created_at && bill.created_at.startsWith(todayISO)
  );
  const todaySales = todayBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

  // Low stock/out of stock - get from products table
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("stock, low_stock_threshold");

  if (productsError) throw productsError;

  const lowStockItems = (products || []).filter(
    (p) => typeof p.stock === "number" && typeof p.low_stock_threshold === "number" && 
        p.stock <= p.low_stock_threshold && p.stock > 0
  ).length;

  const outOfStockItems = (products || []).filter(
    (p) => typeof p.stock === "number" && p.stock === 0
  ).length;

  // Top selling products (find products most frequently appearing in bill_items)
  const { data: billItems, error: billItemsError } = await supabase
    .from("bill_items")
    .select("product_id, product_name, quantity");

  if (billItemsError) throw billItemsError;

  // Compute counts by product
  const productSales: Record<string, { name: string; soldCount: number }> = {};
  (billItems || []).forEach((item: any) => {
    if (!item.product_id) return;
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = { name: item.product_name, soldCount: 0 };
    }
    productSales[item.product_id].soldCount += item.quantity || 0;
  });
  const topSellingProducts = Object.entries(productSales)
    .sort((a, b) => b[1].soldCount - a[1].soldCount)
    .slice(0, 5)
    .map(([id, d]) => ({
      product: {
        id,
        name: d.name,
        // Optionally fetch more info like image/brand if needed
      },
      soldCount: d.soldCount,
    }));

  return {
    totalSales,
    todaySales,
    lowStockItems,
    outOfStockItems,
    topSellingProducts,
  };
};
