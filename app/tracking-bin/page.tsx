"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import { useState, useEffect } from "react";
import type { ProductSold } from "../types/type";

export default function TrackingBinPage() {
  const appVersion = "1.0.0";

  const [productSoldList, setProductSoldList] = useState<ProductSold[]>([]);

  async function getData() {
    const baseUrl = `/api/shopify/reports`;
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched data:", data);
      setProductSoldList(data.data.rows.map((row: any) => ({
        name: row.product_title,
        type: row.product_type,
        sku: row.product_variant_sku,
        soldQuantity: row.net_items_sold,
        upc: '',
        binLocation: '',
        htsus: '',
        imageUrl: ''
      })));
    } catch (error) {
      console.error("Error during fetch:", error);
    }
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
      <div className="container flex justify-center w-full mx-auto">
        <button className="bg-sky-500 py-2 px-4 rounded-lg flex items-center justify-center gap-4 hover:bg-sky-700 ease-in-out duration-300 cursor-pointer text-white" onClick={() => getData()}>
          Get Data !
        </button>
      </div>

      {
        productSoldList.length > 0 && 
        <div className="product-list">
          <table className="table-fixed w-full">
            <thead className="sticky top-0 bg-neutral-200">
              <tr>
                <th className="py-6">Info du produit</th>
                <th className="text-center py-6">Produits par Bin</th>
                <th className="text-center py-6">Produits vendus</th>
                <th className="text-center py-6">Produits restantes dans la bin</th>
                <th className="text-center py-6">Statut</th>
              </tr>
            </thead>
            <tbody>
              {
                productSoldList.map((product:ProductSold, index:number) => (
                  <tr key={index} className={`font-bold border-b-2 border-zinc-300 item--${index}`}>
                    <td className="p-4 text-sm font-semibold">
                      <span>{ product.name }</span>
                      <span>
                        SKU: { product.sku }
                        { product.upc ? ` | UPC: ${ product.upc }` : "" }
                      </span>
                    </td>
                    <td className="text-center">
                      <span>{ product.htsus }</span>
                    </td>
                    <td className="text-center">
                      <span>{ product.soldQuantity }</span>
                    </td>
                    <td className="text-center">
                      <span>--</span>
                    </td>
                    <td className="text-center">
                      <span>status</span>
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