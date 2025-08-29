"use client";

import type { PiscoVerification } from "@/lib/venues";

interface FeaturedCommentProps {
  featuredVerification?: PiscoVerification | null;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}

export default function FeaturedComment({ featuredVerification }: FeaturedCommentProps) {
  if (!featuredVerification || !featuredVerification.pisco_notes) {
    return null;
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-primary">Featured Comment</span>
      </div>
      <div className="text-sm text-foreground/90 italic mb-2">
        "{featuredVerification.pisco_notes}"
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">— {featuredVerification.verified_by}</span>
        <span className="text-muted-foreground/60">{formatDate(featuredVerification.created_at)}</span>
      </div>
    </div>
  );
}
