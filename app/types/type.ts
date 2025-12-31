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
  restocked: boolean;
  bAlias: string[] | null;
}

export type ModalContent = {
  content: Element | null;
  type?: "image" | "bin-validator";
  onClose: () => void;
}

export type ToastProps = {
  type: "success" | "error" | "info";
  message: string;
}

export type HistoryListModal = {
  onClose: () => void;
  onToast: (toast: ToastProps) => void;
  onSelectItem?: (item: HistoryListProps) => void;
}

export type LoaderProps = {
  text?: string;
  classes?: string;
}

export type HistoryListProps = {
  id: number;
  name: string;
  date: string;
  products: Product[];
}

export type BinValidatorProps = {
  binLocations: string[] | string;
  productUpc: string;
  productQuantity: number;
  productItem?: HTMLElement;
  bAlias: string[] | [];
  onValidate?: (item:HTMLElement, successItem:boolean) => void;
}

export type CsvImportProps = {
  onLoading: (value:boolean) => void;
  onProductListFromFile: (list:Product[]) => void;
}

export type CsvRowsProps = {
  ['Purchase Order']: string;
  ['Qty Ordered']: string;
  SKU: string;
}

export type ProductSold = {
  name: string;
  type: string;
  sku: string;
  soldQuantity: string;
  upc: string;
  binLocation: string[] | string;
  htsus: string | null;
  imageUrl: string;
}

export type BinStatusProps = {
  qty: number;
  maxQty: number;
}