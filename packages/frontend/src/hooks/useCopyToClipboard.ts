import { useState } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setIsCopied(false);
        // SECURITY: Clear clipboard after a timeout
        try {
            navigator.clipboard.writeText('');
        } catch(e) {
            console.warn("Could not clear clipboard.");
        }
      }, timeout);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error("Failed to copy to clipboard.");
    });
  };

  return copyToClipboard;
}