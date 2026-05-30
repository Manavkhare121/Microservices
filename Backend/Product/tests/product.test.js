import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

/* ===================================================
        MOCK EXTERNAL MIDDLEWARES & SERVICES
=================================================== */

// We use fixed IDs so we can test ownership (seller matching)
const FIXED_SELLER_ID = new mongoose.Types.ObjectId();
const OTHER_SELLER_ID = new mongoose.Types.ObjectId();

// 1. Mock Authentication (Inside src/)
jest.unstable_mockModule("../src/middleware/auth.middleware.js", () => ({
  createauthmiddleware: jest.fn(() => (req, res, next) => {
    // If we pass a special header in tests, simulate a different user
    const isOtherUser = req.headers["x-test-other-user"];
    req.user = { id: isOtherUser ? OTHER_SELLER_ID.toString() : FIXED_SELLER_ID.toString() };
    next();
  }),
}));

// 2. Mock Multer Uploads (Inside src/)
jest.unstable_mockModule("../src/middleware/upload.middleware.js", () => ({
  default: {
    array: jest.fn(() => (req, res, next) => {
      // Simulate that multer attached files to the request
      if (req.headers["x-test-no-files"]) {
        req.files = [];
      } else {
        req.files = [{ buffer: Buffer.from("mockdata"), originalname: "test.jpg" }];
      }
      next();
    }),
  },
}));

// 3. Mock Validator (Inside src/)
jest.unstable_mockModule("../src/middleware/validator.middleware.js", () => ({
  createProductValidator: jest.fn((req, res, next) => next()),
}));

// 4. Mock ImageKit Service (Inside src/) - FIXED: Now returns an object
jest.unstable_mockModule("../src/services/imagekit.service.js", () => ({
  uploadImage: jest.fn().mockResolvedValue({ 
    url: "https://mock-image.url/test.jpg", 
    id: "mock123" 
  }),
}));

/* ===================================================
        IMPORT APP & MODELS (AFTER MOCKS)
=================================================== */

// app.js is inside src
const { default: app } = await import("../src/app.js");

// Product model is INSIDE src
const { product: Product } = await import("../src/models/product.model.js");

/* ===================================================
        TEST SETUP
=================================================== */

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  jest.clearAllMocks();
});

/* ===================================================
        TEST CASES
=================================================== */

describe("Product API Endpoints", () => {
  
  const validProductPayload = {
    title: "Gaming Laptop",
    description: "High performance laptop",
    priceAmount: 1500,
    priceCurrency: "USD",
  };

  describe("POST /api/product", () => {
    test("should create a new product successfully", async () => {
      const res = await request(app)
        .post("/api/product")
        .send(validProductPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Product created successfully");
      expect(res.body.product.title).toBe("Gaming Laptop");
      expect(res.body.product.price.amount).toBe(1500);
      expect(res.body.product.seller).toBe(FIXED_SELLER_ID.toString());
      expect(res.body.product.images[0].url).toBe("https://mock-image.url/test.jpg");
    });

    test("should fail if no images are uploaded", async () => {
      const res = await request(app)
        .post("/api/product")
        .set("x-test-no-files", "true") // Triggers our mock to return []
        .send(validProductPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("At least one product image is required");
    });
  });

  describe("GET /api/product", () => {
    beforeEach(async () => {
      await Product.create([
        { title: "Phone A", price: { amount: 500, currency: "USD" }, seller: FIXED_SELLER_ID },
        { title: "Phone B", price: { amount: 1000, currency: "USD" }, seller: FIXED_SELLER_ID }
      ]);
    });

    test("should fetch products with pagination", async () => {
      const res = await request(app).get("/api/product");
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    test("should filter products by price", async () => {
      const res = await request(app).get("/api/product?minprice=800");
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Phone B");
    });
  });

  describe("GET /api/product/:id", () => {
    let testProductId;

    beforeEach(async () => {
      const p = await Product.create({ 
        title: "Test Item", 
        price: { amount: 100 }, 
        seller: FIXED_SELLER_ID 
      });
      testProductId = p._id;
    });

    test("should fetch a product by ID", async () => {
      const res = await request(app).get(`/api/product/${testProductId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe("Test Item");
    });

    test("should return 404 for non-existent ID", async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/product/${randomId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Product not found");
    });
  });

  describe("PATCH /api/product/:id", () => {
    let testProductId;

    beforeEach(async () => {
      const p = await Product.create({ 
        title: "Old Title", 
        price: { amount: 100, currency: "USD" }, 
        seller: FIXED_SELLER_ID 
      });
      testProductId = p._id;
    });

    test("should update allowed fields", async () => {
      const res = await request(app)
        .patch(`/api/product/${testProductId}`)
        .send({
          title: "New Title",
          price: { amount: 200 }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Product updated successfully");
      expect(res.body.data.title).toBe("New Title");
      expect(res.body.data.price.amount).toBe(200);
    });
  });

  describe("DELETE /api/product/:id", () => {
    let testProductId;

    beforeEach(async () => {
      const p = await Product.create({ 
        title: "To Delete", 
        price: { amount: 100 }, 
        seller: FIXED_SELLER_ID 
      });
      testProductId = p._id;
    });

    test("should delete a product if the user is the owner", async () => {
      const res = await request(app).delete(`/api/product/${testProductId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Product deleted successfully");

      const checkDb = await Product.findById(testProductId);
      expect(checkDb).toBeNull();
    });

    test("should reject deletion if user is not the owner", async () => {
      const res = await request(app)
        .delete(`/api/product/${testProductId}`)
        .set("x-test-other-user", "true"); // Triggers mock to use DIFFERENT seller ID

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe("Forbidden:You can only delete your own products");
    });
  });

  describe("GET /api/product/seller", () => {
    beforeEach(async () => {
      await Product.create([
        { title: "My Item 1", price: { amount: 10 }, seller: FIXED_SELLER_ID },
        { title: "My Item 2", price: { amount: 20 }, seller: FIXED_SELLER_ID },
        { title: "Other Seller Item", price: { amount: 30 }, seller: OTHER_SELLER_ID },
      ]);
    });

    test("should fetch products belonging only to the logged-in seller", async () => {
      const res = await request(app).get("/api/product/seller");
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].seller.toString()).toBe(FIXED_SELLER_ID.toString());
      expect(res.body.data[1].seller.toString()).toBe(FIXED_SELLER_ID.toString());
    });
  });

});