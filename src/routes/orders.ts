import Router from "koa-router";
import {
  createOrder,
  getOrder,
  getOrdersForCustomer,
  createOrderAndPay,
  applyPaymentToOrder,
} from "../controllers/orders";

const router = new Router();

router.get("/orders", getOrdersForCustomer);
router.get("/orders/:id", getOrder);
router.post("/orders/create-and-pay", createOrderAndPay);
router.post("/orders", createOrder);
router.post("/orders/:id/payment", applyPaymentToOrder);

export default router;
