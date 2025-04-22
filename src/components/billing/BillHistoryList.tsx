import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bill } from "@/data/models";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BillHistoryListProps {
  onSelectBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  selectedBillId?: string | null;
  bills: Bill[];
}

export const BillHistoryList = ({ 
  onSelectBill, 
  selectedBillId, 
  onDeleteBill,
  bills 
}: BillHistoryListProps) => {
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFilteredBills(bills);
    setIsLoading(false);
  }, [bills]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBills(bills);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = bills.filter(
      bill => 
        bill.id.toLowerCase().includes(lowerCaseQuery) ||
        String(bill.bill_number).includes(lowerCaseQuery) || // Add bill_number to search
        bill.customerName?.toLowerCase().includes(lowerCaseQuery) ||
        bill.customerPhone?.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredBills(filtered);
  }, [searchQuery, bills]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(amount).replace('₹', '₹ '); // Add a space after the symbol
  };

  const handleDelete = async () => {
    if (!billToDelete) return;

    try {
      await onDeleteBill(billToDelete.id);
      
      setIsDeleteDialogOpen(false);
      setBillToDelete(null);
    } catch (error) {
      console.error("Delete bill error:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Recent Bills</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by bill #, customer name or phone"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-[#ea384c] border-t-transparent rounded-full inline-block mr-2"></div>
          <span>Loading bills...</span>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {searchQuery ? "No bills match your search" : "No bills found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => (
                <TableRow 
                  key={bill.id}
                  className={`hover:bg-red-50 ${
                    selectedBillId === bill.id ? "bg-red-100 hover:bg-red-100" : ""
                  }`}
                >
                  <TableCell 
                    className="font-medium cursor-pointer"
                    onClick={() => onSelectBill(bill)}
                  >
                    #{bill.bill_number}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => onSelectBill(bill)}
                  >
                    {new Date(bill.createdAt).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(bill.createdAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => onSelectBill(bill)}
                  >
                    {bill.customerName || "Walk-in Customer"}
                    {bill.customerPhone && (
                      <div className="text-xs text-gray-500">{bill.customerPhone}</div>
                    )}
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer"
                    onClick={() => onSelectBill(bill)}
                  >{bill.items?.length || 0} items</TableCell>
                  <TableCell 
                    className="font-semibold text-[#ea384c] cursor-pointer"
                    onClick={() => onSelectBill(bill)}
                  >
                    {formatCurrency(bill.total || 0)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-8 w-8"
                      onClick={() => {
                        setBillToDelete(bill);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete bill #{billToDelete?.bill_number}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBillToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
