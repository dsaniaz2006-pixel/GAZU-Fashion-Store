import React from "react";
import { Truck, Package, BadgeCheck, LockKeyhole } from "lucide-react";
export default function Benefits() {
  return (
    <section className="benefits">
      <div>
        <Truck />
        <span>
          <b>FAST DELIVERY</b>
          <small>Quick & safe delivery</small>
        </span>
      </div>
      <div>
        <Package />
        <span>
          <b>EASY RETURNS</b>
          <small>Within 15 days</small>
        </span>
      </div>
      <div>
        <BadgeCheck />
        <span>
          <b>QUALITY ASSURED</b>
          <small>Better fabrics, built to last</small>
        </span>
      </div>
      <div>
        <LockKeyhole />
        <span>
          <b>SIMPLE CHECKOUT</b>
          <small>COD & mock payment</small>
        </span>
      </div>
    </section>
  );
}
