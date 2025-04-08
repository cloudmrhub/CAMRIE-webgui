import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ✅ this matches the default export
import { Provider } from 'react-redux';
import { store } from './store/store'; // adjust path if needed

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
