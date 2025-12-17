import Image from "next/image";
import Link from "next/link";
import { ArchiveBoxArrowDownIcon, ExclamationTriangleIcon } from "@heroicons/react/16/solid";

export default function Home() {
  return (
    <div>
      <main className="flex justify-center items-center h-dvh">
        <div className="flex flex-col justify-center items-center gap-4">
          <Image
            src="/concept-c-logo.webp"
            alt="Concept C logo"
            width={300}
            height={60}
            priority
          />

          <div className="flex justify-center items-center gap-4">
            <Link
              href="/restocking-bin"
              className="bg-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-4 hover:bg-sky-700 ease-in-out duration-300 cursor-pointer">
              <ArchiveBoxArrowDownIcon className="size-6 text-neutral-50" />
              <span className="text-neutral-50">Réapprovisionnement de bin</span>
            </Link>
            
            <button
              disabled
              className="bg-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-4 hover:bg-sky-700 ease-in-out duration-300 cursor-pointer disabled:bg-gray-300 disabled:pointer-events-none">
              <ExclamationTriangleIcon className="size-6 text-neutral-50" />
              <span className="text-neutral-50">Suivi de stock de bin (prochainement) </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
