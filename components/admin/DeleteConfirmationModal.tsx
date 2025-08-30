"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteVenue } from "@/lib/actions/admin";
import { toast } from "sonner";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: {
    id: string;
    name: string;
  };
  redirectAfterDelete?: string; // Optional redirect path after successful deletion
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  venue,
  redirectAfterDelete,
}: DeleteConfirmationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleDelete = () => {
    if (confirmText !== venue.name) {
      toast.error("Please type the venue name exactly to confirm deletion");
      return;
    }

    startTransition(async () => {
      const result = await deleteVenue(venue.id);
      if (result.success) {
        toast.success(result.message);
        onClose();
        setConfirmText(""); // Reset form

        // Redirect if specified (e.g., from edit page back to admin)
        if (redirectAfterDelete) {
          router.push(redirectAfterDelete);
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setConfirmText(""); // Reset form
      onClose();
    }
  };

  const isConfirmValid = confirmText === venue.name;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Venue
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-900">
                  You are about to permanently delete:
                </p>
                <p className="text-sm font-semibold text-red-900 bg-red-100 px-2 py-1 rounded">
                  {venue.name}
                </p>
                <p className="text-sm text-red-700">
                  This will also delete all related data including:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1 ml-2">
                  <li>All comments and ratings</li>
                  <li>All pisco verifications</li>
                  <li>All venue photos and data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type the venue name to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={venue.name}
              disabled={isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Type "{venue.name}" exactly as shown above
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 rounded-b-2xl bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="min-w-20"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isPending}
            className="min-w-20"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Venue
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
