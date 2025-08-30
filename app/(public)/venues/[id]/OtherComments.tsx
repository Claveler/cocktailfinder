"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, HelpCircle } from "lucide-react";
import type { PiscoVerification } from "@/lib/venues";

interface OtherCommentsProps {
  venueId: string;
  featuredVerificationId?: string | null;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalComments: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CommentsResponse {
  verifications: PiscoVerification[];
  pagination: PaginationInfo;
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

export default function OtherComments({
  venueId,
  featuredVerificationId,
}: OtherCommentsProps) {
  const [verifications, setVerifications] = useState<PiscoVerification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial comments
  useEffect(() => {
    loadComments(1, false);
  }, [venueId]);

  const loadComments = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/venues/${venueId}/comments?page=${page}&pageSize=5`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data: CommentsResponse = await response.json();

      if (append) {
        setVerifications((prev) => [...prev, ...data.verifications]);
      } else {
        setVerifications(data.verifications);
      }

      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination && pagination.hasNextPage) {
      loadComments(pagination.currentPage + 1, true);
    }
  };

  // Don't render the card if there are no comments and we're not loading
  if (!loading && (!verifications.length || verifications.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Other Comments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Additional insights from fellow pisco enthusiasts
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading comments...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadComments(1, false)}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : verifications.length > 0 ? (
          <div className="space-y-4">
            {/* Regular Comments */}
            <div className="space-y-3">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="bg-foreground/5 border border-foreground/10 rounded-lg p-4"
                >
                  <div className="text-sm text-foreground/80 italic mb-2">
                    "{verification.pisco_notes}"
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      — {verification.verified_by}
                    </span>
                    <span className="text-muted-foreground/60">
                      {formatDate(verification.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {pagination && pagination.hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-32"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${pagination.totalComments - verifications.length} remaining)`
                  )}
                </Button>
              </div>
            )}

            {/* Comments count indicator */}
            {pagination && (
              <div className="text-center text-xs text-muted-foreground pt-2">
                Showing {verifications.length} of {pagination.totalComments}{" "}
                comments
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
