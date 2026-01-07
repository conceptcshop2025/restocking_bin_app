"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import type { ProductSold } from "../types/type";
import BinStatus from "../components/BinStatus/BinStatus";
import pLimit from "p-limit";

export default function TrackingBinPage() {
  const appVersion = "1.1.0";
  const [productSoldList, setProductSoldList] = useState<ProductSold[]>([]);

  async function getData() {
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

    const promises = itemsToProcess.map((row: ProductSold) => {
      return limit(async () => {
        const sku = row.sku;

        if (!sku) return;

        try {
          const baseUrl = `/api/ipacky?code=${sku}&type=sku`;
          const response = await fetch(baseUrl);
          const result = await response.json();

          if (response.ok && result.data && result.data.length > 0) {
            const productData = result.data[0];

            setProductSoldList(prevList =>
              prevList.map(product =>
                product.sku === row.sku
                  ? {
                      ...product,
                      upc: productData.barcode || '',
                      binLocation: productData.binLocations || [],
                      htsus: productData.htsUS || null,
                      imageUrl: productData.imageURL || ''
                    }
                  : product
              )
            );

          } else {
            console.error(`Error: SKU: ${sku} not finded or API's error`);
          }
        } catch (error) {
          console.error(error);
          console.error(`Critical Error: SKU: ${sku}`);
        }
      });
    });

    await Promise.all(promises);
  }

  return (
    <main>
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
        productSoldList.length > 0 && 
        <div className="product-list">
          <table className="table-fixed w-full">
            <thead className="sticky top-0 bg-neutral-200 z-40">
              <tr>
                <th className="py-6">Info du produit</th>
                <th className="text-center py-6">Qty par Bin</th>
                <th className="text-center py-6">Qty vendus</th>
                <th className="text-center py-6">Qty dans bin</th>
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