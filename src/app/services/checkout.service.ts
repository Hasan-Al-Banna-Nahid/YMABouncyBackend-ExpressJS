import Order, { IOrderModel } from "../models/checkout.model";
import Cart from "../models/cart.model";
import Product, { IProductModel } from "../models/product.model";
import ApiError from "../utils/apiError";
import { Types, ClientSession } from "mongoose";

interface CreateOrderData {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: "cash_on_delivery" | "online";
}

export const createOrderFromCart = async (
  userId: string,
  orderData: CreateOrderData
): Promise<IOrderModel> => {
  const session: ClientSession = await Order.startSession();
  session.startTransaction();

  try {
    console.log("🔍 [DEBUG] Starting checkout process...");
    console.log("👤 User ID:", userId);

    // Step 1: Get user's cart with detailed debugging
    const cart = await Cart.findOne({
      user: new Types.ObjectId(userId),
    }).session(session);

    if (!cart) {
      console.log("❌ [DEBUG] Cart not found for user:", userId);
      throw new ApiError("Cart not found", 404);
    }

    console.log("✅ [DEBUG] Cart found - ID:", cart._id);
    console.log("📦 [DEBUG] Cart items count:", cart.items.length);
    console.log("💰 [DEBUG] Cart total price:", cart.totalPrice);
    console.log("🛒 [DEBUG] Cart total items:", cart.totalItems);

    if (cart.items.length === 0) {
      console.log("❌ [DEBUG] Cart is empty");
      throw new ApiError("Cart is empty", 400);
    }

    // Step 2: Debug each cart item in detail
    console.log("\n🔎 [DEBUG] Analyzing cart items:");
    const orderItems = [];

    for (let i = 0; i < cart.items.length; i++) {
      const cartItem = cart.items[i];
      console.log(`\n📋 [DEBUG] Item ${i + 1}:`, {
        rawProductRef: cartItem.product,
        productType: typeof cartItem.product,
        productIsObjectId: cartItem.product instanceof Types.ObjectId,
        quantity: cartItem.quantity,
        price: cartItem.price,
      });

      // Check if product reference exists
      if (!cartItem.product) {
        console.log("❌ [DEBUG] Cart item has NULL product reference");
        throw new ApiError(`Cart item ${i + 1} has no product reference`, 400);
      }

      // Convert to ObjectId safely
      let productId: Types.ObjectId;
      try {
        productId =
          cartItem.product instanceof Types.ObjectId
            ? cartItem.product
            : new Types.ObjectId(cartItem.product);

        console.log("🆔 [DEBUG] Product ID to search:", productId);
      } catch (error) {
        console.log("❌ [DEBUG] Invalid product ID format:", cartItem.product);
        throw new ApiError(
          `Invalid product ID format in cart item ${i + 1}`,
          400
        );
      }

      // Step 3: Check if product exists in database
      console.log("🔍 [DEBUG] Searching for product in database...");
      const product = await Product.findById(productId).session(session);

      if (!product) {
        console.log("❌ [DEBUG] PRODUCT NOT FOUND IN DATABASE");
        console.log("❌ [DEBUG] Product ID that was not found:", productId);

        // Debug: Check what products actually exist
        const allProductsCount = await Product.countDocuments({}).session(
          session
        );
        console.log("📊 [DEBUG] Total products in database:", allProductsCount);

        const sampleProducts = await Product.find({}).session(session).limit(3);
        console.log("📋 [DEBUG] Sample products (first 3):");
        sampleProducts.forEach((p, index) => {
          console.log(`   ${index + 1}. ${p._id} - ${p.name}`);
        });

        throw new ApiError(
          `Product with ID ${productId} not found in database. The product may have been deleted.`,
          404
        );
      }

      console.log("✅ [DEBUG] Product found:", {
        id: product._id,
        name: product.name,
        stock: product.stock,
        price: product.price,
      });

      // Step 4: Check stock availability
      if (product.stock < cartItem.quantity) {
        console.log("❌ [DEBUG] Insufficient stock:", {
          required: cartItem.quantity,
          available: product.stock,
          product: product.name,
        });
        throw new ApiError(
          `Insufficient stock for ${product.name}. Only ${product.stock} available, but ${cartItem.quantity} requested`,
          400
        );
      }

      console.log("✅ [DEBUG] Stock is sufficient");

      // Step 5: Add to order items
      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: cartItem.price,
        name: product.name,
      });

      console.log("✅ [DEBUG] Added to order items");

      // Step 6: Reduce stock
      const oldStock = product.stock;
      product.stock -= cartItem.quantity;
      await product.save({ session });
      console.log("✅ [DEBUG] Stock updated:", {
        product: product.name,
        from: oldStock,
        to: product.stock,
        reduction: cartItem.quantity,
      });
    }

    // Step 7: Create order
    console.log("\n📝 [DEBUG] Creating order...");
    console.log("📦 Order items count:", orderItems.length);
    console.log("💰 Order total amount:", cart.totalPrice);
    console.log("🏠 Shipping address:", orderData.shippingAddress);
    console.log("💳 Payment method:", orderData.paymentMethod);

    const orders = await Order.create(
      [
        {
          user: new Types.ObjectId(userId),
          items: orderItems,
          totalAmount: cart.totalPrice,
          paymentMethod: orderData.paymentMethod,
          shippingAddress: orderData.shippingAddress,
        },
      ],
      { session }
    );

    console.log("✅ [DEBUG] Order created - ID:", orders[0]._id);

    // Step 8: Clear cart
    const itemsCleared = cart.items.length;
    cart.items = [];
    await cart.save({ session });
    console.log("✅ [DEBUG] Cart cleared - removed", itemsCleared, "items");

    await session.commitTransaction();
    console.log("✅ [DEBUG] Transaction committed successfully");

    // Step 9: Fetch complete order with populated data
    const completeOrder = await Order.findById(orders[0]._id)
      .populate("items.product")
      .populate("user", "name email");

    if (!completeOrder) {
      console.log("❌ [DEBUG] Failed to fetch created order");
      throw new ApiError("Order creation failed", 500);
    }

    console.log("🎉 [DEBUG] Checkout completed successfully!");
    console.log("📦 Final order:", {
      id: completeOrder._id,
      items: completeOrder.items.length,
      total: completeOrder.totalAmount,
      status: completeOrder.status,
    });

    return completeOrder;
  } catch (error) {
    console.log("❌ [DEBUG] Checkout failed with error:", error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
    console.log("🔚 [DEBUG] Session ended");
  }
};

export const getOrderById = async (orderId: string): Promise<IOrderModel> => {
  const order = await Order.findById(orderId)
    .populate("items.product")
    .populate("user", "name email");

  if (!order) {
    throw new ApiError("Order not found", 404);
  }

  return order;
};

export const getUserOrders = async (userId: string): Promise<IOrderModel[]> => {
  return await Order.find({ user: new Types.ObjectId(userId) })
    .populate("items.product")
    .sort({ createdAt: -1 });
};
