import { useState, useEffect } from "react";
import type { HistoryListModal, HistoryListProps, Product } from "@/app/types/type";
import { Loader } from "../Loader/Loader";
import { TrashIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import './HistoryList.css';

export default function HistoryList({onClose, onToast}: HistoryListModal) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [historyList, setHistoryList] = useState<Array<HistoryListProps>>([]);
  
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/conceptc', {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
      setHistoryList(data.data || []);
    })
    .catch((error) => {
      onToast({type: "error", message: "Une erreur est survenue lors de la récupération de l'historique des listes." });
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, []);

  async function deleteHistoryItem(id: number) {
    fetch(`/api/conceptc?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      setHistoryList(prevList => prevList.filter(item => Number(item.id) !== Number(id)));
      onToast({type: "success", message: "Élément d'historique supprimé avec succès." });
    })
    .catch((error) => {
      onToast({type: "error", message: "Une erreur est survenue lors de la suppression de l'élément d'historique." });
    });
  }

  function toggleProductList(buttonTarget: EventTarget | null) {
    const productListItem = (buttonTarget as HTMLElement).parentElement?.querySelector('.product-list');
    if (productListItem) {
      if (productListItem.classList.contains('active')) {
        productListItem.classList.remove('active');
      } else {
        productListItem.classList.add('active');
      }
    }
  }

  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-neutral-900/50 bg-opacity-75 flex items-center justify-center">
      <div className="modal-content relative bg-neutral-50 p-4 rounded-md min-w-[500px] flex flex-col items-end justify-start max-h-[90dvh] overflow-y-auto">
        <span className="close-button text-8xl text-neutral-900 cursor-pointer leading-none" onClick={onClose}>&times;</span>
        {
          isLoading ?
            <Loader classes="mx-auto pb-8" /> :
            <div className="history-list w-full h-full overflow-y-auto">
              {
                historyList.length === 0 ?
                <p className="text-center text-2xl">Aucun historique de liste disponible.</p> :
                <ul className="list-none max-h-dvh">
                  { historyList.map((item:HistoryListProps, index:number) => (
                    <li key={item.id} className="history-list-item py-2 odd:bg-neutral-200 grid px-4">
                      <span className="item-name cursor-pointer hover:text-blue-800 duration-300 ease-in-out" onClick={(e) => toggleProductList(e.target)}>{ item.name }</span>
                      <span className="delete-icon"><TrashIcon className="size-6 text-red-600 cursor-pointer" onClick={() => deleteHistoryItem(item.id)}/></span>
                      <div className="product-list w-full  rounded-md overflow-x-auto">
                        <table className="w-full border-collapse mt-2 bg-blue-100">
                          <thead>
                            <tr className="bg-blue-200 border-b-2 border-blue-300">
                              <th className="p-2 text-left">Image</th>
                              <th className="p-2 text-left">Nom</th>
                              <th className="p-2 text-center">SKU</th>
                              <th className="p-2 text-center">UPC</th>
                              <th className="p-2 text-center">Disponible</th>
                              <th className="p-2 text-center">En main</th>
                              <th className="p-2 text-center">À approvisionner</th>
                              <th className="p-2 text-center">HTSUS</th>
                              <th className="p-2 text-center">Bin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {
                              item.products.map((product:Product, prodIndex:number) => (
                                <tr key={product.upc} className="border-b border-blue-200 hover:bg-blue-50">
                                  <td className="p-2">
                                    <Image src={product.imageUrl || '/placeholder.png'} alt={product.name} width={50} height={50} />
                                  </td>
                                  <td className="p-2 text-left"><small>{product.name}</small></td>
                                  <td className="p-2 text-center"><small>{product.sku}</small></td>
                                  <td className="p-2 text-center"><small>{product.upc}</small></td>
                                  <td className="p-2 text-center"><small>{product.quantityAvailable}</small></td>
                                  <td className="p-2 text-center"><small>{product.quantityOnHand}</small></td>
                                  <td className="p-2 text-center"><small>{product.quantityToReStock}</small></td>
                                  <td className="p-2 text-center"><small>{product.htsus === null ? 'N/A' : product.htsus}</small></td>
                                  <td className="p-2 text-center">
                                    <small className="font-sans flex flex-wrap justify-end items-center">
                                      {
                                        Array.isArray(product.binLocation) ?
                                        product.binLocation.map((bin:string, binIndex:number) => (
                                          <span key={binIndex} className="bg-neutral-100 p-1 mx-1 rounded-md">{bin}{ binIndex < product.binLocation.length - 1 ? ', ' : ''}</span>
                                        )) :
                                        <span>{product.binLocation}</span>
                                      }
                                    </small>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </li>
                  ))}
                </ul>
              }
            </div>
        }
      </div>
    </div>
  )
}