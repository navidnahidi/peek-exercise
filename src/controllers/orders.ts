import { Context } from "koa";
import { Order, Payment } from "../models";
import { isValidEmail, isPositiveNumber } from "../utils/validators";
import { normalizeEmail, normalizeFloat } from "../utils/normalizers";
import { v4 as uuidv4 } from "uuid";
import {
  CreateOrderRequest,
  GetOrdersForCustomerRequest,
  // ApplyPaymentRequest,
  CreateOrderAndPayRequest,
} from "../types";

const PAGE_SIZE = 10;
const MAX_PAGE_LIMIT = 100;

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
  } catch (err) {
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};

export const getOrder = async (ctx: Context) => {
  if (!ctx.params.id) {
    ctx.status = 400;
    ctx.body = "Order ID is required";
    return;
  }
  try {
    const order = await Order.findByPk(ctx.params.id, { include: "payments" });
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

export const createOrderAndPay = async (ctx: Context) => {
  const body = ctx.request.body as CreateOrderAndPayRequest;

  const { email, amount, paymentAmount } = body;
  let t;

  if (Order.sequelize) {
    t = await Order.sequelize.transaction();
  }

  try {
    const order = await _createOrder(email, amount, t);

    if (Math.random() < 0.25) {
      throw new Error("Payment failed");
    }

    await Payment.create(
      {
        id: uuidv4(),
        amount: normalizeFloat(paymentAmount),
        OrderId: order.id,
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
