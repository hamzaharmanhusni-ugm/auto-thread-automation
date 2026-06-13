import { Construction } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <EmptyState
      icon={Construction}
      title={`${feature} segera hadir`}
      description="Fitur ini sedang dikembangkan oleh tim. Datanya sudah siap di belakang layar — tampilannya menyusul."
    />
  );
}
