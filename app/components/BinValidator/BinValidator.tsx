import { BinValidatorProps } from "@/app/types/type";
import { useState, useEffect, useRef } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid";

export default function BinValidator({ productUpc, productQuantity, binLocations, productItem, onValidate }: BinValidatorProps) {
  const [validateBinInput, setValidateBinInput] = useState<string>("");
  const [validateUpcInput, setValidateUpcInput] = useState<string>("");
  const [debouncedUpcInput, setDebouncedUpcInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputBinRef = useRef<HTMLInputElement>(null);
  const [productQuantityScanned, setProductQuantityScanned] = useState<number>(0);
  const [showErrorUpcInput, setShowErrorUpcInput] = useState<boolean>(false);
  const [showErroBinInput, setShowErrorBinInput] = useState<boolean>(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (productItem && validateBinInput === (Array.isArray(binLocations) ? binLocations : [binLocations]).find(location => location === validateBinInput)) {
      setShowErrorBinInput(false);
      onValidate && onValidate(productItem, true);
    } else {
      onValidate && onValidate(productItem as HTMLElement, false);
      if (validateBinInput.length > 0) {
        setShowErrorBinInput(true);
      }
      setValidateBinInput("");
    }
  }, [validateBinInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUpcInput(validateUpcInput);
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [validateUpcInput]);

  useEffect(() => {
    if (debouncedUpcInput) {
      setValidateUpcInput(debouncedUpcInput);
      if (debouncedUpcInput === productUpc) {
        setProductQuantityScanned(prev => prev + 1);
        setValidateUpcInput("");

        if (showErrorUpcInput) {
          setShowErrorUpcInput(false);
        }
      } else {
        setShowErrorUpcInput(true);
        setValidateUpcInput("");
      }
    }
  }, [debouncedUpcInput]);

  useEffect(() => {
    if (productQuantityScanned === productQuantity) {
      inputBinRef.current?.focus();
      inputBinRef.current?.classList.remove('pointer-events-none');
    }
  }, [productQuantityScanned]);

  return (
    <div className="flex flex-col justify-start items-start p-8 gap-4 flex-wrap bg-neutral-50 rounded-md max-w-[90dvw] overflow-y-auto pt-24">
      <p className="text-3xl text-left">validateur de BIN</p>
      <div className="flex justify-center items-center gap-4">
        <input
          ref={inputRef}
          type="text"
          name="code-upc"
          id="code-upc"
          placeholder="UPC"
          className="border border-zinc-300 rounded-md px-2 py-4 h-fit"
          value={validateUpcInput}
          onChange={(e) => setValidateUpcInput(e.currentTarget.value)} />
          <span className={`p-4 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans text-xl ${validateUpcInput === productUpc || productQuantityScanned === productQuantity && 'bg-green-600'}`}>{ productUpc }</span>
          <span className={`p-4 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans text-xl ${productQuantityScanned === productQuantity && 'bg-green-600'}`}>{productQuantityScanned}/{ productQuantity }</span>
          {
            productQuantityScanned === productQuantity && <CheckCircleIcon className="size-8 text-green-600"/>
          }
          {
            showErrorUpcInput && <XCircleIcon className="size-8 text-red-600" />
          }
      </div>
      <div className="flex justify-center items-center gap-4">
        <input
          ref={inputBinRef}
          type="text"
          name="space-bin"
          id="space-bin"
          placeholder="BIN"
          className="border border-zinc-300 rounded-md px-2 py-4 h-fit pointer-events-none"
          value={validateBinInput}
          onChange={(e) => setValidateBinInput(e.target.value)} />
        {
          binLocations.length > 0 ? (
            (Array.isArray(binLocations) ? binLocations : [binLocations]).map((location: string, idx: number) => {
              return (
                <span key={idx} className={`p-4 bg-[#e4e5e7] inline-block h-fit rounded-md font-sans text-xl ${validateBinInput == location && 'bg-green-600'}`}>{location}</span>
              )
            }
          )) :
            <p className="font-sans text-2xl">Il n'y a pas de Bin asginé à ce produit.</p>
        }
        {
          showErroBinInput && <XCircleIcon className="size-8 text-red-600" />
        }
      </div>
    </div>
  )
}