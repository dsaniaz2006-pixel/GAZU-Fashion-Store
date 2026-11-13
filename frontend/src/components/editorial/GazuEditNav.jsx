import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, CalendarDays, MessageCircle, Camera, Compass, Ruler, Headphones } from "lucide-react";
import GazuLiquidSectionNav from "../ui/GazuLiquidSectionNav.jsx";

export const GAZU_EDIT_SECTIONS = Object.freeze([
  { label: "SHOP THE LOOK", path: "/shop-the-look", icon: <BookOpen size={15} aria-hidden="true" /> },
  { label: "STYLE FINDER", path: "/style-finder", icon: <Sparkles size={15} aria-hidden="true" /> },
  { label: "NEW LAUNCHES", path: "/launches", icon: <CalendarDays size={15} aria-hidden="true" /> },
  { label: "AI ASSISTANT", path: "/ai-assistant", icon: <MessageCircle size={15} aria-hidden="true" /> },
  { label: "VISUAL SEARCH", path: "/visual-search", icon: <Camera size={15} aria-hidden="true" /> },
  { label: "DISCOVER", path: "/discover", icon: <Compass size={15} aria-hidden="true" /> },
  { label: "SIZE & FIT", path: "/fit-assistant", icon: <Ruler size={15} aria-hidden="true" /> },
  { label: "ORDER SUPPORT", path: "/support", icon: <Headphones size={15} aria-hidden="true" /> },
]);

export default function GazuEditNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return <div className="gazu-editorial-nav-wrap">
    <GazuLiquidSectionNav label="Editorial collections navigation" className="gazu-editorial-liquid"
      items={GAZU_EDIT_SECTIONS} active={Math.max(0, GAZU_EDIT_SECTIONS.findIndex(item => item.path === pathname))}
      onSelect={(_, item) => navigate(item.path)} />
  </div>;
}
