import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import GazuLiquidSectionNav from "../components/ui/GazuLiquidSectionNav.jsx";
import { ADMIN_SECTION_ITEMS, adminSectionIndex } from "../components/ui/liquidSectionRoutes.mjs";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="page-wrap">
      <GazuLiquidSectionNav
        label="Admin navigation"
        className="gazu-admin-liquid"
        items={ADMIN_SECTION_ITEMS}
        active={adminSectionIndex(location.pathname)}
        onSelect={(_, item) => navigate(item.path)}
      />
      <Outlet />
    </div>
  );
}
