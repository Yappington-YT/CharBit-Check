import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if age has been verified in this session
    const ageVerified = sessionStorage.getItem('charbit-age-verified');
    if (!ageVerified) {
      setIsOpen(true);
    }
  }, []);

  const confirmAge = () => {
    sessionStorage.setItem('charbit-age-verified', 'true');
    setIsOpen(false);
  };

  const declineAge = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="text-center p-4">
          <div className="text-6xl mb-4">🔞</div>
          <h2 className="text-2xl font-bold mb-4">Age Verification Required</h2>
          <p className="text-muted-foreground mb-6">
            CharBit contains user-generated content that may include mature themes. 
            You must be 18 or older to access this platform.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={confirmAge}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              I am 18 or older
            </Button>
            <Button 
              onClick={declineAge}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              I am under 18
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
