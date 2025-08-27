"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  venue: {
    id: string;
    name: string;
    address: string;
  };
}

export default function ShareButton({ venue }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${venue.name} - Piscola.net`,
      text: `Check out ${venue.name} at ${venue.address} on Piscola.net`,
      url: url,
    };

    // Check if Web Share API is supported (mainly mobile devices)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <Button 
      onClick={handleShare} 
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          <span className="hidden md:inline">Copied!</span>
          <span className="md:hidden">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Share</span>
          <span className="md:hidden">Share</span>
        </>
      )}
    </Button>
  );
}
