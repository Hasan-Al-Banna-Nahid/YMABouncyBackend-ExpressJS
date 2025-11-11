// src/services/cart.service.ts
import Cart, { ICartModel } from "../models/cart.model";
import Product from "../models/product.model";
import ApiError from "../utils/apiError";
import { Types } from "mongoose";

export const addMultipleItemsToCart = async (
  userId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<ICartModel> => {
  // Validate all product IDs first
  const invalidProductIds = items.filter(
    (item) => !Types.ObjectId.isValid(item.productId)
  );

  if (invalidProductIds.length > 0) {
    throw new ApiError(
      `Invalid product IDs: ${invalidProductIds
        .map((item) => item.productId)
        .join(", ")}`,
      400
    );
  }

  // Convert productIds to ObjectId for query
  const productIds = items.map((item) => new Types.ObjectId(item.productId));

  // Validate all products exist
  const products = await Product.find({ _id: { $in: productIds } });

  // Check if all products exist - compare using string representation
  const foundProductIds = products.map((p: any) =>
    (p._id as Types.ObjectId).toString()
  );
  const requestedProductIds = items.map((item) => item.productId);

  const missingProducts = requestedProductIds.filter(
    (id) => !foundProductIds.includes(id)
  );

  if (missingProducts.length > 0) {
    throw new ApiError(
      `Products not found: ${missingProducts.join(", ")}`,
      404
    );
  }

  // Create a product map for easier lookup
  const productMap = new Map<string, any>();
  products.forEach((product: any) => {
    productMap.set((product._id as Types.ObjectId).toString(), product);
  });

  // Check stock for all items
  for (const item of items) {
    const product = productMap.get(item.productId);

    if (product.stock < item.quantity) {
      throw new ApiError(
        `Only ${product.stock} items available in stock for product ${product.name}`,
        400
      );
    }
  }

  let cart = await Cart.findOne({ user: new Types.ObjectId(userId) });

  if (!cart) {
    // Create new cart with all items
    const cartItems = items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        product: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: product.price,
      };
    });

    cart = await Cart.create({
      user: new Types.ObjectId(userId),
      items: cartItems,
    });
  } else {
    // Update existing cart with multiple items
    for (const item of items) {
      const product = productMap.get(item.productId);

      const existingItemIndex = cart.items.findIndex(
        (cartItem) => cartItem.product.toString() === item.productId
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const newQuantity =
          cart.items[existingItemIndex].quantity + item.quantity;

        // Check stock again for updated quantity
        if (product.stock < newQuantity) {
          throw new ApiError(
            `Only ${product.stock} items available in stock for product ${product.name}`,
            400
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        cart.items.push({
          product: new Types.ObjectId(item.productId),
          quantity: item.quantity,
          price: product.price,
        });
      }
    }

    await cart.save();
  }

  return await cart.populate("items.product");
};

// Keep all your other existing functions as they are
export const getCartByUserId = async (userId: string): Promise<ICartModel> => {
  let cart = await Cart.findOne({ user: new Types.ObjectId(userId) }).populate(
    "items.product"
  );

  if (!cart) {
    cart = await Cart.create({
      user: new Types.ObjectId(userId),
      items: [],
    });
  }

  return cart;
};

export const addItemToCart = async (
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<ICartModel> => {
  // Validate if productId is a valid ObjectId
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError("Invalid product ID", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  if (quantity < 1) {
    throw new ApiError("Quantity must be at least 1", 400);
  }

  if (product.stock < quantity) {
    throw new ApiError(`Only ${product.stock} items available in stock`, 400);
  }

  let cart = await Cart.findOne({ user: new Types.ObjectId(userId) });

  if (!cart) {
    cart = await Cart.create({
      user: new Types.ObjectId(userId),
      items: [
        {
          product: new Types.ObjectId(productId),
          quantity,
          price: product.price,
        },
      ],
    });
  } else {
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price: product.price,
      });
    }

    await cart.save();
  }

  return await cart.populate("items.product");
};

export const updateCartItem = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<ICartModel> => {
  if (quantity < 1) {
    throw new ApiError("Quantity must be at least 1", 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new ApiError(`Only ${product.stock} items available in stock`, 400);
  }

  const cart = await Cart.findOne({ user: new Types.ObjectId(userId) });
  if (!cart) {
    throw new ApiError("Cart not found", 404);
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new ApiError("Item not found in cart", 404);
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  return await cart.populate("items.product");
};

export const removeItemFromCart = async (
  userId: string,
  productId: string
): Promise<ICartModel> => {
  const cart = await Cart.findOne({ user: new Types.ObjectId(userId) });
  if (!cart) {
    throw new ApiError("Cart not found", 404);
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();
  return await cart.populate("items.product");
};

export const clearCart = async (userId: string): Promise<ICartModel> => {
  const cart = await Cart.findOne({ user: new Types.ObjectId(userId) });
  if (!cart) {
    throw new ApiError("Cart not found", 404);
  }

  cart.items = [];
  await cart.save();

  return cart;
};
