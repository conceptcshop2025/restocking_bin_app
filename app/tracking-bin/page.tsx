"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUturnLeftIcon, ArchiveBoxArrowDownIcon } from "@heroicons/react/16/solid";
import { useState, useEffect, useMemo } from "react";
import type { ProductSold, ToastProps } from "../types/type";
import BinStatus from "../components/BinStatus/BinStatus";
import pLimit from "p-limit";
import { Loader } from "../components/Loader/Loader";
import Toast from "../components/Toast/Toast";
import './TrackingBinPage.css';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function TrackingBinPage() {
  const appVersion = "2.10.5";
  const [productSoldList, setProductSoldList] = useState<ProductSold[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<ToastProps | null>(null);
  const [filter, setFilter] = useState<string>('none');
  const [sortBy, setSortBy] = useState<string>('percentage');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState<string>(searchInput);
  const [lastChangedProduct, setLastChangedProduct] = useState<ProductSold | null>(null);

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
              setProductSoldList([...productList]);
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
                variantTitle: result.data[0].variantTitle || ''
              }
            }
          } catch(error) {
            initToast({ type: "error", message: `Erreur lors de la récupération des données iPacky pour le SKU: ${sku} - ${String(error)}` });
          }

          return product;
        })
      )
    )

    setProductSoldList([...syncProducts]);
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

        const previousValueProduct = { ...product };
        setLastChangedProduct(previousValueProduct);
      
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
      const aHtsus = Number(a.htsus) || 0;
      const bHtsus = Number(b.htsus) || 0;

      const aTotalQuantity = Number(a.total_quantity) || 0;
      const bTotalQuantity = Number(b.total_quantity) || 0;

      const aBaseTotal =
        aTotalQuantity > 0 && aTotalQuantity <= aHtsus
          ? aTotalQuantity
          : aHtsus || 1;

      const bBaseTotal =
        bTotalQuantity > 0 && bTotalQuantity <= bHtsus
          ? bTotalQuantity
          : bHtsus || 1;

      const aPercent = (Number(a.remaining_quantity) || 0) / aBaseTotal;
      const bPercent = (Number(b.remaining_quantity) || 0) / bBaseTotal;

      return aPercent - bPercent;
    });
  }


  // set filter class
  function setFilterClass(htsus: string | null, remaining_quantity: string | number | undefined, totalQty: number | undefined) {
    const totalHtsus = Number(htsus) || 1;
    const remaining = Number(remaining_quantity) || 0; 
    const totalQuantity = Number(totalQty) || 0;

    const percent = (remaining / (totalQuantity <= totalHtsus ? totalQuantity : totalHtsus)) * 100;

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

  // sort is derived — no side-effect needed
  const sortedProductList = useMemo(() => {
    if (sortBy === 'bin-location') {
      return [...productSoldList].sort((a, b) => {
        const aBin = typeof a.bin_location === 'string' ? JSON.parse(a.bin_location)[0] || '' : Array.isArray(a.bin_location) ? a.bin_location[0] || '' : '';
        const bBin = typeof b.bin_location === 'string' ? JSON.parse(b.bin_location)[0] || '' : Array.isArray(b.bin_location) ? b.bin_location[0] || '' : '';
        return aBin.localeCompare(bBin);
      });
    }
    return reorderProductList(productSoldList);
  }, [productSoldList, sortBy]);

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
      const index = sortedProductList.indexOf(findProduct);
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
  function updateRemainingQty(product: ProductSold, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    const target = e.target as HTMLElement;
    const parentTarget = target.closest('.product-row-item');
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
        
        const previousValueProduct = { ...product };
        setLastChangedProduct(previousValueProduct);

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
        parentTarget?.classList.add('checked-product');
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

    return `${remainingValue}${percentageValue !== "" && !isNaN(Number(percentageValue)) && Number(percentageValue) !== Infinity ? ` (${percentageValue}%)` : ''}`;
  }

  // cancel last change on product
  function cancelProductChange(product: HTMLButtonElement) {
    const findProduct = productSoldList.find(p => p.sku === lastChangedProduct?.sku);
    if (findProduct) {
      findProduct.remaining_quantity = lastChangedProduct?.remaining_quantity ?? findProduct.remaining_quantity;
      const updatedProducts = productSoldList.map(p => {
        if (findProduct.sku === p.sku) {
          return { ...findProduct };
        }
        return p;
      });
      setProductSoldList(updatedProducts);
      syncProductListToWarehouse([findProduct]);
      product.closest('.product-row-item')?.classList.remove('checked-product');
      setLastChangedProduct(null);
    }
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
          style={{width: 'auto'}}
          priority
        />
      </header>
      <section className="flex flex-col items-center justify-center py-2">
        <h1 className="text-4xl font-bold">Suivi de stock des bins</h1>
        <p className="mb-4"><small>V.{appVersion}</small></p>
      </section>
      <div className="px-6 flex items-center justify-center w-full mx-auto gap-6 sticky top-0 backdrop-blur-md bg-white/80 border-b border-neutral-200 z-50 py-3">
        <button className="bg-neutral-900 text-white text-sm font-medium py-2 px-5 rounded-full hover:bg-neutral-700 transition-colors duration-200 cursor-pointer" onClick={() => getData()}>
          Synchroniser les données des bins
        </button>
        {
          productSoldList.length > 0 &&
            <>
              <div className="filtres flex items-center gap-2">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest whitespace-nowrap">Filtres</p>
                <select name="product-filtre" id="product-filtre" className="text-sm text-neutral-800 bg-transparent border-0 border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-0.5 transition-colors cursor-pointer" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="none">Aucun</option>
                  <option value="remove-unknown">Cacher les produits en inconnu</option>
                  <option value="view-only-out-of-stock">Montrer seulement les produits en Rupture de stock</option>
                  <option value="view-only-low-stock">Montrer seulement les produits en stock faible</option>
                  <option value="view-only-medium-stock">Montrer seulement les produits en stock moyen</option>
                  <option value="view-only-high-stock">Montrer seulement les produits en stock élevé</option>
                </select>
              </div>
              <div className="sort-list flex items-center gap-2">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest whitespace-nowrap">Trier par</p>
                <select name="product-sort" id="product-sort" className="text-sm text-neutral-800 bg-transparent border-0 border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-0.5 transition-colors cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="percentage">Pourcentage de stock</option>
                  <option value="bin-location">Emplacement du bin</option>
                </select>
              </div>
              <div className="search-bar flex items-center gap-2">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest whitespace-nowrap">SKU / UPC</p>
                <input
                  type="text"
                  className="text-sm text-neutral-800 bg-transparent border-0 border-b border-neutral-300 focus:border-neutral-900 focus:outline-none pb-0.5 transition-colors placeholder:text-neutral-400"
                  placeholder="Rechercher…"
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
                  <thead className="sticky top-20 backdrop-blur-md bg-white/80 border-b border-neutral-200 z-40">
                    <tr>
                      <th className="py-4 px-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Info du produit</th>
                      <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Qty Total</th>
                      <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Qty Max Bin</th>
                      {/* <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Qty vendus</th> */}
                      <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Qty restant</th>
                      <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Bin</th>
                      <th className="text-center py-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className={filter}>
                    {
                      sortedProductList.map((product:ProductSold, index:number) => (
                        (product.total_quantity ?? 0) > 0 && (
                          <tr
                            key={index}
                            className={`product-row-item border-b border-neutral-100 item--${index} ${ product.sold_quantity === '0' && product.htsus === product.remaining_quantity?.toString() ? 'checked-product' : '' } ${ setFilterClass(product.htsus, product.remaining_quantity, product.total_quantity) }`}>
                            <td className="p-4">
                              <span className="h-[128px] block">
                                {
                                  product.image_url.length > 0 &&
                                  <Image
                                    src={product.image_url}
                                    alt={product.title ? product.title : 'Image du produit'}
                                    width={100}
                                    height={60}
                                    style={{width: 'auto'}} />
                                }
                              </span>
                              <span className="block text-sm font-semibold text-neutral-900">
                                { product.title }
                                {
                                  product.variantTitle && (
                                    <small className="bg-neutral-100 text-neutral-500 text-xs py-0.5 px-2 rounded-full ml-1 font-normal">
                                      { product.variantTitle }
                                    </small>
                                  )
                                }
                              </span>
                              <span className="block border-t border-neutral-100 mt-2 pt-2 text-xs text-neutral-400 font-normal">
                                SKU: { product.sku }
                              </span>
                              <span className="block text-xs text-neutral-400 font-normal">
                                UPC: { product.upc }
                              </span>
                            </td>
                            <td className="text-center text-sm font-medium text-neutral-700">
                              <span>{ product.total_quantity }</span>
                            </td>
                            <td className="text-center text-sm font-medium text-neutral-700">
                              <span className={`${!product.htsus && 'text-red-400 text-xs'}`}>{ product.htsus ? product.htsus : "inconnu" }</span>
                            </td>
                            {/* <td className="text-center text-sm font-medium text-neutral-700">
                              <span>{ product.sold_quantity }</span>
                            </td> */}
                            <td className="text-center text-sm font-medium text-neutral-700">
                              <span className={`${!product.htsus && 'text-red-400'}`}>
                                {
                                  showRemainingQty(product)
                                }
                              </span>
                              <button
                                className="block text-xs text-neutral-400 hover:text-neutral-700 mt-2 mx-auto cursor-pointer transition-colors"
                                onClick={(e) => updateRemainingQty(product, e)}>
                                Corriger la valeur
                              </button>
                            </td>
                            <td className="text-center">
                              <div className="flex flex-col gap-2 py-2">
                                {
                                  typeof product.bin_location === 'string' ? 
                                    JSON.parse(product.bin_location).map((bin:string, idx:number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs inline-block h-fit rounded-full font-mono tracking-wide">
                                        { bin }
                                      </span>
                                  )) : Array.isArray(product.bin_location) ?
                                  product.bin_location.map((bin, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs inline-block h-fit rounded-full font-mono tracking-wide">{ bin }</span>
                                  ))
                                  :
                                  <span>{ product.bin_location }</span>
                                }
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="flex flex-col items-center justify-center py-2 px-4 gap-4">
                                <BinStatus
                                  percentage={product.remaining_quantity ? Math.round(((Number(product.remaining_quantity) ?? 0) / Number(product.htsus) * 100)) : 0}
                                  totalQty={product.total_quantity ?? 0}
                                  htsus={Number(product.htsus ?? 0)}
                                  remainingQty={product.remaining_quantity ?? 0}
                                />
                                <button
                                  className="bg-emerald-600 text-white text-xs font-medium py-2 px-4 rounded-full hover:bg-emerald-700 transition-colors duration-200 cursor-pointer w-full"
                                  onClick={() => binRestocked(product)}>
                                  Bin remplie
                                  <ArchiveBoxArrowDownIcon className="ml-1.5 inline h-3.5 w-3.5" />
                                </button>
                                {
                                  lastChangedProduct?.sku === product.sku && (
                                    <button
                                      className="bg-transparent text-neutral-500 border border-neutral-200 text-xs font-medium py-2 px-4 rounded-full hover:border-neutral-500 hover:text-neutral-700 transition-colors duration-200 cursor-pointer w-full"
                                      onClick={(e) => cancelProductChange(e.currentTarget)}>
                                      Annuler changement
                                    </button>
                                  )
                                }
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    }
                  </tbody>
                </table>
              </div>
      }
    </main>
  )
}