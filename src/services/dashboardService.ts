
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/data/models";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks, subYears, format } from "date-fns";

interface SalesDataPoint {
  label: string;
  sales: number;
}

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

export const getDailySalesData = async (): Promise<SalesDataPoint[]> => {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  
  const { data: bills, error } = await supabase
    .from('bills')
    .select('total, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .lte('created_at', today.toISOString())
    .eq('status', 'completed');

  if (error) throw error;

  const dailyTotals: Record<string, number> = {};
  
  // Initialize all days in the last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dayKey = format(date, 'MMM dd');
    dailyTotals[dayKey] = 0;
  }

  // Aggregate sales by day
  bills?.forEach((bill) => {
    const day = format(new Date(bill.created_at), 'MMM dd');
    dailyTotals[day] = (dailyTotals[day] || 0) + Number(bill.total);
  });

  // Convert to array format required by chart
  return Object.entries(dailyTotals)
    .map(([day, total]) => ({
      label: day,
      sales: total
    }))
    .reverse();
};

export const getWeeklySalesData = async (): Promise<SalesDataPoint[]> => {
  const today = new Date();
  const twelveWeeksAgo = subWeeks(today, 12);
  
  const { data: bills, error } = await supabase
    .from('bills')
    .select('total, created_at')
    .gte('created_at', twelveWeeksAgo.toISOString())
    .lte('created_at', today.toISOString())
    .eq('status', 'completed');

  if (error) throw error;

  const weeklyTotals: Record<string, number> = {};
  
  // Initialize all weeks with 0
  for (let i = 0; i < 12; i++) {
    const weekStart = subWeeks(today, i);
    const weekLabel = `Week ${format(weekStart, 'dd MMM')}`;
    weeklyTotals[weekLabel] = 0;
  }

  // Aggregate sales by week
  bills?.forEach((bill) => {
    const billDate = new Date(bill.created_at);
    const weekStart = startOfWeek(billDate);
    const weekLabel = `Week ${format(weekStart, 'dd MMM')}`;
    weeklyTotals[weekLabel] = (weeklyTotals[weekLabel] || 0) + Number(bill.total);
  });

  return Object.entries(weeklyTotals)
    .map(([week, total]) => ({
      label: week,
      sales: total
    }))
    .reverse();
};

export const getMonthlySalesData = async (): Promise<SalesDataPoint[]> => {
  const today = new Date();
  const startOfLastYear = startOfYear(subYears(today, 1));
  
  const { data: bills, error } = await supabase
    .from('bills')
    .select('total, created_at')
    .gte('created_at', startOfLastYear.toISOString())
    .lte('created_at', today.toISOString())
    .eq('status', 'completed');

  if (error) throw error;

  const monthlyTotals: Record<string, number> = {};
  
  // Initialize all months with 0
  for (let i = 0; i < 12; i++) {
    const month = format(subMonths(today, i), 'MMM');
    monthlyTotals[month] = 0;
  }

  // Aggregate sales by month
  bills?.forEach((bill) => {
    const month = format(new Date(bill.created_at), 'MMM');
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(bill.total);
  });

  return Object.entries(monthlyTotals)
    .map(([month, total]) => ({
      label: month,
      sales: total
    }))
    .reverse();
};

export const getYearlySalesData = async (): Promise<SalesDataPoint[]> => {
  const today = new Date();
  const fiveYearsAgo = subYears(today, 5);
  
  const { data: bills, error } = await supabase
    .from('bills')
    .select('total, created_at')
    .gte('created_at', fiveYearsAgo.toISOString())
    .lte('created_at', today.toISOString())
    .eq('status', 'completed');

  if (error) throw error;

  const yearlyTotals: Record<string, number> = {};
  
  // Initialize last 5 years with 0
  for (let i = 0; i < 5; i++) {
    const year = format(subYears(today, i), 'yyyy');
    yearlyTotals[year] = 0;
  }

  // Aggregate sales by year
  bills?.forEach((bill) => {
    const year = format(new Date(bill.created_at), 'yyyy');
    yearlyTotals[year] = (yearlyTotals[year] || 0) + Number(bill.total);
  });

  return Object.entries(yearlyTotals)
    .map(([year, total]) => ({
      label: year,
      sales: total
    }))
    .reverse();
};
