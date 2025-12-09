"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Product, ToastProps, HistoryListProps } from "./types/type";
import Modal from "./components/Modal/Modal";
import { Loader } from "./components/Loader/Loader";
import Toast from "./components/Toast/Toast";
import HistoryList from "./components/HistoryList/HistoryList";
import BinValidator from "./components/BinValidator/BinValidator";

export default function Home() {
  const appVersion:string = "3.3.0";
  const [upc, setUpc] = useState<string>("");
  const [debouncedUpc, setDebouncedUpc] = useState<string>("");
  const [productList, setProductList] = useState<Array<Product>>([]);
  const [contentModal, setContentModal] = useState<{ content: React.ReactNode | null; onClose: () => void; type?: string }>({content: null, onClose: () => {}, type: undefined});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<ToastProps | null>(null);
  const [showInputNameList, setShowInputNameList] = useState<boolean>(false);
  const [nameList, setNameList] = useState<string>("");
  const [showHistoryListModal, setShowHistoryListModal] = useState<boolean>(false);
  const [listFromHistory, setListFromHistory] = useState<HistoryListProps | null>(null);
  const [latestSavedUpc, setLatestSavedUpc] = useState<string>("");
  const [searchUpcInput, setSearchUpcInput] = useState<string>("");
  const [debouncedSearchUpcInput, setDebouncedSearchUpcInput] = useState<string>("");

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
    const handler = setTimeout(() => {
      setDebouncedSearchUpcInput(searchUpcInput);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchUpcInput]);

  useEffect(() => {
    if (debouncedSearchUpcInput) {
      latestAddedProduct(debouncedSearchUpcInput);
    }
  }, [debouncedSearchUpcInput]);

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
          restocked: false,
        }
        setProductList(prevList => [...prevList, newProduct]);
      }
      setTimeout(() => {latestAddedProduct(data.data[0].barcode)}, 200);
      setUpc("");
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  function toggleCheckedProduct(element:HTMLElement, successItem?:boolean) {
    const parentElement = element.closest('.product-card');
    if(successItem) {
      parentElement?.classList.add('checked-product', 'bg-green-600');
      element.classList.add('bg-red-600');
      element.innerText = "Annuler";
      if (parentElement) updateRestockedStatus(parentElement.id, true);
      setContentModal({content: null, onClose: () => {}});
    } else {
      parentElement?.classList.remove('checked-product', 'bg-green-600');
      element.classList.remove('bg-red-600');
      element.innerText = "Fini";
      if (parentElement) updateRestockedStatus(parentElement.id, false);
    }
    
    return;
  }

  async function saveList() {
    setIsLoading(true);
    if (listFromHistory !== null) {
      await fetch(`/api/conceptc?id=${listFromHistory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: listFromHistory.id,
          products: productList,
        }),
      })
      .then(response => response.json())
      .then(data => {
        initToast({type: "success", message: "La liste de produits a été metter à jour avec succès !" });
      })
      .catch((error) => {
        initToast({type: "error", message: "Une erreur est survenue lors de la mise à jour de la liste de produits." });
      })
      .finally(() => {
        setIsLoading(false);
        setProductList([]);
        setNameList("");
        setListFromHistory(null);
      });
    } else {
      if (productList.length === 0) {
        initToast({type: "info", message: "La liste de produits est vide. Veuillez ajouter des produits avant de sauvegarder." });
        setIsLoading(false);
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
          initToast({type: "success", message: "La liste de produits a été sauvegardée avec succès !" });
        })
        .catch((error) => {
          initToast({type: "error", message: "Une erreur est survenue lors de la sauvegarde de la liste de produits." });
        })
        .finally(() => {
          setIsLoading(false);
          setProductList([]);
          setNameList("");
          setListFromHistory(null);
        });
      }
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

  function initToast(content:ToastProps | null) {
    setShowToast(content);
    if (content) {
      setTimeout(() => { setShowToast(null); }, 6000);
    }
  }

  async function setProductListFromHistoryList(selectedItem:HistoryListProps) {
    setIsLoading(true);
    setListFromHistory(selectedItem);
    setProductList(selectedItem.products);
    setIsLoading(false);
    setShowHistoryListModal(false);
  }

  async function updateRestockedStatus(upc:string, status:boolean) {
    const findProduct = productList.find(product => product.upc === upc);
    if (findProduct) {
      findProduct.restocked = status;
      setProductList([...productList]);
    }
    return;
  }

  function latestAddedProduct(upc:string) {
    setLatestSavedUpc(upc);
    const productPosition = document.getElementById(upc);
    if (productPosition) {
      productPosition.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      initToast({type: "error", message: "N'est pas possible de trouver le produit avec le code UPC ajouté." });
    }

    setTimeout(() => {
      setSearchUpcInput("");
    }, 1000);
  }

  function validateBin(productUpc:string, productQuantity:number, binLocations:string[] | string, productItem:HTMLElement, onValidate?: (item:HTMLElement) => void) {
    setContentModal({
      content: <BinValidator
        productUpc={productUpc}
        productQuantity={productQuantity}
        binLocations={binLocations}
        productItem={productItem}
        onValidate={(item, successItem) => toggleCheckedProduct(item, successItem)} />,
      type: "bin-validator",
      onClose: () => setContentModal({content: null, onClose: () => {}})
    })
  }

  function disableCheckedItem(element:HTMLElement) {
    const parentElement = element.closest('.product-card');
    parentElement?.classList.remove('checked-product', 'bg-green-600');
    element.classList.remove('bg-red-600');
    element.innerText = "Fini";
    if (parentElement) updateRestockedStatus(parentElement.id, false);
  }

  return (
    <div>
      <main>
        { showToast && <Toast type={showToast.type} message={showToast.message} />}
        {
          contentModal.content && <Modal content={contentModal.content} onClose={contentModal.onClose} />
        }
        { showHistoryListModal && <HistoryList onClose={() => setShowHistoryListModal(false)} onToast={(toast) => initToast(toast)} onSelectItem={(item) => setProductListFromHistoryList(item)} /> }
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
        </section>
        <div className="form-list flex justify-between gap-4 p-2 bg-gray-100 w-full sticky top-0 items-start">
          <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2 hidden" />
          <div className="flex justify-between items-center gap-2">
            <label htmlFor="upc">Ajoute produit: </label>
            <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={upc} onChange={(e) => setUpc(e.target.value)} />
          </div>
          <div className="flex justify-between items-center gap-2">
            <label htmlFor="upc">Chercher un produit: </label>
            <input type="text" id="search-upc" placeholder="UPC" name="search-upc" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={searchUpcInput} onChange={(e) => setSearchUpcInput(e.target.value)} />
          </div>
          <div className="action-buttons flex gap-4 justify-end items-start">
            <div className="actions-group flex flex-col gap-2">
              <button className={`add-product bg-green-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out cursor-pointer ${ showInputNameList && nameList.length === 0 && 'pointer-events-none bg-neutral-400' }`} onClick={() => saveList()}>Garder la liste</button>
              <div className="manual-name-list">
                <input type="checkbox" onChange={(e) => toggleInputNameList(e.target.checked)} id="show-input-name-list" name="show-input-name-list" />
                <label className="ml-2" htmlFor="show-input-name-list">Ajouter manuellement le nom de liste</label>
                {
                  showInputNameList && (
                    <input type="text" id="name-list" name="name-list" placeholder="Nom de liste" className="border border-zinc-300 rounded-md px-2 py-2 block w-full" value={nameList} onChange={(e) => setNameList(e.target.value)} />
                  )
                }
              </div>
            </div>
            <button className="add-product bg-sky-600 py-2 px-4 rounded-md text-neutral-100 hover:bg-sky-800 duration-300 ease-in-out cursor-pointer" onClick={() => { setShowHistoryListModal(true) }}>Historique</button>
          </div>
        </div>
        {
          isLoading ?
            <Loader /> :
            <section className="py-2">
              {
                listFromHistory && (
                  <p className="py-4 px-2 text-2xl">{ listFromHistory.name }</p>
                )
              }
              <div className="heading-table grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full items-center">
                <p>Info du produit</p>
                <p className="text-center">UPC</p>
                <p className="text-center">Qty Disponible</p>
                <p className="text-center">Qty reservé</p>
                <p className="text-center">QTY à approv...</p>
                <p className="text-center">HTSUS</p>
                <p className="text-center">Bin</p>
                <p className="text-center">Statut</p>
              </div>
              {
                productList.map((product:Product, index:number) => {
                  return (
                    <div key={index} className={`product-card grid grid-cols-6 gap-4 font-bold border-b-2 border-zinc-300 p-2 w-full items-center item--${index} ${product.restocked && 'checked-product bg-green-600!'} ${latestSavedUpc === product.upc && 'bg-sky-200'}`} id={product.upc}>
                      <div className="text-sm font-semibold">
                        <div className="container-image">
                          <Image
                            src={product.imageUrl || ''}
                            alt={product.name}
                            width={100}
                            height={60}
                            onClick={() => setContentModal({
                              content: (
                                <Image 
                                  src={product.imageUrl || ''}
                                  alt="product-image"
                                  width={1920}
                                  height={1080}
                                  className="rounded-lg h-[90dvh] w-full" />
                              ) as React.ReactNode,
                              onClose: () => setContentModal({content: null, onClose: () => {}})
                            })}
                            className="cursor-pointer" />
                        </div>
                        <h2>{product.name}</h2>
                        <p className="text-left"><strong>SKU: {product.sku}</strong></p>
                      </div>
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
                      <div className="flex flex-col justify-center item-center gap-4">
                        <button
                          className={`py-2 px-4 bg-green-600 cursor-pointer rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out mx-auto h-fit w-full ${product.restocked && 'bg-red-600'}`}
                          onClick={ (e) => !product.restocked ? validateBin(product.upc, product.quantityToReStock, product.binLocation, e.currentTarget) : disableCheckedItem(e.currentTarget) }>
                          { product.restocked ? "Annuler" : "Fini" }
                        </button>
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
