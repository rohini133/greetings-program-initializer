
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { BillHistoryList } from "@/components/billing/BillHistoryList";
import { BillReceipt } from "@/components/billing/BillReceipt";
import { Bill } from "@/data/models";
import { getBills, deleteBill } from "@/services/billService";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const BillHistory = () => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bills = [], refetch } = useQuery({
    queryKey: ['bills'],
    queryFn: getBills,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsReceiptOpen(true);
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      // Delete from database
      await deleteBill(billId);
      
      // Invalidate and refetch bills
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      
      // If the deleted bill was selected, clear selection
      if (selectedBill?.id === billId) {
        setSelectedBill(null);
        setIsReceiptOpen(false);
      }
      
      toast({
        title: "Bill deleted",
        description: `Bill #${billId} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer title="Bill History" subtitle="View and manage past transactions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BillHistoryList 
            onSelectBill={handleSelectBill} 
            selectedBillId={selectedBill?.id}
            onDeleteBill={handleDeleteBill}
            bills={bills}
          />
        </div>
        <div>
          <BillReceipt 
            bill={selectedBill} 
            open={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default BillHistory;
