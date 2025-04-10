import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import './index.css';
import NiiVue from './Niivue';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const volumes = [
  { url: './mni152reallyreallyreallyreallyreallyLongName.nii' },
  { url: './hippo.nii' },
];

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <CssBaseline enableColorScheme />
      <NiiVue volumes={volumes} />
    </React.StrictMode>
  );
}
