export type Product = {
  sku: string;
  upc: string;
  name: string;
  quantityAvailable: number;
  quantityOnHand: number;
  quantityToReStock: number;
  binLocation: string[] | string;
  htsus: string | null;
  imageUrl: string;
}

export type Modal = {
  content: string;
  onClose: () => void;
}

export type Toast = {
  type: "success" | "error" | "info";
  message: string;
}