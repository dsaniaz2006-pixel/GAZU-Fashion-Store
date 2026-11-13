import React from "react";

export default function ContentPage({ title, sub, children }) {
  return (
    <div className="page-wrap info-page">
      <p className="eyebrow">GAZU STUDIO / INFORMATION</p>
      <h1>{title}</h1>
      <p className="info-sub">{sub}</p>
      {children}
    </div>
  );
}
