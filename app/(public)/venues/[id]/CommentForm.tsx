"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, StarIcon, Loader2 } from "lucide-react";
import { addCommentAction } from "@/lib/actions/comments";

interface CommentFormProps {
  venueId: string;
}

export default function CommentForm({ venueId }: CommentFormProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!content.trim()) {
      setError("Please write a comment");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("rating", rating.toString());

      const result = await addCommentAction(venueId, formData);

      if (result.success) {
        setSuccess(true);
        setContent("");
        setRating(5);
        // The page will revalidate automatically thanks to revalidatePath
      } else {
        setError(result.error || "Failed to add comment");
      }
    });
  };

  const renderStar = (index: number) => {
    const filled = index < (hoveredRating || rating);
    return (
      <button
        key={index}
        type="button"
        className="p-1 hover:scale-110 transition-transform"
        onMouseEnter={() => setHoveredRating(index + 1)}
        onMouseLeave={() => setHoveredRating(0)}
        onClick={() => setRating(index + 1)}
      >
        <StarIcon 
          className={`h-6 w-6 ${
            filled 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300 hover:text-yellow-300"
          }`} 
        />
      </button>
    );
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">
          ✅ Thank you! Your review has been added.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSuccess(false)}
          className="mt-2"
        >
          Add another review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <Label>Rating</Label>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, index) => renderStar(index))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} star{rating !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div>
        <Label htmlFor="content">Your Review</Label>
        <Textarea
          id="content"
          placeholder="Share your experience at this venue..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="mt-1"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {content.length}/500 characters
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
        disabled={isPending || !content.trim()}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Review...
          </>
        ) : (
          "Add Review"
        )}
      </Button>
    </form>
  );
}
