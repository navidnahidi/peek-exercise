import request from "supertest";
import { app } from "../../";
import { Order, sequelize } from "../../models";
import { isValidEmail, isPositiveNumber } from "../../utils/validators";
import { normalizeEmail, normalizeFloat } from "../../utils/normalizers";

jest.mock("../../models", () => {
  const originalModule = jest.requireActual("../../models");

  return {
    ...originalModule,
    Order: {
      ...originalModule.Order,
      create: jest.fn(),
      findByPk: jest.fn(),
    },
  };
});

jest.mock("../../utils/validators", () => ({
  isValidEmail: jest.fn(),
  isPositiveNumber: jest.fn(),
}));

jest.mock("../../utils/normalizers", () => ({
  normalizeEmail: jest.fn(),
  normalizeFloat: jest.fn(),
}));

describe("Order Controller", () => {
  let server: any;

  beforeEach(async () => {
    server = app.listen();
    await sequelize.authenticate();
    console.log("Database connected!");
  });

  afterEach(() => {
    server.close();
  });

  describe("POST /orders", () => {
    it("should create an order successfully", async () => {
      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@test.com",
        originalAmount: 100.0,
        balance: 100.0,
      };

      (isValidEmail as jest.Mock).mockReturnValue(true);
      (isPositiveNumber as jest.Mock).mockReturnValue(true);
      (normalizeEmail as jest.Mock).mockReturnValue(mockOrder.email);
      (normalizeFloat as jest.Mock).mockReturnValue(mockOrder.originalAmount);

      (Order.create as jest.Mock).mockImplementation(() =>
        Promise.resolve(mockOrder)
      );

      const res = await request(app.callback())
        .post("/orders")
        .send({
          email: "test@test.com",
          amount: 100,
        })
        .expect(201);

      expect(res.body).toEqual(mockOrder);
      expect(isValidEmail).toHaveBeenCalledWith("test@test.com");
      expect(isPositiveNumber).toHaveBeenCalledWith(100);
    });

    it('should return 500 Bad Request for invalid email', async () => {
        (isValidEmail as jest.Mock).mockReturnValue(false);
  
        const res = await request(app.callback())
         .post('/orders')
         .send({
            email: 'invalid-email',
            amount: 100,
          })
         .expect(500);
  
        expect(isValidEmail).toHaveBeenCalledWith('invalid-email');
      });
  });

  describe("GET /orders/:id", () => {
    it("should fetch an existing order", async () => {
      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@test.com",
        originalAmount: 100.0,
        balance: 100.0,
      };

      (Order.findByPk as jest.Mock).mockImplementation(() =>
        Promise.resolve(mockOrder)
      );

      const res = await request(app.callback()).get(
        "/orders/123e4567-e89b-12d3-a456-426614174000"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockOrder);
    });

    it("should return 404 Not Found for non-existing order", async () => {
      (Order.findByPk as jest.Mock).mockImplementation(() =>
        Promise.resolve(null)
      );

      const res = await request(app.callback()).get(
        "/orders/123e4567-e89b-12d3-a456-426614174000"
      );

      expect(res.status).toBe(404);
    });
  });
});
