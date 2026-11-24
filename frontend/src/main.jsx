import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/forms.css';
import { App } from './App';
import { ToastProvider } from './shared/toast';
import { AuthProvider } from './shared/auth';
import { FavoritesProvider } from './shared/favorites';
import { UnreadProvider } from './shared/notifications';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <UnreadProvider>
              <App />
            </UnreadProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
