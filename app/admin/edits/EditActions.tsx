"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  MoreHorizontal,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { acceptSuggestedEdit, rejectSuggestedEdit } from "@/lib/actions/admin";

interface SuggestedEdit {
  id: string;
  venue_id: string;
  user_id: string;
  suggested_json: any;
  status: string;
  created_at: string;
  venue?: { name?: string };
  profile?: { full_name?: string };
}

interface EditActionsProps {
  edit: SuggestedEdit;
}

export default function EditActions({ edit }: EditActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptSuggestedEdit(edit.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectSuggestedEdit(edit.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Actions */}
      <Button
        size="sm"
        variant="default"
        onClick={handleAccept}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/venues/${edit.venue_id}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Venue
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
