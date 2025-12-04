import type { ModalContent } from "@/app/types/type";
import type { ReactNode } from "react";

type Props = Omit<ModalContent, "content"> & { content: ReactNode };

export default function Modal({content, onClose}: Props) {
  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-neutral-900/50 bg-opacity-75 flex items-center justify-center z-20">
      <div className="modal-content relative max-h-[90dvh]">
        <span className="close-button text-8xl text-neutral-900 absolute right-5 top-0 cursor-pointer" onClick={onClose}>&times;</span>
        { content }
      </div>
    </div>
  )
}