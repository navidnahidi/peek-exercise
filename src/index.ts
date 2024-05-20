import Koa from "koa";
import bodyParser from "koa-bodyparser";
import orderRoutes from "./routes/orders";
const { sequelize } = require("./models");

const app = new Koa();
const PORT = 3000;

app.use(bodyParser());
app.use(orderRoutes.routes()).use(orderRoutes.allowedMethods());

const startServer = async () => {
  await sequelize.authenticate();
  console.log("Database connected!");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

export { app };
