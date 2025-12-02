"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Product } from "./types/type";
import Modal from "./components/Modal/Modal";
import { Loader } from "./components/Loader/Loader";
import Toast from "./components/Toast/Toast";
import HistoryList from "./components/HistoryList/HistoryList";

export default function Home() {
  const appVersion:string = "2.0.0";
  const [upc, setUpc] = useState<string>("");
  const [debouncedUpc, setDebouncedUpc] = useState<string>("");
  const [productList, setProductList] = useState<Array<Product>>([]);
  const [contentModal, setContentModal] = useState<{ content: React.ReactNode | null; onClose: () => void }>({content: null, onClose: () => {}});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<{type: "success" | "error" | "info", message: string} | null>(null);
  const [showInputNameList, setShowInputNameList] = useState<boolean>(false);
  const [nameList, setNameList] = useState<string>("");
  const [showHistoryListModal, setShowHistoryListModal] = useState<boolean>(false);

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
      let locA = a.binLocation[0];
      const locB = b.binLocation[0];

      if (locA === undefined) {
        locA = '999.99.99';
      }

      return locA.localeCompare(locB);
    });
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

  function toggleCheckedProduct(element:HTMLElement) {
    const parentElement = element.closest('.product-card');
    if (parentElement?.classList.contains('checked-product')) {
      parentElement.classList.remove('checked-product', 'bg-green-600');
      element.classList.remove('bg-red-600');
      element.innerText = "Fini";
      return;
    } else {
      parentElement?.classList.add('checked-product', 'bg-green-600');
      element.classList.add('bg-red-600');
      element.innerText = "Annuler";
    }
    return;
  }

  async function saveList() {
    setIsLoading(true);
    if (productList.length === 0) {
      setShowToast({type: "info", message: "La liste de produits est vide. Veuillez ajouter des produits avant de sauvegarder." });
      setIsLoading(false);
      setTimeout(() => { setShowToast(null); }, 6000);
    } else {
      await fetch('/api/conceptc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameList.length > 0 ? nameList : `Restocking Bin - ${new Date().toLocaleString()}`,
          products: productList,
        }),
      })
      .then(response => response.json())
      .then(data => {
        setShowToast({type: "success", message: "La liste de produits a été sauvegardée avec succès !" });
      })
      .catch((error) => {
        setShowToast({type: "error", message: "Une erreur est survenue lors de la sauvegarde de la liste de produits." });
      })
      .finally(() => {
        setIsLoading(false);
        setProductList([]);
        setNameList("");
        setTimeout(() => { setShowToast(null); }, 6000);
      });
    }
  }

  function toggleInputNameList(isChecked?:boolean) {
    if (isChecked !== undefined) {
      setShowInputNameList(isChecked);
    } else {
      setShowInputNameList(!showInputNameList);
      setNameList("");
    }
  }

  return (
    <div>
      <main>
        { showToast && <Toast type={showToast.type} message={showToast.message} />}
        {
          contentModal.content && <Modal content={contentModal.content} onClose={contentModal.onClose} />
        }
        { showHistoryListModal && <HistoryList onClose={() => setShowHistoryListModal(false)} /> }
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
          <p className="mb-4"><small>V.{appVersion}</small></p>
          <div className="form-list flex justify-between gap-4 p-2 bg-gray-100 w-full">
            <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2 hidden" />
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={upc} onChange={(e) => setUpc(e.target.value)} />
            <div className="action-buttons flex gap-4 justify-end items-start">
              <div className="actions-group flex flex-col gap-2">
                <button className={`add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer ${ showInputNameList && nameList.length === 0 && 'pointer-events-none bg-neutral-400' }`} onClick={() => saveList()}>Garder la liste</button>
                <div className="manual-name-list">
                  <input type="checkbox" onChange={(e) => toggleInputNameList(e.target.checked)} id="show-input-name-list" name="show-input-name-list" />
                  <label className="ml-2" htmlFor="show-input-name-list">Ajouter manuellement le nom de liste</label>
                  {
                    showInputNameList && (
                      <input type="text" id="name-list" name="name-list" placeholder="Nom de liste" className="border border-zinc-300 rounded-md px-2 py-2 block w-full" onChange={(e) => setNameList(e.target.value)} />
                    )
                  }
                </div>
              </div>
              <button className="add-product bg-sky-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-sky-800 duration-300 ease-in-out cursor-pointer" onClick={() => { setShowHistoryListModal(true) }}>Historique des listes</button>
            </div>
          </div>
        </section>
        {
          isLoading ?
            <Loader /> :
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
                          height={60}
                          onClick={() => setContentModal({
                            content: (
                              <Image 
                                src={product.imageUrl || ''}
                                alt="product-image"
                                width={960}
                                height={540}
                                className="rounded-lg h-dvh w-full" />
                            ) as React.ReactNode,
                            onClose: () => setContentModal({content: null, onClose: () => {}})
                          })}
                          className="cursor-pointer" />
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
                                <span key={idx} className="p-2 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans">{location}</span>
                              )
                            })
                          ) : <p className="font-sans">Il n'y a pas de Bin asginé à ce produit.</p>
                        }
                        
                      </div>
                      <div className="flex justify-center">
                        <button className="py-2 px-4 bg-green-600 cursor-pointer rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out mx-auto h-fit" onClick={ (e) => toggleCheckedProduct(e.currentTarget) }>Fini</button>
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
