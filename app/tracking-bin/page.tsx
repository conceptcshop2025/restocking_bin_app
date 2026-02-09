"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUturnLeftIcon, ArchiveBoxArrowDownIcon } from "@heroicons/react/16/solid";
import { useState, useEffect } from "react";
import type { ProductSold, ToastProps } from "../types/type";
import BinStatus from "../components/BinStatus/BinStatus";
import pLimit from "p-limit";
import { Loader } from "../components/Loader/Loader";
import Toast from "../components/Toast/Toast";
import './TrackingBinPage.css';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function TrackingBinPage() {
  const appVersion = "2.5.0";
  const MySwal = withReactContent(Swal);
  const [productSoldList, setProductSoldList] = useState<ProductSold[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<ToastProps | null>(null);
  const [filter, setFilter] = useState<string>('none');
  const [sortBy, setSortBy] = useState<string>('percentage');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState<string>(searchInput);

  function initToast(content:ToastProps | null) {
    setShowToast(content);
    if (content) {
      setTimeout(() => { setShowToast(null); }, 6000);
    }
  }

  // get from NeonDB
  async function getData() {
    setIsLoading(true);

    try {
      const baseUrl = `/api/conceptc/warehouse`;
      const response = await fetch(baseUrl);

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.data.length === 0) {
        const lastSync = await fetch(`/api/conceptc/sync`);
        const syncData = await lastSync.json();
        await getDataFromShopifyReports([], syncData);
        try {
          const postDate = fetch(`/api/conceptc/sync`,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              date: new Date().toISOString()
            })
          });
          const responsePostDate = await postDate;

          if (!responsePostDate.ok) {
            initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation` });
          }
          initToast({ type: "success", message: `La date de synchronisation a été mise à jour avec succès.` });
        } catch(error) {
          initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation: ${String(error)}` });
        }
      } else {
        const productList = data.data;

        try {
          const lastSync = await fetch(`/api/conceptc/sync`);
          const syncData = await lastSync.json();

          if (syncData.data) {
            const syncDate = new Date(syncData.data.date);
            const today = new Date();
            const isSameDay = syncDate.getFullYear() === today.getFullYear() &&
                              syncDate.getMonth() === today.getMonth() &&
                              syncDate.getDate() === today.getDate();
            if (!isSameDay) {
              getDataFromShopifyReports(productList, syncData);
              try {
                const postDate = fetch(`/api/conceptc/sync`,{
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    date: new Date().toISOString()
                  })
                });
                const responsePostDate = await postDate;

                if (!responsePostDate.ok) {
                  initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation` });
                }
                initToast({ type: "success", message: `La date de synchronisation a été mise à jour avec succès.` });
              } catch(error) {
                initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation: ${String(error)}` });
              }
            } else {
              // if same day, just complete data from NeonDB
              setProductSoldList(reorderProductList(productList));
              setIsLoading(false);
            }
          } else {
            initToast({ type: "error", message: "Erreur lors de la récupération des données de synchronisation." });
            try {
              const postDate = fetch(`/api/conceptc/sync`,{
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  date: new Date().toISOString()
                })
              });
              const responsePostDate = await postDate;

              if (!responsePostDate.ok) {
                initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation` });
              }
              initToast({ type: "success", message: `La date de synchronisation a été mise à jour avec succès.` });
            } catch(error) {
              initToast({ type: "error", message: `Erreur lors de la sauvegarde de la date de synchronisation: ${String(error)}` });
            }
            await completeProductListData(productList);
          }
        } catch(error) {
          initToast({ type: "error", message: `Erreur lors de la récupération des données de synchronisation: ${String(error)}` });
        }
        
      }
    } catch(error) {
      initToast({ type: "error", message: `Erreur lors de la récupération des données: ${String(error)}` });
    }
  }

  // get from Shopify Reports API
  async function getDataFromShopifyReports(productList?: ProductSold[], lastSync?: any | null){
    
    let params = {
      date: '',
    }
    
    if (lastSync !== null) {
      params.date = lastSync.data.date;
    } else {
      params.date = new Date().toISOString();
    }

    params.date = params.date.split('T')[0];

    try {
      const baseUrl = `/api/shopify/reports`;
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      const data = await response.json();

      const shopifyProductList = data.data.rows;

      shopifyProductList.map((item:any) => {
        if(productList) {
          const matchedProduct = productList?.find(product => product.sku === item.product_variant_sku);
          if( matchedProduct ) {
            matchedProduct.remaining_quantity = Number(matchedProduct.remaining_quantity) - Number(item.net_items_sold);
            matchedProduct.sold_quantity = item.net_items_sold;
          } else {
            productList.push({
              title: item.product_title,
              product_type: item.product_type,
              sku: item.product_variant_sku,
              sold_quantity: item.net_items_sold,
              upc: '',
              bin_location: [],
              htsus: null,
              image_url: '',
              remaining_quantity: 0,
              total_quantity: 0,
            });
          }
        }
      });
      
      await completeProductListData(productList);
    } catch(error) {
      initToast({ type: "error", message: `Erreur lors de la récupération des données de Shopify: ${String(error)}` });
    }
  }

  // complete data from iPacky
  async function completeProductListData(productList: ProductSold[] = []) {
    const limit = pLimit(5);
    const syncProducts = await Promise.all(
      productList.map((product) => 
        limit(async () => {
          const sku = product.sku;

          if (!sku) return product;

          try {
            const response = await fetch(`/api/ipacky?code=${sku}&type=sku`);
            const result = await response.json();

            if (response.ok && result.data[0]) {
              return {
                ...product,
                upc: result.data[0].barcode || '',
                bin_location: result.data[0].binLocations || [],
                htsus: result.data[0].htsUS || null,
                image_url: result.data[0].imageURL || '',
                total_quantity: result.data[0].quantityOnHand || 0,
                remaining_quantity: product.remaining_quantity === 0 && result.data[0].htsUS !== null ? Number(result.data[0].htsUS) - Number(product.sold_quantity || 0) : product.remaining_quantity,
                sold_quantity: product.sold_quantity || '0',
              }
            }
          } catch(error) {
            initToast({ type: "error", message: `Erreur lors de la récupération des données iPacky pour le SKU: ${sku} - ${String(error)}` });
          }

          return product;
        })
      )
    )

    setProductSoldList(reorderProductList(syncProducts));
    setIsLoading(false);
    await syncProductListToWarehouse(syncProducts);
  }

  // save productList in NeonDB
  async function syncProductListToWarehouse(syncProducts: ProductSold[] = []) {
    initToast({
      type: 'info',
      message: 'Synchronisation des produits en cours...'
    });
    const baseUrl = `/api/conceptc/warehouse`;
    try {
      const res = await fetch(baseUrl,{
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncProducts)
      });
      if (res.ok) {
        initToast({
          type: 'success',
          message: "Les produits ont été synchronisés avec succès dans l'entrepot."
        });
      }
    } catch(error) {
      initToast({ type: "error", message: `Erreur lors de la synchronisation des produits dans l'entrepot: ${String(error)}` });
    }
  }

  // update product stock bin
  async function binRestocked(product: ProductSold) {
    MySwal.fire({
      title: "Confirmer la bin pleine",
      text: `Êtes-vous sûr de vouloir marquer la bin du produit SKU: ${product.sku} comme pleine ?`,
      icon: "warning",
      imageUrl: product.image_url,
      imageWidth: 300,
      imageHeight: 180,
      showCancelButton: true,
      confirmButtonColor: "#016630",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, confirmer",
      cancelButtonText: "Annuler"
    }).then(async (result) => {
      if (result.isConfirmed) {
      
        product.remaining_quantity = product.htsus ? Number(product.htsus) : 0;
        product.sold_quantity = '0';
        const param:ProductSold[] = [];
        param.push(product);
        
        const updatedProducts = productSoldList.map(p => {
          if (product.sku === p.sku) {
            return { ...product };
          }
          return p;
        });
        setProductSoldList(updatedProducts);

        const baseUrl = `/api/conceptc/warehouse`;
        try {
          const res = await fetch(baseUrl,{
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(param)
          });
          if (res.ok) {
            MySwal.fire({
              title: "Bin mise à jour!",
              text: `La bin du produit SKU: ${product.sku} a été mise à jour avec succès.`,
              icon: "success"
            });
          }
        } catch(error) {
          MySwal.fire({
            title: "Erreur lors de la mise à jour de la bin!",
            text: `La bin du produit SKU: ${product.sku} n'a pas pu être mise à jour recharge la page pour éviter des conflits visuels.`,
            icon: "error"
          });
        }
      }

    });
  }

  // Reorder product list by bin percentage
  function reorderProductList(productList: ProductSold[] = []) {
    return [...productList].sort((a, b) => {
      const aTotal = Number(a.htsus) || 1;
      const bTotal = Number(b.htsus) || 1;

      const aPercent = (Number(a.remaining_quantity) || 0) / aTotal;
      const bPercent = (Number(b.remaining_quantity) || 0) / bTotal;

      return aPercent - bPercent;
    });
  }

  // set filter class
  function setFilterClass(htsus: string | null, remaining_quantity: string | number | undefined) {
    const total = Number(htsus) || 1;
    const remaining = Number(remaining_quantity) || 0;
    const percent = (remaining / total) * 100;

    if(!htsus) {
      return 'unknown';
    } else {
      if (percent <= 0) {
        return "out-of-stock";
      } else if (percent <= 25) {
        return "low-stock";
      } else if (percent <= 50) {
        return "medium-stock";
      } else {
        return "high-stock";
      }
    }
  }

  // change sort method
  useEffect(() => {
    if (sortBy === 'percentage') {
      setProductSoldList(reorderProductList(productSoldList));
    } else if (sortBy === 'bin-location') {
      const sortedList = [...productSoldList].sort((a, b) => {
        const aBin = typeof a.bin_location === 'string' ? JSON.parse(a.bin_location)[0] || '' : Array.isArray(a.bin_location) ? a.bin_location[0] || '' : '';
        const bBin = typeof b.bin_location === 'string' ? JSON.parse(b.bin_location)[0] || '' : Array.isArray(b.bin_location) ? b.bin_location[0] || '' : '';
        return aBin.localeCompare(bBin);
      });
      setProductSoldList(sortedList);
    }
  }, [sortBy]);

  // debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearchInput) {
      searchProduct(debouncedSearchInput);
    }
  }, [debouncedSearchInput]);

  // search product by sku or upc
  function searchProduct(code: string) {
    const findProduct = productSoldList.find(product => product.sku === code || product.upc === code);
    if (findProduct) {
      const allElements = document.querySelectorAll('.product-row-item.highlight');
      allElements.forEach(element => {
        element.classList.remove('highlight');
      });
      const index = productSoldList.indexOf(findProduct);
      const element = document.querySelector(`.item--${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight');
      }
    } else {
      initToast({ type: "error", message: `Aucun produit trouvé avec le SKU ou l'UPC: ${code}` });
    }

    setTimeout(() => {
      setSearchInput("");
    }, 1000);
  }

  //update remaining quantity
  function updateRemainingQty(product: ProductSold) {
    MySwal.fire({
      title: `Mettre à jour la quantité restante pour le produit SKU: ${product.sku}`,
      input: 'number',
      inputLabel: 'Quantité restante',
      inputValue: product.remaining_quantity,
      showCancelButton: true,
      confirmButtonText: "Mettre à jour",
      confirmButtonColor: "#016630",
      cancelButtonText: "Annuler",
      cancelButtonColor: "#d33",
      preConfirm: (value) => {
        const newQty = Number(value);
        if (isNaN(newQty)) {
          MySwal.showValidationMessage('Veuillez entrer une quantité valide.');
        }
        return newQty;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newQty = result.value;
        product.remaining_quantity = newQty;
        const updatedProducts = productSoldList.map(p => {
          if (product.sku === p.sku) {
            return { ...product };
          }
          return p;
        });
        setProductSoldList(updatedProducts);
        syncProductListToWarehouse([product]);
      }
    });
  }

  // show remaining quantity if exist and different from htsus
  function showRemainingQty(product: ProductSold) {
    const remainingValue = product.remaining_quantity;
    let percentageValue = "";

    if ((product.total_quantity ?? 0) <= Number(product.htsus ?? 0)) {
      percentageValue = `${Math.round((Number(product.remaining_quantity) * 100) / Number(product.total_quantity))}`;
    } else if (product.htsus && !isNaN(Math.round(((Number(product.remaining_quantity) ?? 0) / Number(product.htsus) * 100)))) {
      percentageValue = `${Math.round(((Number(product.remaining_quantity) ?? 0) / Number(product.htsus) * 100))}`;
    } 

    return `${remainingValue}${percentageValue !== "" && !isNaN(Number(percentageValue)) && Number(percentageValue) !== Infinity ? `% (${percentageValue}%)` : ''}`;
  }

  return (
    <main>
      { showToast && <Toast type={showToast.type} message={showToast.message} />}
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
        <h1 className="text-4xl font-bold">Suivi de stock des bins</h1>
        <p className="mb-4"><small>V.{appVersion}</small></p>
      </section>
      <div className="px-4 flex justify-center w-full mx-auto mb-4 gap-4">
        <button className="bg-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-4 hover:bg-sky-700 ease-in-out duration-300 cursor-pointer text-white" onClick={() => getData()}>
          Synchroniser les données des bins
        </button>
        {
          productSoldList.length > 0 &&
            <>
              <div className="filtres">
                <p>Filtres:</p>
                <select name="product-filtre" id="product-filtre" className="border-b border-sky-700" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="none">Aucun</option>
                  <option value="remove-unknown">Cacher les produits en inconnu</option>
                  <option value="view-only-out-of-stock">Montrer seulement les produits en Rupture de stock</option>
                  <option value="view-only-low-stock">Montrer seulement les produits en stock faible</option>
                  <option value="view-only-medium-stock">Montrer seulement les produits en stock moyen</option>
                  <option value="view-only-high-stock">Montrer seulement les produits en stock élevé</option>
                </select>
              </div>
              <div className="sort-list">
                <p>Trier par:</p>
                <select name="product-sort" id="product-sort" className="border-b border-sky-700" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="percentage">Pourcentage de stock</option>
                  <option value="bin-location">Emplacement du bin</option>
                </select>
              </div>
              <div className="search-bar">
                <p>Rechercher par SKU ou UPC:</p>
                <input
                  type="text"
                  className="border-b border-sky-700"
                  placeholder="Entrez le SKU ou l'UPC"
                  id="search-input"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)} />
              </div>
            </>
        }
      </div>

      {
        isLoading
          ? <Loader classes="py-4" />
          : productSoldList.length > 0 && 
              <div className="product-list">
                <table className="table-fixed w-full">
                  <thead className="sticky top-0 bg-neutral-200 z-40">
                    <tr>
                      <th className="py-6 px-4 text-left">Info du produit</th>
                      <th className="text-center py-6">Qty Total</th>
                      <th className="text-center py-6">Qty Max par Bin HTSUS</th>
                      {/* <th className="text-center py-6">Qty vendus</th> */}
                      <th className="text-center py-6">Qty restant dans la bin</th>
                      <th className="text-center py-6">Bin</th>
                      <th className="text-center py-6">Statut</th>
                    </tr>
                  </thead>
                  <tbody className={filter}>
                    {
                      productSoldList.map((product:ProductSold, index:number) => (
                        <tr
                          key={index}
                          className={`product-row-item font-bold border-b-2 border-zinc-300 item--${index} ${ product.sold_quantity === '0' && product.htsus === product.remaining_quantity?.toString() ? 'bg-green-100' : '' } ${ setFilterClass(product.htsus, product.remaining_quantity) }`}>
                          <td className="p-4 text-sm font-semibold">
                            {
                              product.image_url.length > 0 &&
                              <Image
                                src={product.image_url}
                                alt={product.title}
                                width={100}
                                height={60} />
                            }
                            <span className="block">{ product.title }</span>
                            <span className="block border-t border-zinc-300 mt-2 pt-2">
                              SKU: { product.sku }
                            </span>
                            <span className="block">
                              UPC: { product.upc }
                            </span>
                          </td>
                          <td className="text-center">
                            <span>{ product.total_quantity }</span>
                          </td>
                          <td className="text-center">
                            <span className={`${!product.htsus && 'text-red-500'}`}>{ product.htsus ? product.htsus : "inconnu" }</span>
                          </td>
                          {/* <td className="text-center">
                            <span>{ product.sold_quantity }</span>
                          </td> */}
                          <td className="text-center">
                            <span className={`${!product.htsus && 'text-red-500'}`}>
                              {
                                showRemainingQty(product)
                              }
                            </span>
                            <button
                              className="block text-sky-600 underline mt-2 text-sm mx-auto cursor-pointer"
                              onClick={() => updateRemainingQty(product)}>
                              <small>Corriger la valeur</small>
                            </button>
                          </td>
                          <td className="text-center">
                            <div className="flex flex-col gap-2 py-2">
                              {
                                typeof product.bin_location === 'string' ? 
                                  JSON.parse(product.bin_location).map((bin:string, idx:number) => (
                                    <span
                                      key={idx}
                                      className="p-2 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans">
                                      { bin }
                                    </span>
                                )) : Array.isArray(product.bin_location) ?
                                product.bin_location.map((bin, idx) => (
                                  <span key={idx} className="p-2 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans">{ bin }</span>
                                ))
                                :
                                <span>{ product.bin_location }</span>
                              }
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="flex flex-col items-center justify-center py-2 gap-4">
                              <BinStatus
                                percentage={product.remaining_quantity ? Math.round(((Number(product.remaining_quantity) ?? 0) / Number(product.htsus) * 100)) : 0} />
                              <button
                                className="bg-green-600 text-neutral-50 py-2 px-4 rounded-lg hover:bg-green-800 ease-in-out duration-300 cursor-pointer text-sm"
                                onClick={() => binRestocked(product)}>
                                Bin remplie
                                <ArchiveBoxArrowDownIcon className="ml-2 inline h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
      }
    </main>
  )
}