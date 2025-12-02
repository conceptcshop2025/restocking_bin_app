import './Loader.css';
import type { LoaderProps } from '@/app/types/type';

export const Loader: React.FC<LoaderProps> = ({ text = 'Loading...', classes }) => {
  return (
    <div className={`loader-container ${classes || ''}`}>
      <div className="loader-spinner"></div>
      <p className="loader-text">{text}</p>
    </div>
  );
};