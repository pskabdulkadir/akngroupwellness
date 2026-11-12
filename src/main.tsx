import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installAdminFetchAuth } from './utils/adminSession';
import './index.css';

installAdminFetchAuth();
createRoot(document.getElementById('root')!).render(<App />);
