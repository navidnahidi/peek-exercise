import { Sequelize } from "sequelize";
import { OrderFactory } from "./order";
import { PaymentFactory } from "./payment";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

const OrderModel = OrderFactory(sequelize);
const PaymentModel = PaymentFactory(sequelize);

OrderModel.hasMany(PaymentModel, { as: "payments" });
PaymentModel.belongsTo(OrderModel);

sequelize.sync();

export { sequelize, OrderModel as Order, PaymentModel as Payment };
