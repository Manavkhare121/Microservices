import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  isDefault:{
        type:Boolean,
        default:false
    }
});

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select:false
    },
    fullName: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

export const userModel = mongoose.model("User", userSchema); 