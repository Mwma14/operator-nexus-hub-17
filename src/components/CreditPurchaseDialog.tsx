import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Upload, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreditPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

type PurchaseStep = 'AMOUNT' | 'PAYMENT_METHOD' | 'PAYMENT_PROOF' | 'PROCESSING' | 'SUCCESS';

const CREDIT_PACKAGES = [
  { credits: 10, price: 1000 },
  { credits: 30, price: 3000 },
  { credits: 50, price: 5000 }
];

const PAYMENT_METHODS = [
  { id: 'kpay', name: 'K Pay', icon: '💳' },
  { id: 'wavepay', name: 'Wave Pay', icon: '📱' }
];

export default function CreditPurchaseDialog({
  isOpen,
  onClose,
  currentBalance,
  onBalanceUpdate
}: CreditPurchaseDialogProps) {
  const [step, setStep] = useState<PurchaseStep>('AMOUNT');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Reset all states when dialog opens
      setStep('AMOUNT');
      setSelectedPackage(null);
      setCustomAmount('');
      setPaymentMethod('');
      setPaymentProofFile(null);
      setUploading(false);
      setLoading(false);
    }
  }, [isOpen]);

  const checkAuthentication = async () => {
    try {
      const response = await window.ezsite.apis.getUserInfo();
      if (response.error) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase credits.",
          variant: "destructive"
        });
        navigate('/auth');
        onClose();
        return false;
      }
      return true;
    } catch (error) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive"
      });
      navigate('/auth');
      onClose();
      return false;
    }
  };

  const getSelectedCredits = () => {
    if (selectedPackage !== null) {
      return CREDIT_PACKAGES[selectedPackage].credits;
    }
    return parseInt(customAmount) || 0;
  };

  const getTotalPrice = () => {
    return getSelectedCredits() * 100; // 1 credit = 100 MMK
  };

  const handleAmountConfirm = async () => {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    const credits = getSelectedCredits();
    if (credits <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select a valid credit amount.",
        variant: "destructive"
      });
      return;
    }

    setStep('PAYMENT_METHOD');
  };

  const handlePaymentMethodConfirm = () => {
    if (!paymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep('PAYMENT_PROOF');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setPaymentProofFile(file);
  };

  const handleFinalConfirm = async () => {
    if (!paymentProofFile) {
      toast({
        title: "Upload Required",
        description: "Please upload your payment proof screenshot.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStep('PROCESSING');

    try {
      // Get user info
      const userResponse = await window.ezsite.apis.getUserInfo();
      if (userResponse.error) {
        throw new Error('Failed to get user information');
      }

      // Upload payment proof image
      setUploading(true);
      const uploadResponse = await window.ezsite.apis.upload({
        filename: paymentProofFile.name,
        file: paymentProofFile
      });

      if (uploadResponse.error) {
        throw new Error('Failed to upload payment proof');
      }

      const imageId = uploadResponse.data;

      // Create credit purchase record
      const purchaseResponse = await window.ezsite.apis.tableCreate(44147, {
        user_id: userResponse.data.ID,
        credit_amount: getSelectedCredits(),
        mmk_amount: getTotalPrice(),
        payment_method: PAYMENT_METHODS.find(pm => pm.id === paymentMethod)?.name || paymentMethod,
        payment_proof_image: imageId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_notes: ''
      });

      if (purchaseResponse.error) {
        throw new Error('Failed to create purchase record');
      }

      setStep('SUCCESS');
      toast({
        title: "Purchase Request Submitted!",
        description: `Your request for ${getSelectedCredits()} credits has been submitted for admin approval.`
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setStep('PAYMENT_PROOF');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'PAYMENT_METHOD':
        setStep('AMOUNT');
        break;
      case 'PAYMENT_PROOF':
        setStep('PAYMENT_METHOD');
        break;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'AMOUNT':
        return 'Purchase Credits';
      case 'PAYMENT_METHOD':
        return 'Select Payment Method';
      case 'PAYMENT_PROOF':
        return 'Upload Payment Proof';
      case 'PROCESSING':
        return 'Processing Request';
      case 'SUCCESS':
        return 'Request Submitted!';
      default:
        return 'Purchase Credits';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'AMOUNT':
        return 'Choose the amount of credits you want to purchase';
      case 'PAYMENT_METHOD':
        return 'Choose your preferred payment method';
      case 'PAYMENT_PROOF':
        return 'Upload a screenshot of your payment confirmation';
      case 'PROCESSING':
        return 'Please wait while we process your request...';
      case 'SUCCESS':
        return 'Your purchase request has been submitted and is pending admin approval';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'AMOUNT' && <CreditCard className="h-5 w-5" />}
            {step === 'PAYMENT_METHOD' && <Smartphone className="h-5 w-5" />}
            {step === 'PAYMENT_PROOF' && <Upload className="h-5 w-5" />}
            {step === 'SUCCESS' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {step === 'PROCESSING' && <Clock className="h-5 w-5" />}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Amount Selection */}
          {step === 'AMOUNT' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Choose Credit Package</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CREDIT_PACKAGES.map((pkg, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedPackage === index
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedPackage(index);
                        setCustomAmount('');
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="font-semibold">{pkg.credits}</div>
                        <div className="text-sm text-muted-foreground">Credits</div>
                        <div className="text-sm font-medium">{pkg.price.toLocaleString()} MMK</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom">Or enter custom amount</Label>
                <Input
                  id="custom"
                  type="number"
                  min="1"
                  placeholder="Enter number of credits"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPackage(null);
                  }}
                />
                {customAmount && parseInt(customAmount) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Total: {(parseInt(customAmount) * 100).toLocaleString()} MMK
                  </p>
                )}
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span className="font-medium">{currentBalance.toLocaleString()} MMK</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Rate: 1 Credit = 100 MMK
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === 'PAYMENT_METHOD' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  Purchase Summary: {getSelectedCredits()} credits for {getTotalPrice().toLocaleString()} MMK
                </p>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">{method.icon}</span>
                      {method.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Payment Proof Upload */}
          {step === 'PAYMENT_PROOF' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  Please make payment of <strong>{getTotalPrice().toLocaleString()} MMK</strong> using{' '}
                  <strong>{PAYMENT_METHODS.find(pm => pm.id === paymentMethod)?.name}</strong> and upload the screenshot below.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-proof">Upload Payment Screenshot *</Label>
                <Input
                  id="payment-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                {paymentProofFile && (
                  <p className="text-sm text-green-600">
                    ✓ {paymentProofFile.name} selected
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <LoadingSpinner />
              <p className="text-gray-600">
                {uploading ? 'Uploading payment proof...' : 'Submitting purchase request...'}
              </p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">Request Submitted Successfully!</p>
                <p className="text-sm text-gray-600">
                  Your request for {getSelectedCredits()} credits is now pending admin approval.
                </p>
                <p className="text-xs text-gray-500">
                  You will be notified once your request is processed.
                </p>
                <p className="text-xs text-gray-500">
                  This dialog will close automatically in a few seconds.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step === 'AMOUNT' && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAmountConfirm}
              disabled={getSelectedCredits() <= 0}
            >
              Continue
            </Button>
          </DialogFooter>
        )}

        {step === 'PAYMENT_METHOD' && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handlePaymentMethodConfirm}
              disabled={!paymentMethod}
            >
              Continue
            </Button>
          </DialogFooter>
        )}

        {step === 'PAYMENT_PROOF' && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Button
              onClick={handleFinalConfirm}
              disabled={!paymentProofFile || loading}
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}