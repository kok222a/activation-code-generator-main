import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css'; // 改為導入 styles.css（與 src/styles.css 對應）
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);