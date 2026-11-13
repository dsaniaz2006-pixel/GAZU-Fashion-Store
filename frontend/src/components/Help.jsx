import React from "react";

import ContentPage from "./ContentPage.jsx";
export default function Help() {
  return (
    <ContentPage
      title="HERE TO HELP."
      sub="The details matter. So does getting them right."
    >
      <div className="help-grid">
        {[
          [
            "DELIVERY",
            "Orders above ₹999 ship free. Standard delivery usually takes 3–7 business days.",
          ],
          [
            "RETURNS",
            "Eligible unworn items can be returned within 15 days of delivery.",
          ],
          [
            "PRODUCT CARE",
            "Follow the care label. Wash similar colours together and air dry when possible.",
          ],
          [
            "CONTACT",
            "Write to hello@gazu.example for help with your order or product questions.",
          ],
        ].map(([h, p]) => (
          <article key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </ContentPage>
  );
}
