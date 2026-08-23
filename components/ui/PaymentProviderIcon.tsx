import type { PaymentProvider } from '@/types/database';

interface PaymentProviderIconProps {
  provider: PaymentProvider;
  className?: string;
}

// Simple brand-toned monogram badges rather than reproductions of the actual
// PayPal/Razorpay logo artwork — enough to tell the two apart at a glance
// wherever a paid order's method is shown, without copying trademarked marks.
export default function PaymentProviderIcon({ provider, className = '' }: PaymentProviderIconProps) {
  if (provider === 'paypal') {
    return (
      <span
        aria-label="PayPal"
        title="PayPal"
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#003087] font-mono text-base font-bold text-white ${className}`}
      >
        P
      </span>
    );
  }

  return (
    <span
      aria-label="Razorpay"
      title="Razorpay"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#0C2451] font-mono text-base font-bold text-[#3395FF] ${className}`}
    >
      R
    </span>
  );
}
