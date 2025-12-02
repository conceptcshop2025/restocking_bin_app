import { useState, useEffect } from "react";
import type { HistoryListModal, HistoryListProps } from "@/app/types/type";
import { Loader } from "../Loader/Loader";
import { TrashIcon } from "@heroicons/react/16/solid";

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
      console.log(data);
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

  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-neutral-900/50 bg-opacity-75 flex items-center justify-center">
      <div className="modal-content relative bg-neutral-50 p-4 rounded-md min-w-[500px] flex flex-col items-end justify-start">
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
                    <li key={item.id} className="py-2 odd:bg-neutral-200 flex items-center justify-between px-4">
                      <span>{ item.name }</span>
                      <span><TrashIcon className="size-6 text-red-600 cursor-pointer" onClick={() => deleteHistoryItem(item.id)}/></span>
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