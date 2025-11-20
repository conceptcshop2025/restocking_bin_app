"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [upc, setUpc] = useState("");
  const [debouncedUpc, setDebouncedUpc] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUpc(upc);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [upc]);

  useEffect(() => {
    if (debouncedUpc) {
      console.log('Debounced UPC:', debouncedUpc);
      getData(debouncedUpc);
    }
  }, [debouncedUpc]);

  function getData(upc:string) {
    const baseUrl = `/api/ipacky?upc=${upc}`;
    fetch(baseUrl)
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  return (
    <div className="">
      <main className="">
        <header className="flex justify-center p-2">
          <Image
            className=""
            src="/concept-c-logo.webp"
            alt="Concept C logo"
            width={300}
            height={60}
            priority
          />
        </header>
        <section className="flex flex-col items-center justify-center py-2">
          <h1 className="text-4xl font-bold mb-4">Liste des produits</h1>
          <div className="form-list flex justify-center gap-4 p-2 bg-gray-100 w-full">
            <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2" />
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2" value={upc} onChange={(e) => setUpc(e.target.value)} />
            <button className="add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer">Ajouter produit à la liste</button>
          </div>
        </section>
      </main>
    </div>
  );
}
