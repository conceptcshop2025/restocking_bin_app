import type { BinStatusProps } from "@/app/types/type";
import './bin-status.css';

export default function BinStatus({ percentage }: BinStatusProps) {
  let statusLabel = 'inconnu';
  let status = 'unknown';

  const rawPercentage = percentage;
  let finalPercentage = Math.max(0, Math.min(100, Math.round(rawPercentage)))

  if (isNaN(finalPercentage)) {
    finalPercentage = 0;
  }

  if (finalPercentage <= 0) {
    statusLabel = 'Rupture de stock';
    status = 'out-of-stock';
  } else if (finalPercentage <= 25) {
    statusLabel = 'Stock faible';
    status = 'low-stock';
  } else if (finalPercentage <= 50) {
    statusLabel = 'Stock moyen';
    status = 'medium-stock';
  } else {
    statusLabel = 'Stock élevé';
    status = 'high-stock';
  }

  return (
    <div className="bin-status flex justify-center items-center gap-4">
      <span className={`status ${status}`}></span>
      <span className={`status-label ${status}`}>{statusLabel}</span>
    </div>
  );
}
