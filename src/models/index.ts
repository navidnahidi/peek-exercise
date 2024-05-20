import { Sequelize } from 'sequelize';
import { OrderFactory, Order } from './order';
import { PaymentFactory, Payment } from './payment';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const OrderModel = OrderFactory(sequelize);
const PaymentModel = PaymentFactory(sequelize);

OrderModel.hasMany(PaymentModel, { as: 'payments' });
PaymentModel.belongsTo(OrderModel);

sequelize.sync();

export { sequelize, OrderModel as Order, PaymentModel as Payment };
