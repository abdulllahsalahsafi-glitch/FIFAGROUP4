import React from 'react'
import ReactDOM from 'react-dom/client'
import './theme/fifa-theme.css'
import './theme/member-page-theme.css'
import './theme/transfers-theme.css'
import './theme/season-theme.css'
import './theme/archive-stats-links-theme.css'
import './theme/unified-page-headers.css'
import './v4SplashHold.js'
import './v4BottomCurtainFix.js'
import App from './App.jsx'
import './v4ProductionUiPatch.js'
import './theme/unifiedPageHeadersPatch.js'
import './theme/claude-pages-runtime.js'
import './theme/claude-logo-runtime.js'
import './theme/fifa-studio-icon-fix.css'
import './theme/fifa-studio-icons-final.js'
import './theme/mobile-layout-fixes-final.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
