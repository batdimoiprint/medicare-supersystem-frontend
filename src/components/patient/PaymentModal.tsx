import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
    CreditCard, 
    QrCode, 
    Smartphone, 
    Loader2, 
    CheckCircle, 
    Download, 
    ShieldCheck,
    Wallet
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

// --- Types based on Billing_tbl [cite: 19] ---
interface BillDetails {
    bill_id: number;
    reference_no: string;
    description: string;
    total_amount: number;
    due_date: string;
    status: 'Pending' | 'Overdue';
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: BillDetails | null;
}

export default function PaymentModal({ isOpen, onClose, bill }: PaymentModalProps) {
    const [step, setStep] = useState(1); // 1: Method Selection, 2: QR Payment, 3: Processing, 4: Success
    const [paymentMethod, setPaymentMethod] = useState<'PayMongo' | 'Cash'>('PayMongo');

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!bill) return null;

    const handleProceed = () => {
        if (paymentMethod === 'PayMongo') {
            setStep(2); // Show QR
        } else {
            // Cash option usually implies paying at the clinic
            onClose(); 
        }
    };

    const simulatePaymentVerification = () => {
        setStep(3);
        // Simulate PayMongo Webhook / API verification delay
        setTimeout(() => {
            setStep(4);
        }, 3000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Make a Payment</DialogTitle>
                    <DialogDescription>
                        Secure transaction for Invoice <span className="font-mono font-medium text-foreground">{bill.reference_no}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-2">
                    {/* Bill Summary */}
                    <div className="bg-muted/30 p-4 rounded-lg border flex justify-between items-center mb-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Amount Due</p>
                            <h2 className="text-2xl font-bold text-primary">₱{bill.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <Badge variant={bill.status === 'Overdue' ? 'destructive' : 'secondary'}>
                            {bill.status}
                        </Badge>
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Select Payment Method</h4>
                            
                            {/* Option 1: PayMongo (GCash/GrabPay/Card via QR) */}
                            <div 
                                className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${paymentMethod === 'PayMongo' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                onClick={() => setPaymentMethod('PayMongo')}
                            >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                    <QrCode className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">PayMongo Secure QR</p>
                                    <p className="text-xs text-muted-foreground">GCash, Maya, GrabPay, or Cards</p>
                                </div>
                                {paymentMethod === 'PayMongo' && <CheckCircle className="h-5 w-5 text-primary" />}
                            </div>

                            {/* Option 2: Cash (Pay at Clinic) */}
                            <div 
                                className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${paymentMethod === 'Cash' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                onClick={() => setPaymentMethod('Cash')}
                            >
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                    <Wallet className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Pay Cash at Clinic</p>
                                    <p className="text-xs text-muted-foreground">Settle payment at the front desk</p>
                                </div>
                                {paymentMethod === 'Cash' && <CheckCircle className="h-5 w-5 text-primary" />}
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                                <ShieldCheck className="w-3 h-3" /> Secure Payment Powered by PayMongo
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Scan to Pay</h3>
                                <p className="text-sm text-muted-foreground">Scan this QR code using your preferred e-wallet app.</p>
                            </div>

                            {/* Simulated PayMongo QR Frame */}
                            <div className="relative group">
                                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-dashed border-gray-300">
                                    {/* Placeholder for actual QR Image */}
                                    <div className="h-48 w-48 bg-gray-900 rounded-lg flex items-center justify-center text-white relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayMongo-Simulation')] opacity-80"></div>
                                        <QrCode className="h-12 w-12 relative z-10" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    PAYMONGO
                                </div>
                            </div>

                            <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                                <Smartphone className="h-4 w-4 text-blue-600" />
                                <AlertTitle>Waiting for scan...</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Please do not close this window until the transaction is verified.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div>
                                <h3 className="font-semibold text-lg">Verifying Payment...</h3>
                                <p className="text-sm text-muted-foreground">Confirming transaction with PayMongo...</p>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-2xl text-gray-900">Payment Successful!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Transaction ID: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">PM-2025-XYZ-999</span>
                                </p>
                            </div>
                            
                            <Card className="w-full bg-muted/20 border-dashed">
                                <CardContent className="p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount Paid:</span>
                                        <span className="font-bold">₱{bill.total_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Method:</span>
                                        <span>PayMongo QR</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-2">
                    {step === 1 && (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                            <Button className="flex-1" onClick={handleProceed}>Continue to Payment</Button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="flex w-full gap-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                            <Button className="flex-1" onClick={simulatePaymentVerification}>
                                I have completed the payment
                            </Button>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" className="flex-1">
                                <Download className="w-4 h-4 mr-2" /> Download Receipt
                            </Button>
                            <Button className="flex-1" onClick={onClose}>Done</Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}