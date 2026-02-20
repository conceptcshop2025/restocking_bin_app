"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Product, ToastProps, HistoryListProps, ProductSold } from "../types/type";
import Modal from "../components/Modal/Modal";
import { Loader } from "../components/Loader/Loader";
import Toast from "../components/Toast/Toast";
import HistoryList from "../components/HistoryList/HistoryList";
import BinValidator from "../components/BinValidator/BinValidator";
import { TrashIcon, ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import CsvImport from "../components/CsvImport/CsvImport";

export default function Home() {
  const appVersion:string = "5.1.0";
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
  const [sku, setSku] = useState<string>("");
  const [debouncedSku, setDebouncedSku] = useState<string>("");

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
      getData(debouncedUpc, 'upc');
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSku(sku);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [sku]);

  useEffect(() => {
    if (debouncedSku) {
      getData(debouncedSku, 'sku');
    }
  }, [debouncedSku]);

  function getData(code:string, type: "upc" | "sku") {
    const baseUrl = `/api/ipacky?code=${code}&type=${type}`;
    fetch(baseUrl)
    .then(response => response.json())
    .then(data => {
      const productExists = productList.some(
        product => product.upc === data.data[0].barcode
      );

      if (productExists) {
        setProductList(prevList =>
          prevList.map(product =>
            product.upc === data.data[0].barcode
              ? {
                  ...product,
                  quantityToReStock: product.quantityToReStock + 1,
                }
              : product
          )
        );
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
          bAlias: data.data[0].barcodeAliases || [],
          qtyInBin: 0,
        };

        setProductList(prevList => [...prevList, newProduct]);
      }

      getBinCapaity(data.data[0].sku);

      setTimeout(() => {
        latestAddedProduct(data.data[0].barcode);
      }, 200);

      if (type === "upc") {
        setUpc("");
      } else {
        setSku("");
      }
    })
    .catch(() => {
      initToast({type: "error", message: "Il n'est pas possible de trouver le produit à ajouter à la liste. Assurez-vous que le code que vous entrez appartient bien au champ UPC ou SKU, selon le cas." });
      setUpc("");
      setSku("");
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
    setProductList(
      selectedItem.products.map(product => ({
        ...product,
        quantityToReStock: product.quantityToReStock ?? 1,
      }))
    );
    setIsLoading(false);
    setShowHistoryListModal(false);
  }

  async function updateRestockedStatus(upc:string, status:boolean) {
    const findProduct = productList.find(product => product.upc === upc);
    if (findProduct) {
      findProduct.restocked = status;
      setProductList([...productList]);
    }

    if (status === true) {
      await updateRemainingQuantityToProductInfo(findProduct as Product);
    }

    return;
  }

  function latestAddedProduct(upc:string) {
    setLatestSavedUpc(upc);

    let productPosition = null;
    const findProductBySku = productList.find(key => key.sku === upc);

    if (findProductBySku) {
      productPosition = document.getElementById(findProductBySku.upc);
    } else {
      productPosition = document.getElementById(upc);
    }

    if (productPosition) {
      productPosition.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      initToast({type: "error", message: "N'est pas possible de trouver le produit avec le code UPC ajouté." });
    }

    setTimeout(() => {
      setSearchUpcInput("");
    }, 1000);
  }

  function validateBin(productUpc:string, productQuantity:number, binLocations:string[] | string, productItem:HTMLElement, bAlias:string[] | [],  onValidate?: (item:HTMLElement) => void) {
    setContentModal({
      content: <BinValidator
        productUpc={productUpc}
        productQuantity={productQuantity}
        binLocations={binLocations}
        productItem={productItem}
        bAlias={bAlias}
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

  function removeProductFromList(upc:string) {
    const listFiltered = productList.filter(key => key.upc !== upc);
    setProductList(listFiltered);
  }

  // update product remaining quantity after restocking of Neon DB
  async function updateRemainingQuantityToProductInfo(product:Product) {
    try {
      const response = await fetch('/api/conceptc/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
      });

      const data = await response.json();

      if (data.data.length === 0) {
        initToast({type: "error", message: "Le produit n'a pas été trouvé dans la base de données pour mettre à jour la quantité restante." });
        return;
      } else {
        initToast({type: "success", message: `La quantité restante du produit (UPC: ${product.upc}) a été mise à jour avec succès.` });
      }
      

    } catch (error) {
      initToast({type: "error", message: "Une erreur est survenue lors de la mise à jour de la quantité restante du produit." });
    }
  }

  // get bin capacity from Neon DB
  async function getBinCapaity(sku: string) {
    try {
      const response = await fetch(`/api/conceptc/restock?sku=${encodeURIComponent(sku)}`);
      const data = await response.json();

      if (data.data && data.data.remaining_quantity !== undefined) {
        setProductList(prevList =>
          prevList.map(product =>
            product.sku === sku
              ? { ...product, qtyInBin: data.data.remaining_quantity }
              : product
          )
        );
      }
    } catch {
      // bin capacity is supplementary info — fail silently
    }
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
          <Link
            href="/"
            className="border border-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sky-500 hover:bg-sky-700 hover:text-neutral-50 ease-in-out duration-300 cursor-pointer absolute left-4 top-4 text-xs">
            <ArrowUturnLeftIcon className="size-4"/>
            <span className="">Retourner à la page d'accueil</span>
          </Link>

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
          <div className="flex flex-col justify-between items-center gap-2">
            <div className="flex justify-between items-center gap-2">
              <label htmlFor="upc">Ajoute produit par UPC: </label>
              <input type="text" id="upc" placeholder="UPC" name="upc" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={upc} onChange={(e) => setUpc(e.target.value)} />
            </div>
            <div className="flex justify-between items-center gap-2">
              <label htmlFor="sku">Ajoute produit par SKU: </label>
              <input type="text" id="sku" placeholder="SKU" name="sku" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="flex justify-start w-full">
              <CsvImport onLoading={(value) => setIsLoading(value)} onProductListFromFile={(list) => setProductList(list)} />
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <label htmlFor="upc">Chercher un produit: </label>
            <input type="text" id="search-upc" placeholder="UPC ou SKU" name="search-upc" className="border border-zinc-300 rounded-md px-2 py-2 h-fit" value={searchUpcInput} onChange={(e) => setSearchUpcInput(e.target.value)} />
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
            <Loader classes="py-4" /> :
            <section>
              {
                listFromHistory && (
                  <p className="py-4 px-2 text-2xl">{ listFromHistory.name }</p>
                )
              }
              <table className="table-fixed w-full">
                <thead className="sticky top-[110px] bg-neutral-200">
                  {
                    productList.length > 0 && (
                      <tr>
                        <th className="py-6">Info du produit</th>
                        <th className="text-center py-6">UPC</th>
                        <th className="text-center py-6">Qty Disponible</th>
                        <th className="text-center py-6">Qty reservé</th>
                        <th className="text-center py-6">QTY à approv...</th>
                        <th className="text-center py-6">HTSUS</th>
                        <th className="text-center py-6">Qty dans Bin</th>
                        <th className="text-center py-6">Bin</th>
                        <th className="text-center py-6">Statut</th>
                      </tr>
                    )
                  }
                </thead>
                <tbody>
                  {
                    productList.map((product:Product, index:number) => {
                      return (
                        <tr
                          key={index}
                          className={`product-card font-bold border-b-2 border-zinc-300 item--${index} ${product.restocked && 'checked-product bg-green-600!'} ${(latestSavedUpc === product.upc || latestSavedUpc === product.sku) && 'bg-sky-200'}`}
                          id={product.upc}>
                          <td className="p-4 text-sm font-semibold">
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
                          </td>
                          <td className="text-center">
                            <span className="block">{ product.upc }</span>
                            {
                              product.bAlias &&
                                product.bAlias.length > 0 && 
                                  <div className="b-alias">
                                    <span className="text-xs">B-Alias:</span>
                                    <ul>
                                      {
                                        product.bAlias.map(code => (
                                          <li className="text-xs" key={code}>{ code }</li>
                                        ))
                                      }
                                    </ul>
                                  </div>
                            }
                          </td>
                          <td className="text-center">{product.quantityAvailable}</td>
                          <td className="text-center">{product.quantityOnHand}</td>
                          <td className="text-center">
                            <span>
                              <input
                                type="number"
                                name="quantity-to-re-stock"
                                id={`qty-to-re-stock-for-product--${product.upc}`}
                                className="w-full text-center"
                                min={1}
                                value={product.quantityToReStock}
                                onChange={(e) => {
                                  const value = Math.max(1, Number(e.target.value) || 1);

                                  setProductList(list =>
                                    list.map(p =>
                                      p.upc === product.upc
                                        ? { ...p, quantityToReStock: value }
                                        : p
                                    )
                                  );
                                }}
                              />
                            </span>
                          </td>
                          <td className="text-center">{product.htsus || "N/A"}</td>
                          <td className="text-center">{product.qtyInBin !== undefined ? product.qtyInBin : "N/A"}</td>
                          <td>
                            <div className="flex flex-wrap gap-2">
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
                          </td>
                          <td className="p-4">
                            <button
                              className={`py-2 px-4 bg-green-600 cursor-pointer rounded-md text-neutral-100 hover:bg-green-800 duration-300 ease-in-out mx-auto h-fit w-full mb-2 ${product.restocked && 'bg-red-600'}`}
                              onClick={ (e) => !product.restocked ? validateBin(product.upc, product.quantityToReStock, product.binLocation, e.currentTarget, product.bAlias || []) : disableCheckedItem(e.currentTarget) }>
                              { product.restocked ? "Annuler" : "Fini" }
                            </button>
                            <button
                              className="py-2 px-2 bg-red-600 cursor-pointer rounded-md w-full flex justify-center items-center hover:bg-red-800 duration-300 ease-in-out"
                              onClick={() => removeProductFromList(product.upc)}>
                              <TrashIcon className="text-neutral-50 size-6" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </section>
        }
      </main>
    </div>
  );
}
