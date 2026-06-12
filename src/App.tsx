import { HashRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { BottomNav } from "./components/layout/BottomNav";
import { Home } from "./pages/Home";
import { CategoryPage } from "./pages/CategoryPage";
import { ToolPage } from "./pages/ToolPage";
import { AuthPage } from "./pages/AuthPage";
import { Analytics } from "@vercel/analytics/next";

export default function App() {
  return (
    <>
      <Analytics />
      <HashRouter>
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/:category" element={<CategoryPage />} />
              <Route path="/:category/:slug" element={<ToolPage />} />
            </Routes>
          </main>
          <Footer />
          {/* Espace réservé pour la barre de navigation basse (mobile/tablette) */}
          <div className="h-16 lg:hidden" aria-hidden="true" />
          <BottomNav />
        </div>
      </HashRouter>
    </>
  );
}
