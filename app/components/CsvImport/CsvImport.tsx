"use client";

import { ChangeEvent, useState } from "react";
import { CsvImportProps, Product, CsvRowsProps } from "@/app/types/type";
import Papa from "papaparse";
import pLimit from "p-limit";

export default function CsvImport({ onLoading, onProductListFromFile }: CsvImportProps) {
  const [logs, setLogs] = useState<string[]>([]);
  
  const [productListFromFile, setProductListFromFile] = useState<Product[]>([]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onLoading(true);
    setLogs([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        await processRows(results.data as CsvRowsProps[]);
        onLoading(false);
      },
    });

    const processRows = async (rows: CsvRowsProps[]) => {
      const limit = pLimit(5);
      
      const accumulatedProducts: Product[] = [];
      const accumulatedLogs: string[] = [];

      const promises = rows.map((row) => {
        return limit(async () => {
          const sku = row.SKU;
          const qty = Number(row['Qty Ordered']) || 0;

          if (!sku) return;

          try {
            const baseUrl = `/api/ipacky?code=${sku}&type=sku`;
            const response = await fetch(baseUrl);
            const result = await response.json();

            if (response.ok && result.data && result.data.length > 0) {
              const productData = result.data[0];
              
              const newProduct: Product = {
                sku: productData.sku || "N/A",
                upc: productData.barcode || "N/A",
                name: productData.name || "N/A",
                quantityAvailable: productData.quantityAvailable || 0,
                quantityOnHand: productData.quantityOnHand || 0,
                quantityToReStock: qty,
                binLocation: productData.binLocations || [],
                htsus: productData.htsUS || null,
                imageUrl: productData.imageURL || "",
                restocked: false,
                bAlias: productData.barcodeAliases || [],
              };

              accumulatedProducts.push(newProduct);
              accumulatedLogs.push(`Success: SKU: ${sku}`);

            } else {
              accumulatedLogs.push(`Error: SKU: ${sku} not finded or API's error`);
            }
          } catch (error) {
            console.error(error);
            accumulatedLogs.push(`Critical Error: SKU: ${sku}`);
          }
        });
      });

      await Promise.all(promises);

      setProductListFromFile(accumulatedProducts);
      setLogs(accumulatedLogs);

      if (onProductListFromFile) {
        onProductListFromFile(accumulatedProducts);
      }
    };
  };

  return (
    <div className="w-full">
      <p className="block mb-2">Importer d'un fichier .csv:</p>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="block w-full text-sm text-sky-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-gray-100 file:text-sky-500
          hover:file:bg-sky-500 hover:file:text-neutral-50 file:duration-300 file:ease-in-out file:cursor-pointer"
      />
    </div>
  );
}