import type { Modal } from "@/app/types/type";
import Image from "next/image";

export default function Modal({content, onClose}: Modal) {
  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-neutral-900/50 bg-opacity-75 flex items-center justify-center">
      <div className="modal-content relative">
        <span className="close-button text-8xl text-neutral-900 absolute right-5 top-0 cursor-pointer" onClick={onClose}>&times;</span>
        <Image 
        src={content}
        alt="product-image"
        width={960}
        height={540}
        className="rounded-lg h-dvh w-full" />
      </div>
    </div>
  )
}