import type { Toast } from "@/app/types/type";
import './Toast.css';

export default function Toast({type, message}: Toast) {
  let bgColor = "";
  let textColor = "";

  switch(type) {
    case "success":
      bgColor = "bg-green-200";
      textColor = "text-green-800";
      break;
    case "error":
      bgColor = "bg-red-200";
      textColor = "text-red-800";
      break;
    case "info":
      bgColor = "bg-blue-200";
      textColor = "text-blue-800";
      break;
    default:
      bgColor = "bg-gray-200";
      textColor = "text-gray-800";
  }

  return (
    <div className={`toast inline-block py-4 px-8 rounded-lg text-2xl fixed top-4 left-4 ${bgColor} ${textColor}`}>{ message }</div>
  )
}