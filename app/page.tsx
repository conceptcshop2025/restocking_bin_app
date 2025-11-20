"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Product } from "./types/type";

export default function Home() {
  const [upc, setUpc] = useState("");
  const [debouncedUpc, setDebouncedUpc] = useState("");
  const [productList, setProductList] = useState<Array<Product>>([]);

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
      const newProduct: Product = {
        sku: data.data[0].sku || "N/A",
        upc: data.data[0].barcode || "N/A",
        name: data.data[0].name || "N/A",
        quantityAvailable: data.data[0].quantityAvailable || 0,
        binLocation: data.data[0].binLocations || [],
      }
      setProductList(prevList => [...prevList, newProduct]);
      setUpc("");
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
        <section className="py-2">
          <div className="heading-table grid grid-cols-4 gap-4 font-bold border-b-2 border-zinc-300 p-2">
            <p>Information du produit</p>
            <p>UPC</p>
            <p>Quantité</p>
            <p>Bin</p>
          </div>
          {
            productList.map((product:Product, index:number) => {
              return (
                <div key={index} className={`product-card grid grid-cols-4 gap-4 font-bold border-b-2 border-zinc-300 p-2 item--${index}`}>
                  <div className="text-sm font-semibold mb-2">
                    <h2>{product.name}</h2>
                    <small>{product.sku}</small>
                  </div>
                  <p>{product.upc}</p>
                  <p>{product.quantityAvailable}</p>
                  <div className="flex justify-start gap-4 flex-wrap">
                    {
                      (Array.isArray(product.binLocation) ? product.binLocation : [product.binLocation]).map((location: string, idx: number) => {
                        return (
                          <span key={idx} className="p-2 bg-neutral-200 inline-block h-fit">{location}</span>
                        )
                      })
                    }
                  </div>
                </div>
              )
            })
          }
        </section>
      </main>
    </div>
  );
}
