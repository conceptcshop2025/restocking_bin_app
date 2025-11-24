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