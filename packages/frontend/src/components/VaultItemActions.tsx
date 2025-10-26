import { useState } from "react";
import type { DecryptedVaultItem } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { VaultItemForm } from "./VaultItemForm";
import { useVaultStore } from "@/state/vaultStore";
import api from "@/lib/api";
import { toast } from "sonner";
// Import AlertDialog for delete confirmation
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";


interface VaultItemActionsProps {
  item: DecryptedVaultItem;
}

export function VaultItemActions({ item }: VaultItemActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const removeDecryptedItem = useVaultStore(state => state.removeDecryptedItem);

    const handleDelete = async () => {
        try {
            await api.delete(`/vault/${item.id}`);
            removeDecryptedItem(item.id);
            toast.success(`"${item.decryptedData.title}" deleted successfully.`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete item.");
        }
    };

  return (
    <>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-600 focus:bg-red-100 focus:text-red-700">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the vault item
                    for "{item.decryptedData.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VaultItemForm isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} itemToEdit={item} />
    </>
  );
}