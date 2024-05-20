import { Context } from "koa";
import { Order, Payment } from "../models";
import { isValidEmail, isPositiveNumber } from "../utils/validators";
import { normalizeEmail, normalizeFloat } from "../utils/normalizers";
import { v4 as uuidv4 } from "uuid";
import {
  CreateOrderRequest,
  GetOrdersForCustomerRequest,
  ApplyPaymentRequest,
  CreateOrderAndPayRequest,
} from "../types";
import { Op } from "sequelize";

const PAGE_SIZE = 10;
const MAX_PAGE_LIMIT = 100;

const WINDOW_TIME_IN_SECONDS = 30 * 1000;

/*
    @todo move these validators out in order to not return 500 errors
    These should be 4xx errors
*/
const _createOrder = async (
  email: string,
  amount: string | number,
  t?: any
) => {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }

  if (!amount || !isPositiveNumber(normalizeFloat(amount))) {
    throw new Error("Amount must be a positive number");
  }

  const order = await Order.create(
    {
      id: uuidv4(),
      email: normalizeEmail(email),
      originalAmount: normalizeFloat(amount),
      balance: normalizeFloat(amount),
    },
    { transaction: t }
  );

  return order;
};

export const createOrder = async (ctx: Context) => {
  try {
    const body = ctx.request.body as CreateOrderRequest;
    const { email, amount } = body;
    const order = await _createOrder(email, amount);

    ctx.body = order;
    ctx.status = 201;
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export const getOrder = async (ctx: Context) => {
  const orderId = ctx.params.id;

  if (!orderId) {
    ctx.status = 400;
    ctx.body = "Order ID is required";
    return;
  }
  try {
    const order = await Order.findByPk(orderId, { include: "payments" });
    if (order) {
      ctx.body = order;
    } else {
      ctx.status = 404;
      ctx.body = "Order not found";
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};

const validatePagination = ({
  page,
  limit,
  sortBy,
  sortOrder,
}: Omit<GetOrdersForCustomerRequest, "email">) => {
  const pageNumber = page ? parseInt(page as string, 10) : 1;

  let pageLimit = typeof limit === "string" ? parseInt(limit, 10) : limit;
  if (!pageLimit || isNaN(pageLimit) || pageLimit <= 0) {
    pageLimit = MAX_PAGE_LIMIT;
  }

  const validSortFields = [
    "createdAt",
    "updatedAt",
    "originalAmount",
    "balance",
  ];
  const defaultSortField = "createdAt";

  const sortField =
    sortBy && validSortFields.includes(sortBy) ? sortBy : defaultSortField;

  const sortOrderValue = sortOrder === "desc" ? "DESC" : "ASC";

  const offset = (pageNumber - 1) * pageLimit;

  return {
    pageNumber,
    offset,
    pageLimit,
    sortField,
    sortOrderValue,
  };
};

export const getOrdersForCustomer = async (ctx: Context) => {
  try {
    const requestParams = ctx.request.query;

    const queryParams: GetOrdersForCustomerRequest = {
      email: requestParams.email as string,
      page:
        requestParams.page && typeof requestParams.page === "string"
          ? parseInt(requestParams.page, 10)
          : 1,
      limit:
        requestParams.limit && typeof requestParams.limit === "string"
          ? parseInt(requestParams.limit, 10)
          : PAGE_SIZE,
      sortBy: requestParams.sortBy as string,
      sortOrder: requestParams.sortOrder as "asc" | "desc",
    };

    const { email, page, limit, sortBy, sortOrder } = queryParams;

    if (!isValidEmail(queryParams.email as string)) {
      ctx.status = 400;
      ctx.body = "Invalid email format";
      return;
    }

    const { pageNumber, offset, pageLimit, sortField, sortOrderValue } =
      validatePagination({ page, limit, sortBy, sortOrder });

    if (pageNumber <= 0) {
      ctx.status = 400;
      ctx.body = "Invalid page number";
      return;
    }

    const orders = await Order.findAndCountAll({
      where: { email },
      limit: pageLimit,
      offset,
      order: [[sortField, sortOrderValue]],
    });

    const totalPages = Math.ceil(orders.count / pageLimit);

    ctx.body = {
      orders: orders.rows,
      totalPages,
      currentPage: pageNumber,
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};

// Simulate payment failure 25% of the time a-la GoblinPay
const simulatePayment = () => {
  return Math.random() >= 0.25;
};

export const createOrderAndPay = async (ctx: Context) => {
  const body = ctx.request.body as CreateOrderAndPayRequest;

  const { email, amount, paymentAmount } = body;
  let t;

  if (Order.sequelize) {
    t = await Order.sequelize.transaction();
  }

  try {
    const order = await _createOrder(email, amount, t);

    if (!simulatePayment()) {
      throw new Error("Payment failed");
    }

    await Payment.create(
      {
        id: uuidv4(),
        amount: normalizeFloat(paymentAmount),
        orderId: order.id,
      },
      { transaction: t }
    );

    order.balance -= normalizeFloat(paymentAmount);
    await order.save({ transaction: t });

    if (t) {
      await t.commit();
    }
    ctx.body = order;
  } catch (error: any) {
    if (t) {
      await t.rollback();
    }
    ctx.status = 400;
    ctx.message = error.message;
  }
};

// @todo figure out how Stripe handles idempotency issues or utilize their package if possible
// that prevents duplicate payments
// For now we are checking within a time window to prevent duplicate payments based on order id and amount
// and a window (30 seconds)
const _checkExistingPaymentWithinTimeWindow = async (
  orderId: string,
  amount: number,
  timeWindow: number
): Promise<boolean> => {
  const currentTime = new Date();
  const startTime = new Date(currentTime.getTime() - timeWindow);

  const hasExistingPayment = await Payment.findOne({
    where: {
      orderId,
      amount,
      createdAt: {
        [Op.between]: [startTime, currentTime],
      },
    },
  });

  return hasExistingPayment !== null;
};

export const applyPaymentToOrder = async (ctx: Context) => {
  let t;

  try {
    const orderId = ctx.params.id;
    let { amount } = ctx.request.body as ApplyPaymentRequest;
    console.log(amount, orderId);

    amount = normalizeFloat(amount);

    if (!orderId) {
      ctx.status = 400;
      ctx.body = "Order ID is required";
      return;
    }

    if (!amount) {
      ctx.status = 400;
      ctx.body = "Payment amount is required";
      return;
    }

    if (amount < 0) {
      ctx.status = 400;
      ctx.body = "Payment amount cannot be negative";
      return;
    }

    if (Order.sequelize) {
      t = await Order.sequelize.transaction();
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      ctx.status = 404;
      ctx.body = "Order not found";
      return;
    }

    const currentTime = new Date();
    const startTime = new Date(currentTime.getTime() - WINDOW_TIME_IN_SECONDS);

    const hasExistingPayment = await _checkExistingPaymentWithinTimeWindow(
      orderId,
      amount,
      WINDOW_TIME_IN_SECONDS
    );
    if (hasExistingPayment) {
      ctx.status = 200;
      ctx.body = "Payment already applied";
      return;
    }

    await Payment.create({ orderId, amount }, { transaction: t });

    order.balance -= normalizeFloat(amount);
    if (order.balance < 0) {
      if (t) {
        await t.rollback();
      }
      ctx.status = 400;
      ctx.body = "Payment exceeds order balance";
      return;
    }

    await order.save({ transaction: t });

    if (t) {
      await t.commit();
    }

    ctx.status = 201;

    const orderUpdated = await Order.findByPk(orderId, { include: "payments" });
    ctx.body = orderUpdated;
  } catch (err) {
    if (t) {
      await t.rollback();
    }
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};
