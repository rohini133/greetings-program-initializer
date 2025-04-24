import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/data/models";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks, subYears, format } from "date-fns";

interface SalesDataPoint {
  label: string;
  sales: number;
}

export const getDashboardStats = async () => {
  console.log("Fetching dashboard stats...");
  try {
    // Fetch total sales
    const { data: totalSalesData, error: totalSalesError } = await supabase
      .from("bills")
      .select("total, created_at")
      .gte("status", "completed");

    if (totalSalesError) {
      console.error("Error fetching total sales:", totalSalesError);
      throw totalSalesError;
    }

    const allBills: { total: number, created_at: string }[] = totalSalesData || [];
    console.log(`Retrieved ${allBills.length} bills for total sales`);

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

    if (productsError) {
      console.error("Error fetching products:", productsError);
      throw productsError;
    }

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

    if (billItemsError) {
      console.error("Error fetching bill items:", billItemsError);
      throw billItemsError;
    }

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

    console.log("Dashboard stats fetched successfully");
    return {
      totalSales,
      todaySales,
      lowStockItems,
      outOfStockItems,
      topSellingProducts,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw error;
  }
};

export const getDailySalesData = async (): Promise<SalesDataPoint[]> => {
  console.log("Fetching daily sales data...");
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (error) {
      console.error("Error fetching daily sales data:", error);
      throw error;
    }

    console.log(`Retrieved ${bills?.length || 0} bills for daily sales data`);
    
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
    const result = Object.entries(dailyTotals)
      .map(([day, total]) => ({
        label: day,
        sales: total
      }))
      .reverse();
      
    console.log("Daily sales data processed successfully");
    return result;
  } catch (error) {
    console.error("Error in getDailySalesData:", error);
    throw error;
  }
};

export const getWeeklySalesData = async (): Promise<SalesDataPoint[]> => {
  console.log("Fetching weekly sales data...");
  try {
    const today = new Date();
    const twelveWeeksAgo = subWeeks(today, 12);
    
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total, created_at')
      .gte('created_at', twelveWeeksAgo.toISOString())
      .lte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (error) {
      console.error("Error fetching weekly sales data:", error);
      throw error;
    }

    console.log(`Retrieved ${bills?.length || 0} bills for weekly sales data`);
    
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

    const result = Object.entries(weeklyTotals)
      .map(([week, total]) => ({
        label: week,
        sales: total
      }))
      .reverse();
      
    console.log("Weekly sales data processed successfully");
    return result;
  } catch (error) {
    console.error("Error in getWeeklySalesData:", error);
    throw error;
  }
};

export const getMonthlySalesData = async (): Promise<SalesDataPoint[]> => {
  console.log("Fetching monthly sales data...");
  try {
    const today = new Date();
    const startOfLastYear = startOfYear(subYears(today, 1));
    
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total, created_at')
      .gte('created_at', startOfLastYear.toISOString())
      .lte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (error) {
      console.error("Error fetching monthly sales data:", error);
      throw error;
    }

    console.log(`Retrieved ${bills?.length || 0} bills for monthly sales data`);
    
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

    const result = Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        label: month,
        sales: total
      }))
      .reverse();
      
    console.log("Monthly sales data processed successfully");
    return result;
  } catch (error) {
    console.error("Error in getMonthlySalesData:", error);
    throw error;
  }
};

export const getYearlySalesData = async (): Promise<SalesDataPoint[]> => {
  console.log("Fetching yearly sales data...");
  try {
    const today = new Date();
    const fiveYearsAgo = subYears(today, 5);
    
    const { data: bills, error } = await supabase
      .from('bills')
      .select('total, created_at')
      .gte('created_at', fiveYearsAgo.toISOString())
      .lte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (error) {
      console.error("Error fetching yearly sales data:", error);
      throw error;
    }

    console.log(`Retrieved ${bills?.length || 0} bills for yearly sales data`);
    
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

    const result = Object.entries(yearlyTotals)
      .map(([year, total]) => ({
        label: year,
        sales: total
      }))
      .reverse();
      
    console.log("Yearly sales data processed successfully");
    return result;
  } catch (error) {
    console.error("Error in getYearlySalesData:", error);
    throw error;
  }
};

export const getSalesData = async (dateRange: { from: Date, to: Date }) => {
  console.log("Fetching sales data for date range:", dateRange);
  
  try {
    // Fetch bills and related items for the date range
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select(`
        *,
        items:bill_items(
          quantity,
          product_id,
          product_name,
          product_price,
          products(
            id,
            name,
            category,
            brand,
            buying_price
          )
        )
      `)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .eq('status', 'completed');

    if (billsError) throw billsError;

    // Process sales by category
    const categorySales: Record<string, number> = {};
    const productSales: Record<string, { 
      quantity: number;
      revenue: number;
      profit: number;
      name: string;
      category: string;
      brand: string;
      buyingPrice: number;
      sellingPrice: number;
      lastSoldAt: string; // Added lastSoldAt field
    }> = {};

    bills?.forEach(bill => {
      bill.items?.forEach((item: any) => {
        if (!item.products) return;
        
        const product = item.products;
        const category = product.category || 'Uncategorized';
        const quantity = item.quantity || 0;
        const sellingPrice = item.product_price || 0;
        const buyingPrice = product.buying_price || 0;
        
        // Update category sales
        categorySales[category] = (categorySales[category] || 0) + (quantity * sellingPrice);
        
        // Update product sales
        if (!productSales[product.id]) {
          productSales[product.id] = {
            quantity: 0,
            revenue: 0,
            profit: 0,
            name: product.name,
            category: category,
            brand: product.brand || 'Unknown',
            buyingPrice,
            sellingPrice,
            lastSoldAt: bill.created_at // Initialize with first sale date
          };
        }
        
        productSales[product.id].quantity += quantity;
        productSales[product.id].revenue += quantity * sellingPrice;
        productSales[product.id].profit += quantity * (sellingPrice - buyingPrice);
        // Update lastSoldAt if this sale is more recent
        if (new Date(bill.created_at) > new Date(productSales[product.id].lastSoldAt)) {
          productSales[product.id].lastSoldAt = bill.created_at;
        }
      });
    });

    // Convert category sales to percentage distribution
    const totalSales = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const categoryDistribution = Object.entries(categorySales).map(([name, value]) => ({
      name,
      value: Math.round((value / totalSales) * 100)
    }));

    // Compute counts by product
    const { data: billItems, error: billItemsError } = await supabase
      .from("bill_items")
      .select("product_id, product_name, quantity");

    if (billItemsError) {
      console.error("Error fetching bill items:", billItemsError);
      throw billItemsError;
    }

    // Compute counts by product
    const productSalesCounts: Record<string, { name: string; soldCount: number }> = {};
    (billItems || []).forEach((item: any) => {
      if (!item.product_id) return;
      if (!productSalesCounts[item.product_id]) {
        productSalesCounts[item.product_id] = { name: item.product_name, soldCount: 0 };
      }
      productSalesCounts[item.product_id].soldCount += item.quantity || 0;
    });
    const topProducts = Object.entries(productSalesCounts)
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

    // Convert product sales to array and include lastSoldAt
    const productSalesDetails = Object.entries(productSales).map(([id, data]) => ({
      id,
      name: data.name,
      category: data.category,
      brand: data.brand,
      totalQuantity: data.quantity,
      buyingPrice: data.buyingPrice,
      sellingPrice: data.sellingPrice,
      totalRevenue: data.revenue,
      totalProfit: data.profit,
      lastSoldAt: data.lastSoldAt // Include lastSoldAt in the return data
    }));

    const mostSellingProduct = productSalesDetails.length > 0 
      ? [...productSalesDetails].sort((a, b) => b.totalQuantity - a.totalQuantity)[0]
      : null;

    const mostProfitableProduct = productSalesDetails.length > 0
      ? [...productSalesDetails].sort((a, b) => b.totalProfit - a.totalProfit)[0]
      : null;

    console.log("Processed sales data:", {
      categories: categoryDistribution.length,
      products: productSalesDetails.length,
      topProducts: topProducts.length
    });

    return {
      categoryDistribution,
      topProducts,
      productSalesDetails,
      mostSellingProduct,
      mostProfitableProduct,
      recentTransactions: bills || []
    };
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw error;
  }
};
