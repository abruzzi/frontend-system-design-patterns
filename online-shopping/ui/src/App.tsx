import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductListPage } from "./pages/ProductListPage";

function ShellLayout() {
  return (
    <div className="page-shell">
      <div className="shell-inner">
        <header className="shell-header">
          <div>
            <p className="subtle-label">Simple shopping demo</p>
            <h1 className="shell-title">Orbit Store</h1>
          </div>

          <div className="shell-nav">
            <NavLink
              to="/products"
              className={({ isActive }) => ["nav-link", isActive ? "active" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              Products
            </NavLink>
          </div>
        </header>

        <main className="content-stack">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<ShellLayout />}>
        <Route index element={<Navigate replace to="/products" />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="*" element={<Navigate replace to="/products" />} />
      </Route>
    </Routes>
  );
}
