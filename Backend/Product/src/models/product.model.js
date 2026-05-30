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

productSchema.index({title:'text',description:'text'})
//text index bo hota hai jiss property pe lagate hain toh usse kya hota hai bo query ko fast kardeta hai jobhi aap input doge uske sabse pass bo answer deta hai
 
export const product = mongoose.model("product", productSchema);
