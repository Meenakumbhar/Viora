import type { PaymentProvider } from '@/types/database';

interface PaymentProviderIconProps {
  provider: PaymentProvider;
  className?: string;
}

// Official wordmarks (public/images/payment/*.svg — from Simple Icons,
// CC0) rather than the letter-badge stand-ins used before. Standard
// nominative use: identifying a supported payment method, not endorsement.
export default function PaymentProviderIcon({ provider, className = '' }: PaymentProviderIconProps) {
  const isPaypal = provider === 'paypal';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isPaypal ? '/images/payment/paypal.svg' : '/images/payment/razorpay.svg'}
      alt={isPaypal ? 'PayPal' : 'Razorpay'}
      className={`h-5 w-auto shrink-0 ${className}`}
    />
  );
}
