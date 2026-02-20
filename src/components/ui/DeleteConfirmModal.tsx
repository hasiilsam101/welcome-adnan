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
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  confirmLabel?: string;
  loadingLabel?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Confirmation",
  description,
  itemName,
  isLoading = false,
  confirmLabel,
  loadingLabel,
}: DeleteConfirmModalProps) {
  const isTrash = title?.toLowerCase().includes("trash");

  const defaultDescription = itemName
    ? isTrash
      ? `"${itemName}" will be moved to trash. You can restore it later from Global Trash.`
      : `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : isTrash
      ? "This item will be moved to trash. You can restore it later from Global Trash."
      : "Are you sure you want to delete this item? This action cannot be undone.";

  const resolvedConfirmLabel = confirmLabel || (isTrash ? "Move to Trash" : "Delete");
  const resolvedLoadingLabel = loadingLabel || (isTrash ? "Moving..." : "Deleting...");

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? resolvedLoadingLabel : resolvedConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
