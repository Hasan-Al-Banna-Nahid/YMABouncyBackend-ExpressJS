import Cart, { ICartModel } from "../models/cart.model";
import Product from "../models/product.model";
import ApiError from "../utils/apiError";
import { Types } from "mongoose";

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
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  // Check stock availability
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
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Check stock for updated quantity
      if (product.stock < newQuantity) {
        throw new ApiError(
          `Only ${product.stock} items available in stock`,
          400
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
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
