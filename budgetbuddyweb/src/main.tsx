import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegionProvider } from './contexts/RegionContext';
import App from './App';
import './index.css';

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegionProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </RegionProvider>
  </React.StrictMode>
);
