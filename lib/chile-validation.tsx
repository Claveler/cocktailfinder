import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Constants
export const CHILE_WARNING_TEXT =
  "💡 Selecting Chile will show a warning; pisco is widely available in its birthplace!";

export const CHILE_MODAL_TITLE = "🇨🇱 Chilean Venue Detected 🗿";

export const CHILE_MODAL_DESCRIPTION =
  "Chile is the birthplace of pisco and it's sold everywhere there! " +
  "Piscola.net is designed to help people find pisco outside of Chile, " +
  "where it's much harder to come by.";

export const CHILE_SUGGESTION_CREATE =
  "Please consider adding venues from other countries where pisco is less common.";

export const CHILE_SUGGESTION_EDIT =
  "Please consider updating this venue to a location in another country where pisco is less common.";

// Validation functions
export const isChileSelected = (country: string): boolean => {
  return country === "Chile";
};

export const validateNotChile = (
  country: string
): { isValid: boolean; message?: string } => {
  if (isChileSelected(country)) {
    return {
      isValid: false,
      message: CHILE_SUGGESTION_CREATE,
    };
  }
  return { isValid: true };
};

// Reusable Modal Component
interface ChileWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: "create" | "edit";
}

export const ChileWarningModal: React.FC<ChileWarningModalProps> = ({
  isOpen,
  onClose,
  context = "create",
}) => {
  const contextualMessage =
    context === "edit" ? CHILE_SUGGESTION_EDIT : CHILE_SUGGESTION_CREATE;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {CHILE_MODAL_TITLE}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {CHILE_MODAL_DESCRIPTION}
            <br />
            <br />
            {contextualMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="flex-1">
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hook for Chile validation logic
export const useChileValidation = () => {
  const [chileWarningOpen, setChileWarningOpen] = React.useState(false);

  const handleCountryChange = React.useCallback(
    (value: string, onValidCountryChange: (country: string) => void) => {
      if (isChileSelected(value)) {
        setChileWarningOpen(true);
        return;
      }
      onValidCountryChange(value);
    },
    []
  );

  const handleGoogleMapsExtraction = React.useCallback((country?: string) => {
    if (country && isChileSelected(country)) {
      setChileWarningOpen(true);
    }
  }, []);

  const validateFormSubmission = React.useCallback((country: string) => {
    const validation = validateNotChile(country);
    if (!validation.isValid) {
      setChileWarningOpen(true);
      return false;
    }
    return true;
  }, []);

  const closeModal = React.useCallback(() => {
    setChileWarningOpen(false);
  }, []);

  return {
    chileWarningOpen,
    setChileWarningOpen,
    handleCountryChange,
    handleGoogleMapsExtraction,
    validateFormSubmission,
    closeModal,
  };
};
