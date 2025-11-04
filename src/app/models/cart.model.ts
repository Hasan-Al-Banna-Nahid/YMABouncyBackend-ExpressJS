import mongoose, { Document, Schema } from "mongoose";
import { ICart, ICartItem } from "../interfaces/cart.interface";

export interface ICartItemModel extends ICartItem, Document {}
export interface ICartModel extends ICart, Document {}

// Interface for populated product in cart items
export interface IPopulatedCartItem {
  product: {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    stock: number;
    // Add other product fields you need
  };
  quantity: number;
  price: number;
}

const cartItemSchema: Schema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving with proper TypeScript typing
cartSchema.pre("save", function (this: ICartModel, next) {
  this.totalItems = this.items.reduce(
    (total: number, item: ICartItem) => total + item.quantity,
    0
  );
  this.totalPrice = this.items.reduce(
    (total: number, item: ICartItem) => total + item.quantity * item.price,
    0
  );
  next();
});

const Cart = mongoose.model<ICartModel>("Cart", cartSchema);

export default Cart;
