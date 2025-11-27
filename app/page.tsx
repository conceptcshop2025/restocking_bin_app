"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Product } from "./types/type";
import { Loader } from "./components/Loader/Loader";

export default function Home() {
  const [upc, setUpc] = useState<string>("");
  const [debouncedUpc, setDebouncedUpc] = useState<string>("");
  const [productList, setProductList] = useState<Array<Product>>([]);
  const [upcList, setUpcList] = useState<Array<string>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUpc(upc);
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [upc]);

  useEffect(() => {
    if (debouncedUpc) {
      // getData(debouncedUpc);
      setUpcList(prevList => [...prevList, debouncedUpc]);
      setUpc("");
    }
  }, [debouncedUpc]);

  useEffect(() => {
    if (!productList || productList.length === 0) return;

    // group by UPC and detect duplicates
    const map = new Map<string, Product>();
    let foundDuplicate = false;

    for (const p of productList) {
      const key = p.upc;
      if (!map.has(key)) {
        map.set(key, { ...p });
      } else {
        foundDuplicate = true;
        const existing = map.get(key)!;
        existing.quantityToReStock += 1;
      }
    }

    const processed = foundDuplicate ? Array.from(map.values()) : productList;

    // sort processed array (replace comparator with your actual sort)
    const sorted = [...processed].sort((a, b) => a.name.localeCompare(b.name));

    if (JSON.stringify(sorted) !== JSON.stringify(productList)) {
      setProductList(sorted);
    }
  }, [productList, setProductList]);

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
          htsus: data.data[0].htsUS || null,
          imageUrl: data.data[0].imageURL || "",
        }
        setProductList(prevList => [...prevList, newProduct]);
      }
      setUpc("");
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  function getAllData() {
    setIsLoading(true);
    upcList.forEach((upc:string) => {
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
            htsus: data.data[0].htsUS || null,
            imageUrl: data.data[0].imageURL || "",
          }
          setProductList(prevList => [...prevList, newProduct]);
        }
        setUpc("");
      })
      .catch((error) => {
        console.error('Error:', error);
      })
      .finally(() => {
        setIsLoading(false);
        setUpcList([]);
      });
    });
  }

  function checkedProduct(element:HTMLElement) {
    element.closest('.product-card')?.classList.add('bg-green-600', 'opacity-50');
  }

  return (
    <div>
      <main>
        <header className="flex justify-center p-2">
          <Image
            src="/concept-c-logo.webp"
            alt="Concept C logo"
            width={300}
            height={60}
            priority
          />
        </header>
        <section className="flex flex-col items-center justify-center py-2">
          <h1 className="text-4xl font-bold">Liste des produits</h1>
          <p className="mb-4"><small>V.1.5.0</small></p>
          <div className="form-list flex justify-center gap-4 p-2 bg-gray-100 w-full">
            <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2 hidden" />
            {/* <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2 py-2" value={upc} onChange={(e) => setUpc(e.target.value)} /> */}
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2 py-2" value={upc} onChange={(e) => setUpc(e.target.value)} />
            <button className="add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer" onClick={() => getAllData()}>Créer liste</button>
            <button className="add-product bg-sky-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer" onClick={() => setProductList([])}>Nouvelle liste</button>
          </div>
        </section>
        <section className="py-2">
          <div className="flex gap-4 justify-center flex-wrap">
            {
              upcList.map((upcCode: string, index:number) => {
                return (
                  <span key={index} className="p-2 bg-neutral-200 inline-block h-fit rounded-md">{upcCode}</span>
                )
              })
            }
          </div>
        </section>
        {
          isLoading ?
            <Loader text="chargement" /> :
            <section className="py-2">
              <div className="heading-table grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full">
                <p>Image</p>
                <p>Nom du produit</p>
                <p className="text-center">SKU</p>
                <p className="text-center">UPC</p>
                <p className="text-center">Quantité Disponible</p>
                <p className="text-center">Quantité reservé</p>
                <p className="text-center">Quantité à approvisionner</p>
                <p className="text-center">HTSUS</p>
                <p className="text-center">Bin</p>
                <p className="text-center">Statut</p>
              </div>
              {
                productList.map((product:Product, index:number) => {
                  return (
                    <div key={index} className={`product-card grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full items-center item--${index}`} id={product.upc}>
                      <div className="container-image">
                        <Image
                          src={product.imageUrl || ''}
                          alt={product.name}
                          width={200}
                          height={60} />
                      </div>
                      <div className="text-sm font-semibold">
                        <h2>{product.name}</h2>
                      </div>
                      <p className="text-center">{product.sku}</p>
                      <p className="text-center">{product.upc}</p>
                      <p className="text-center">{product.quantityAvailable}</p>
                      <p className="text-center">{product.quantityOnHand}</p>
                      <p className="text-center">{product.quantityToReStock}</p>
                      <p className="text-center">{product.htsus || "N/A"}</p>
                      <div className="flex justify-start gap-4 flex-wrap">
                        {
                          product.binLocation.length > 0 ? (
                            (Array.isArray(product.binLocation) ? product.binLocation : [product.binLocation]).map((location: string, idx: number) => {
                              return (
                                <span key={idx} className="p-2 bg-neutral-200 inline-block h-fit rounded-md">{location}</span>
                              )
                            })
                          ) : <p>Il n'y a pas de Bin asginé à ce produit.</p>
                        }
                        
                      </div>
                      <div className="flex justify-center">
                        <button className="py-2 px-4 bg-green-600 cursor-pointer rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out mx-auto h-fit" onClick={ (e) => checkedProduct(e.currentTarget) }>Fini</button>
                      </div>
                    </div>
                  )
                })
              }
            </section>
        }
      </main>
    </div>
  );
}
