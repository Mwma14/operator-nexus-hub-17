import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';
import { Smartphone, CreditCard, CheckCircle } from 'lucide-react';

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  userBalance: number;
  onPurchaseComplete: (newBalance: number) => void;
}

type PurchaseStep = 'DETAILS' | 'PHONE_INPUT' | 'PROCESSING' | 'SUCCESS';

export default function PurchaseDialog({
  isOpen,
  onClose,
  product,
  userBalance,
  onPurchaseComplete
}: PurchaseDialogProps) {
  const [step, setStep] = useState<PurchaseStep>('DETAILS');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setPhoneNumber('');
      setPhoneError('');
      setLoading(false);
    }
  }, [isOpen]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^09\d{7,9}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (value && !validatePhoneNumber(value)) {
      setPhoneError('Please enter a valid Myanmar phone number (e.g., 09123456789)');
    } else {
      setPhoneError('');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!product) return;

    if (userBalance < product.price) {
      toast({
        title: "Insufficient Balance",
        description: "Your current balance is not enough for this purchase.",
        variant: "destructive"
      });
      return;
    }

    setStep('PHONE_INPUT');
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid Myanmar phone number (e.g., 09123456789)');
      return;
    }

    if (!product) return;

    setLoading(true);
    setStep('PROCESSING');

    try {
      // Get current user info
      const userResponse = await window.ezsite.apis.getUserInfo();
      if (userResponse.error) {
        throw new Error('Failed to get user information');
      }

      const userId = userResponse.data.ID;

      // Check user profile exists, create if not
      let userProfileResponse = await window.ezsite.apis.tablePage(44094, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        {
          name: "user_id",
          op: "Equal",
          value: userId
        }]

      });

      let currentBalance = userBalance;

      if (userProfileResponse.error) {
        throw new Error('Failed to check user profile');
      }

      if (userProfileResponse.data.List.length === 0) {
        // Create user profile
        const createProfileResponse = await window.ezsite.apis.tableCreate(44094, {
          user_id: userId,
          email: userResponse.data.Email,
          full_name: userResponse.data.Name || '',
          credits_balance: userBalance,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (createProfileResponse.error) {
          throw new Error('Failed to create user profile');
        }
      } else {
        currentBalance = userProfileResponse.data.List[0].credits_balance;
      }

      // Double-check balance
      if (currentBalance < product.price) {
        throw new Error('Insufficient balance for this purchase');
      }

      const newBalance = currentBalance - product.price;

      // Update user balance
      const updateProfileResponse = await window.ezsite.apis.tableUpdate(44094, {
        ID: userProfileResponse.data.List.length > 0 ? userProfileResponse.data.List[0].id : null,
        user_id: userId,
        credits_balance: newBalance,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString()
      });

      if (updateProfileResponse.error) {
        throw new Error('Failed to update user balance');
      }

      // Create order record
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const createOrderResponse = await window.ezsite.apis.tableCreate(44095, {
        user_id: userId,
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        amount: product.price,
        operator: product.operator,
        category: product.category,
        phone_number: phoneNumber,
        status: 'completed',
        transaction_id: transactionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (createOrderResponse.error) {
        throw new Error('Failed to create order record');
      }

      setStep('SUCCESS');
      onPurchaseComplete(newBalance);

      toast({
        title: "Purchase Successful!",
        description: `${product.name} has been purchased for ${phoneNumber}`
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setStep('PHONE_INPUT');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step !== 'PROCESSING') {
      onClose();
    }
  };

  const balanceAfterPurchase = product ? userBalance - product.price : userBalance;

  const getStepTitle = () => {
    switch (step) {
      case 'DETAILS':
        return 'Purchase Confirmation';
      case 'PHONE_INPUT':
        return 'Enter Phone Number';
      case 'PROCESSING':
        return 'Processing Purchase';
      case 'SUCCESS':
        return 'Purchase Successful!';
      default:
        return 'Purchase';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'DETAILS':
        return 'Review your purchase details and confirm';
      case 'PHONE_INPUT':
        return 'Enter the phone number to receive this product';
      case 'PROCESSING':
        return 'Please wait while we process your purchase...';
      case 'SUCCESS':
        return 'Your purchase has been completed successfully!';
      default:
        return '';
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'DETAILS' && <CreditCard className="h-5 w-5" />}
            {step === 'PHONE_INPUT' && <Smartphone className="h-5 w-5" />}
            {step === 'SUCCESS' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'DETAILS' &&
          <>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Product:</span>
                  <span>{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>
                  <span className="font-semibold text-lg">{product.price.toLocaleString()} {product.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Operator:</span>
                  <span className={`px-2 py-1 rounded text-white text-xs ${
                product.operator === 'MPT' ? 'bg-blue-600' :
                product.operator === 'OOREDOO' ? 'bg-red-600' :
                product.operator === 'ATOM' ? 'bg-green-600' : 'bg-purple-600'}`
                }>
                    {product.operator}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex justify-between">
                  <span className="font-medium">Current Balance:</span>
                  <span className="font-semibold">{userBalance.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Balance After Purchase:</span>
                  <span className={`font-semibold ${balanceAfterPurchase >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balanceAfterPurchase.toLocaleString()} MMK
                  </span>
                </div>
              </div>

              {balanceAfterPurchase < 0 &&
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">
                    Insufficient balance! You need {Math.abs(balanceAfterPurchase).toLocaleString()} MMK more.
                  </p>
                </div>
            }
            </>
          }

          {step === 'PHONE_INPUT' &&
          <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                id="phone"
                type="tel"
                placeholder="09123456789"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={phoneError ? 'border-red-500' : ''} />

                {phoneError &&
              <p className="text-red-500 text-sm">{phoneError}</p>
              }
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>{product.name}</strong> will be delivered to this phone number.
                </p>
              </div>
            </div>
          }

          {step === 'PROCESSING' &&
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <LoadingSpinner />
              <p className="text-gray-600">Processing your purchase...</p>
            </div>
          }

          {step === 'SUCCESS' &&
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">Purchase completed successfully!</p>
                <p className="text-sm text-gray-600">
                  {product.name} has been delivered to {phoneNumber}
                </p>
                <p className="text-xs text-gray-500">
                  This dialog will close automatically in a few seconds.
                </p>
              </div>
            </div>
          }
        </div>

        {step === 'DETAILS' &&
        <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
            onClick={handleConfirmPurchase}
            disabled={balanceAfterPurchase < 0}>

              Confirm Purchase
            </Button>
          </DialogFooter>
        }

        {step === 'PHONE_INPUT' &&
        <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('DETAILS')}>
              Back
            </Button>
            <Button
            onClick={handlePhoneSubmit}
            disabled={!phoneNumber || !!phoneError || loading}>

              {loading ? 'Processing...' : 'Complete Purchase'}
            </Button>
          </DialogFooter>
        }
      </DialogContent>
    </Dialog>);

}