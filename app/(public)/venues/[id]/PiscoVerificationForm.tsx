"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { CheckCircle, XCircle, HelpCircle, AlertCircle, Loader2 } from "lucide-react";
import { updateVenuePiscoInfo } from "@/lib/actions/venues";

interface PiscoVerificationFormProps {
  venueId: string;
  currentStatus: string;
  currentNotes: string | null;
}

export default function PiscoVerificationForm({ 
  venueId, 
  currentStatus, 
  currentNotes 
}: PiscoVerificationFormProps) {
  const [piscoStatus, setPiscoStatus] = useState(currentStatus);
  const [piscoNotes, setPiscoNotes] = useState(currentNotes || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (piscoStatus === "available" && !piscoNotes.trim()) {
      setError("Please add a note explaining what pisco brands or options are available");
      return;
    }

    if (piscoStatus === "unavailable" && !piscoNotes.trim()) {
      setError("Please add a note explaining why pisco is not available");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pisco_status", piscoStatus);
      formData.append("pisco_notes", piscoNotes.trim());

      const result = await updateVenuePiscoInfo(venueId, formData);

      if (result.success) {
        setSuccess(true);
        // The page will revalidate automatically thanks to revalidatePath
      } else {
        setError(result.error || "Failed to update pisco information");
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "unavailable":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "temporarily_out":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Pisco Available";
      case "unavailable":
        return "No Pisco";
      case "temporarily_out":
        return "Temporarily Out";
      default:
        return "Status Unknown";
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
          <CheckCircle className="h-5 w-5" />
          Pisco information updated successfully!
        </div>
        <p className="text-green-700 text-sm">
          Thank you for helping keep our pisco information up to date.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSuccess(false)}
          className="mt-2"
        >
          Update again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pisco Status */}
      <div>
        <Label>Pisco Status</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Pisco Available */}
          <button
            type="button"
            onClick={() => setPiscoStatus("available")}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 text-sm font-medium ${
              piscoStatus === "available"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
            }`}
          >
            <CheckCircle className={`h-6 w-6 ${piscoStatus === "available" ? "text-green-500" : "text-gray-400"}`} />
            Pisco Available
          </button>

          {/* No Pisco */}
          <button
            type="button"
            onClick={() => setPiscoStatus("unavailable")}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 text-sm font-medium ${
              piscoStatus === "unavailable"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
            }`}
          >
            <XCircle className={`h-6 w-6 ${piscoStatus === "unavailable" ? "text-red-500" : "text-gray-400"}`} />
            No Pisco
          </button>

          {/* Temporarily Out */}
          <button
            type="button"
            onClick={() => setPiscoStatus("temporarily_out")}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 text-sm font-medium ${
              piscoStatus === "temporarily_out"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
            }`}
          >
            <AlertCircle className={`h-6 w-6 ${piscoStatus === "temporarily_out" ? "text-orange-500" : "text-gray-400"}`} />
            Temporarily Out
          </button>

          {/* Status Unknown */}
          <button
            type="button"
            onClick={() => setPiscoStatus("unverified")}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 text-sm font-medium ${
              piscoStatus === "unverified"
                ? "border-gray-500 bg-gray-50 text-gray-700"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <HelpCircle className={`h-6 w-6 ${piscoStatus === "unverified" ? "text-gray-500" : "text-gray-400"}`} />
            Status Unknown
          </button>
        </div>
      </div>



      {/* Pisco Notes */}
      <div>
        <Label htmlFor="pisco_notes">
          {piscoStatus === "available" 
            ? "What pisco brands or options are available?" 
            : piscoStatus === "unavailable"
            ? "Why is pisco not available?"
            : "Additional details about pisco at this venue"
          }
        </Label>
        <Textarea
          id="pisco_notes"
          placeholder={
            piscoStatus === "available" 
              ? "e.g., They have Alto del Carmen and Control C. Staff can make Piscola on request..."
              : piscoStatus === "unavailable"
              ? "e.g., Manager confirmed they don't stock pisco, only whisky and vodka..."
              : "Share any details about pisco availability at this venue..."
          }
          value={piscoNotes}
          onChange={(e) => setPiscoNotes(e.target.value)}
          rows={3}
          className="mt-1"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {piscoNotes.length}/500 characters
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Pisco Information...
          </>
        ) : (
          "Update Pisco Information"
        )}
      </Button>
    </form>
  );
}
