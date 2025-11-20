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
      getData(debouncedUpc);
    }
  }, [debouncedUpc]);

  useEffect(() => {
    if(productList.length === 0) return;

    const sorted = [...productList].sort((a, b) => {
      const locA = a.binLocation[0];
      const locB = b.binLocation[0];
      return locA.localeCompare(locB);
    });
    console.log(sorted);
    setProductList(sorted);
  }, [productList.length]);

  function getData(upc:string) {
    const baseUrl = `/api/ipacky?upc=${upc}`;
    fetch(baseUrl)
    .then(response => response.json())
    .then(data => {
      const findedProductInProductList = productList.find(key => key.upc === data.data[0].barcode);
      if (findedProductInProductList) {
        findedProductInProductList.quantityToReStock += 1;
      } else {
        const newProduct: Product = {
          sku: data.data[0].sku || "N/A",
          upc: data.data[0].barcode || "N/A",
          name: data.data[0].name || "N/A",
          quantityAvailable: data.data[0].quantityAvailable || 0,
          quantityOnHand: data.data[0].quantityOnHand || 0,
          quantityToReStock: 1,
          binLocation: data.data[0].binLocations || [],
        }
        setProductList(prevList => [...prevList, newProduct]);
      }
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
            <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2 hidden" />
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2" value={upc} onChange={(e) => setUpc(e.target.value)} />
            <button className="add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer hidden">Ajouter produit à la liste</button>
          </div>
        </section>
        <section className="py-2">
          <div className="heading-table grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full">
            <p>Information du produit</p>
            <p className="text-center">SKU</p>
            <p className="text-center">UPC</p>
            <p className="text-center">Quantité Disponible</p>
            <p className="text-center">Quantité reservé</p>
            <p className="text-center">Quantité à approvisionner</p>
            <p className="text-left">Bin</p>
          </div>
          {
            productList.map((product:Product, index:number) => {
              return (
                <div key={index} className={`product-card grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full item--${index}`}>
                  <div className="text-sm font-semibold mb-2">
                    <h2>{product.name}</h2>
                  </div>
                  <p className="text-center">{product.sku}</p>
                  <p className="text-center">{product.upc}</p>
                  <p className="text-center">{product.quantityAvailable}</p>
                  <p className="text-center">{product.quantityOnHand}</p>
                  <p className="text-center">{product.quantityToReStock}</p>
                  <div className="flex justify-start gap-4 flex-wrap">
                    {
                      (Array.isArray(product.binLocation) ? product.binLocation : [product.binLocation]).map((location: string, idx: number) => {
                        return (
                          <span key={idx} className="p-2 bg-neutral-200 inline-block h-fit rounded-md">{location}</span>
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
