import mongoose from "mongoose";
import { Schema } from "mongoose";
const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        enum: ["USD", "INR"],
        default: "INR",
      },
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    images: [
      {
        url: String,
        thumbnail: String,
        id: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const product = mongoose.model("product", productSchema);
