const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const CART_TABLE = process.env.CART_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

// Helper to get user ID from Cognito token
function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims && auth.claims.sub) {
    return auth.claims.sub;
  }
  if (auth.jwt && auth.jwt.claims && auth.jwt.claims.sub) {
    return auth.jwt.claims.sub;
  }
  // Try alternative paths for JWT
  if (auth.principalId) {
    return auth.principalId;
  }
  return null; // Return null instead of throwing, handle in handler
}

// Helper to create response
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

// Get product details
async function getProduct(productId) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { productId },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    // Check authentication for all operations
    if (!userId) {
      return createResponse(401, {
        error: "Unauthorized: Authentication required",
      });
    }

    const httpMethod = event.requestContext.http.method;
    const pathParameters = event.pathParameters || {};

    // POST /orders - Create order from cart
    if (httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      // Get cart items
      const cartParams = {
        TableName: CART_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      };

      const cartResult = await dynamodb.query(cartParams).promise();
      const cartItems = cartResult.Items || [];

      if (cartItems.length === 0) {
        return createResponse(400, { error: "Cart is empty" });
      }

      // Validate cart items and calculate totals
      const orderItems = [];
      let subtotal = 0;
      let totalItems = 0;

      for (const cartItem of cartItems) {
        const product = await getProduct(cartItem.productId);
        if (!product) {
          return createResponse(404, {
            error: `Product ${cartItem.productId} not found`,
          });
        }

        if (product.stock < cartItem.quantity) {
          return createResponse(400, {
            error: `Insufficient stock for ${product.name}`,
          });
        }

        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;
        totalItems += cartItem.quantity;

        orderItems.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          itemTotal: itemTotal,
        });
      }

      // Calculate totals
      const tax = subtotal * 0.1; // 10% tax (configurable)
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const total = subtotal + tax + shipping;

      // Create order
      const orderId = `order-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const orderDate = new Date().toISOString();

      const order = {
        userId,
        orderId,
        orderDate,
        items: orderItems,
        shippingAddress: body.shippingAddress || {},
        billingAddress: body.billingAddress || body.shippingAddress || {},
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        status: "pending",
        paymentStatus: "pending",
        createdAt: orderDate,
        updatedAt: orderDate,
      };

      // Save order
      const orderParams = {
        TableName: ORDERS_TABLE,
        Item: order,
      };

      await dynamodb.put(orderParams).promise();

      // Update product stock and clear cart
      await Promise.all([
        // Update stock for each product
        ...orderItems.map((item) => {
          const updateParams = {
            TableName: PRODUCTS_TABLE,
            Key: { productId: item.productId },
            UpdateExpression:
              "SET stock = stock - :quantity, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":quantity": item.quantity,
              ":updatedAt": new Date().toISOString(),
            },
          };
          return dynamodb.update(updateParams).promise();
        }),
        // Clear cart
        ...cartItems.map((item) =>
          dynamodb
            .delete({
              TableName: CART_TABLE,
              Key: { userId, cartItemId: item.cartItemId },
            })
            .promise()
        ),
      ]);

      return createResponse(201, order);
    }

    // GET /orders - Get user's orders
    if (httpMethod === "GET" && !pathParameters.orderId) {
      const params = {
        TableName: ORDERS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Sort by orderDate descending
      };

      const result = await dynamodb.query(params).promise();
      return createResponse(200, { orders: result.Items || [] });
    }

    // GET /orders/{orderId} - Get single order
    if (httpMethod === "GET" && pathParameters.orderId) {
      const orderId = pathParameters.orderId;
      const params = {
        TableName: ORDERS_TABLE,
        Key: { userId, orderId },
      };

      const result = await dynamodb.get(params).promise();
      if (!result.Item) {
        return createResponse(404, { error: "Order not found" });
      }
      return createResponse(200, result.Item);
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, { error: error.message });
  }
};
