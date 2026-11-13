import Order from "../models/Order.js";
import Product from "../models/Product.js";
export async function statistics() {
  const [revenuePerDay, mockPaymentsPerDay, ordersByStatus, topProducts, lowStock] =
    await Promise.all([
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: "collected" },
              { paymentMethod: "razorpay", paymentStatus: "paid" },
            ],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            revenuePaise: { $sum: "$totalPaise" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      // Simulated payment successes are never counted as collected revenue.
      Order.aggregate([
        { $match: { paymentMethod: "mock", paymentStatus: "mock_paid" } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          simulatedPaise: { $sum: "$totalPaise" },
          orders: { $sum: 1 },
        } },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            quantity: { $sum: "$items.quantity" },
            salesPaise: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPricePaise"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
      ]),
      Product.find({ active: true, quantity: { $lte: 5 } })
        .sort({ quantity: 1 })
        .limit(20),
    ]);
  return { revenuePerDay, mockPaymentsPerDay, ordersByStatus, topProducts, lowStock };
}
