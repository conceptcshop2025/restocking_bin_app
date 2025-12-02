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

export type ModalContent = {
  content: Element | null;
  onClose: () => void;
}

export type Toast = {
  type: "success" | "error" | "info";
  message: string;
}

export type HistoryListModal = {
  onClose: () => void;
  onToast: (toast: Toast) => void;
}

export type LoaderProps = {
  text?: string;
  classes?: string;
}