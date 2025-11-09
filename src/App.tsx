import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/routes"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App