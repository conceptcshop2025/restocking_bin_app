"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import type { ProductSold, ToastProps } from "../types/type";
import BinStatus from "../components/BinStatus/BinStatus";
import pLimit from "p-limit";
import { Loader } from "../components/Loader/Loader";
import Toast from "../components/Toast/Toast";

export default function TrackingBinPage() {
  const appVersion = "1.2.0";
  const [productSoldList, setProductSoldList] = useState<ProductSold[]>([]);
  const [warehouseProducts, setWarehouseProducts] = useState<ProductSold[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<ToastProps | null>(null);

  function initToast(content:ToastProps | null) {
    setShowToast(content);
    if (content) {
      setTimeout(() => { setShowToast(null); }, 6000);
    }
  }

  async function getData() {
    setIsLoading(true);
    const baseUrl = `/api/shopify/reports`;
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();

      const formattedList: ProductSold[] = data.data.rows.map((row: any) => ({
        name: row.product_title,
        type: row.product_type,
        sku: row.product_variant_sku,
        soldQuantity: row.net_items_sold,
        upc: '',
        binLocation: '',
        htsus: '',
        imageUrl: ''
      }));

      setProductSoldList(formattedList);

      await completeData(formattedList); 
      
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  }

  async function completeData(itemsToProcess: ProductSold[]) {
    const limit = pLimit(5);

    const updatedItems = await Promise.all(
      itemsToProcess.map(row =>
        limit(async () => {
          const sku = row.sku;
          if (!sku) return row;

          try {
            const response = await fetch(`/api/ipacky?code=${sku}&type=sku`);
            const result = await response.json();

            if (response.ok && result?.data?.length > 0) {
              const productData = result.data[0];

              return {
                ...row,
                upc: productData.barcode || '',
                binLocation: productData.binLocations || [],
                htsus: productData.htsUS || null,
                imageUrl: productData.imageURL || ''
              };
            }
          } catch (error) {
            console.error(`Error SKU ${sku}`, error);
          }

          return row;
        })
      )
    );

    setProductSoldList(updatedItems);

    await syncData(updatedItems);

    setIsLoading(false);
    initToast({
      type: 'info',
      message: 'Synchronisation des produits en cours...'
    });
  }

  async function syncData(updatedItems: ProductSold[]) {
    const baseUrl = `/api/conceptc/warehouse`;
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.data.length === 0) {
        const productListForBinSync = updatedItems.map((item) => ({
          ...item,
          remainingQuantity: item.htsus ? Number(item.htsus) - Number(item.soldQuantity || '0') : null
        }));
        console.log('productList to syncData: ', productListForBinSync);
        try {
          const res = await fetch(baseUrl,{
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(productListForBinSync)
          });
          if (res.ok) {
            initToast({
              type: 'success',
              message: "Les produits ont été synchronisés avec succès dans l'entrepot."
            });
          }
        } catch(error) {
          console.error("Error during fetch:", error);
        }
      } else {
        // Voy aca, se continua con validaciones de la lista de productos de shopify vs productos de neon para actualizar el stock restante en la bin
      }
    } catch (error) {
      console.error("Error during fetch:", error);
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
          priority
        />
      </header>
      <section className="flex flex-col items-center justify-center py-2">
        <h1 className="text-4xl font-bold">Suivi de stock des bins</h1>
        <p className="mb-4"><small>V.{appVersion}</small></p>
      </section>
      <div className="container flex justify-center w-full mx-auto mb-4">
        <button className="bg-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-4 hover:bg-sky-700 ease-in-out duration-300 cursor-pointer text-white" onClick={() => getData()}>
          Obtenir ventes de la journée précédente
        </button>
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
                      <th className="text-center py-6">Qty par Bin HTSUS</th>
                      <th className="text-center py-6">Qty vendus</th>
                      <th className="text-center py-6">Qty restant dans la bin</th>
                      <th className="text-center py-6">Bin</th>
                      <th className="text-center py-6">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      productSoldList.map((product:ProductSold, index:number) => (
                        <tr key={index} className={`font-bold border-b-2 border-zinc-300 item--${index}`}>
                          <td className="p-4 text-sm font-semibold">
                            {
                              product.imageUrl.length > 0 &&
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={100}
                                height={60} />
                            }
                            <span className="block">{ product.name }</span>
                            <span className="block border-t border-zinc-300 mt-2 pt-2">
                              SKU: { product.sku }
                            </span>
                            <span className="block">
                              UPC: { product.upc }
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`${!product.htsus && 'text-red-500'}`}>{ product.htsus ? product.htsus : "inconnu" }</span>
                          </td>
                          <td className="text-center">
                            <span>{ product.soldQuantity }</span>
                          </td>
                          <td className="text-center">
                            <span className={`${!product.htsus && 'text-red-500'}`}>
                              {
                                product.htsus && product.soldQuantity ? `${ Number(product.htsus) - Number(product.soldQuantity) } (${ Math.round((Number(product.htsus) - Number(product.soldQuantity)) / Number(product.htsus) * 100) }%)` : "inconnu"
                              }
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="flex flex-col gap-2 py-2">
                              {
                                Array.isArray(product.binLocation) ?
                                product.binLocation.map((bin, idx) => (
                                  <span key={idx} className="p-2 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans">{ bin }</span>
                                ))
                                :
                                <span>{ product.binLocation }</span>
                              }
                            </div>
                          </td>
                          <td className="text-center">
                            <BinStatus
                              qty={Number(product.soldQuantity)}
                              maxQty={Number(product.htsus)} />
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