import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface OrderAttributes {
  id: string;
  email: string;
  originalAmount: number;
  balance: number;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public email!: string;
  public originalAmount!: number;
  public balance!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function OrderFactory(sequelize: Sequelize): typeof Order {
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      originalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      balance: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'orders'
    }
  );

  return Order;
}
