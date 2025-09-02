import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import MCPServerProvider from './contexts/MCPServerContext.tsx'

createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <MCPServerProvider>
            <App />
        </MCPServerProvider>
    </ThemeProvider>
)
