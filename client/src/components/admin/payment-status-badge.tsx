import { StatusBadge } from "@/components/admin/status-badge";
import { paymentTone } from "@/lib/admin/status";
import type { PaymentStatus } from "@/lib/admin/types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge status={status} tone={paymentTone(status)} />;
}
