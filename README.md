## Implementation
The project includes the following components:

* Controllers: Define the logic for handling HTTP requests and calling the appropriate functions.
* Models: Define the data models used by the application.
* Utils: Contains utility functions for validating and normalizing data.
* Routes: Defines the API endpoints and maps them to controller functions.

### Notes

The implementation of the `_checkExistingPaymentWithinTimeWindow` function aims to address the requirement for idempotency in applying payments to an order, particularly in scenarios where a client might attempt to make the same payment twice due to network issues or other interruptions. While the current approach uses a time window to prevent duplicate payments, this _should_ be replaced by something like how Stripe solves this issue (potentially using their API if possible).

## Usage
1. Clone the repository.
2. Install dependencies using npm install.
3. Start the server using npm start.
4. Use API endpoints as described in the Routes section.


# Notes aboute mappings to the function requirements
| Requested Function Name | Corresponding Function in Controller |
|-------------------------|--------------------------------------|
| create_order            | createOrder                          |
| get_order               | getOrder                             |
| get_orders_for_customer | getOrdersForCustomer                |
| apply_payment_to_order  | applyPaymentToOrder                 |
| create_order_and_pay    | createOrderAndPay                    |

## Routes
`GET /orders`
Fetches a list of orders for a customer.
#### Query Parameters:
* `email` (string, required): Customer's email address.
* `page` (number, optional): Page number for pagination. Default is 1.
* `limit` (number, optional): Number of orders per page. Default is 10.
* `sortBy` (string, optional): Field to sort by. Default is createdAt. Valid fields: createdAt, updatedAt, originalAmount, balance.
* `sortOrder` (string, optional): Sort order. Default is asc. Valid values: asc, desc.

Example response 
```
{
  "orders": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "originalAmount": 100.0,
      "balance": 50.0,
      "payments": [
        {
          "id": "456e4567-e89b-12d3-a456-426614174001",
          "amount": 50.0
        }
      ]
    }
  ],
  "totalPages": 2,
  "currentPage": 1
}

```

`GET /orders/:id`
Fetches details of a specific order by its identifier.

#### URL Parameters:
* `id` (string, required): The order identifier.

Example response 
```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@example.com",
  "originalAmount": 100.0,
  "balance": 50.0,
  "payments": [
    {
      "id": "456e4567-e89b-12d3-a456-426614174001",
      "amount": 50.0
    }
  ]
}

```

`POST /orders`
Creates a new order.

#### Request Body:
* `email` (string, required): Customer's email address.
* `amount` (number, required): Original amount of the order.

Example response
```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@example.com",
  "originalAmount": 100.0,
  "balance": 100.0,
  "payments": []
}

```

`POST /orders/create-and-pay`
Creates a new order and applies a payment.

#### Request Body:
* `email` (string, required): Customer's email address.
* `amount` (number, required): Original amount of the order.
* `paymentAmount` (number, required): Amount of the initial payment.

Example response
```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@example.com",
  "originalAmount": 100.0,
  "balance": 50.0,
  "payments": [
    {
      "id": "456e4567-e89b-12d3-a456-426614174001",
      "amount": 50.0
    }
  ]
}

```

`POST /orders/:id/payment`
Applies a payment to an existing order.

#### URL Parameters:
* `id` (string, required): The order identifier.
#### Request Body:
* `amount` (number, required): Amount of the payment to be applied.

Example response
```
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@example.com",
  "originalAmount": 100.0,
  "balance": 0.0,
  "payments": [
    {
      "id": "456e4567-e89b-12d3-a456-426614174001",
      "amount": 50.0
    },
    {
      "id": "789e4567-e89b-12d3-a456-426614174002",
      "amount": 50.0
    }
  ]
}

```
Testing
run `npm test` and look for any file with the extension `test.ts`