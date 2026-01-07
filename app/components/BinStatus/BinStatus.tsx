import type { BinStatusProps } from "@/app/types/type";
import './bin-status.css';

export default function BinStatus({ qty, maxQty }: BinStatusProps) {
  let statusLabel =  'inconnu';
  let status = 'unknown';
  const percentage = Math.round((maxQty - qty) / maxQty * 100);
  console.log(`BinStatus - qty: ${qty}, maxQty: ${maxQty}, percentage: ${percentage}%`);

  if(maxQty === 0) {
    statusLabel = 'inconnu';
    status = 'unknown';
  } else {
    if (percentage <= 0) {
      statusLabel = 'Rupture de stock';
      status = 'out-of-stock';
    } else if (percentage <= 25) {
      statusLabel = 'Stock faible';
      status = 'low-stock';
    } else if (percentage <= 50) {
      statusLabel = 'Stock moyen';
      status = 'medium-stock';
    } else if (percentage <= 100) {
      statusLabel = 'Stock élevé';
      status = 'high-stock';
    } else {
      statusLabel = 'inconnu';
      status = 'unknown';
    }
  }
  
  return (
    <div className="bin-status flex justify-center items-center gap-4">
      <span className={`status ${status}`}></span>
      <span className={`status-label ${status}`}>{ statusLabel }</span>
    </div>
  )
}