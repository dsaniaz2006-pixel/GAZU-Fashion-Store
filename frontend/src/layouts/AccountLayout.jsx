import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GazuLiquidSectionNav from "../components/ui/GazuLiquidSectionNav.jsx";
import { ACCOUNT_SECTION_ITEMS, accountSectionIndex } from "../components/ui/liquidSectionRoutes.mjs";

export default function AccountLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      {user && (
        <GazuLiquidSectionNav
          label="Account navigation"
          className="account-nav"
          items={ACCOUNT_SECTION_ITEMS}
          active={accountSectionIndex(location.pathname)}
          onSelect={(_, item) => navigate(item.path)}
        />
      )}
      <Outlet />
    </>
  );
}
