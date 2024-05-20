import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

interface PaymentAttributes {
  id: string;
  amount: number;
  orderId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public amount!: number;
  public orderId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function PaymentFactory(sequelize: Sequelize): typeof Payment {
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'payments',
      timestamps: true,
    }
  );

  return Payment;
}
