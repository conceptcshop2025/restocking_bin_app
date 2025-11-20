"use client";
import Image from "next/image";

export default function Home() {
  function getData() {
    const baseUrl = '/api/ipacky';
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
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2" />
            <button className="add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer" onClick={() => getData()}>Ajouter produit à la liste</button>
          </div>
        </section>
      </main>
    </div>
  );
}
