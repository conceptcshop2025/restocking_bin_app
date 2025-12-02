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

export type ToastProps = {
  type: "success" | "error" | "info";
  message: string;
}

export type HistoryListModal = {
  onClose: () => void;
  onToast: (toast: ToastProps) => void;
}

export type LoaderProps = {
  text?: string;
  classes?: string;
}

export type HistoryListProps = {
  id: number;
  name: string;
}