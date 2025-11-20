export type Product = {
  sku: string;
  upc: string;
  name: string;
  quantityAvailable: number;
  binLocation: string[] | string;
}