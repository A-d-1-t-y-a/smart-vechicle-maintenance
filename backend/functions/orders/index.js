const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const INVENTORY_TABLE = process.env.INVENTORY_TABLE;

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims && auth.claims.sub) {
    return auth.claims.sub;
  }
  if (auth.jwt && auth.jwt.claims && auth.jwt.claims.sub) {
    return auth.jwt.claims.sub;
  }
  return null;
}

exports.handler = async (event) => {
  try {
    const httpMethod = event.requestContext?.http?.method || event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const orderId = pathParameters.orderId;
    const userId = getUserId(event);

    if (!userId) {
      return createResponse(401, {
        error: "Unauthorized: Authentication required",
      });
    }

    // GET /orders
    if (httpMethod === "GET" && !orderId) {
      const params = {
        TableName: ORDERS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false,
      };
      const result = await dynamodb.query(params).promise();
      return createResponse(200, result.Items || []);
    }

    // GET /orders/{orderId}
    if (httpMethod === "GET" && orderId) {
      const params = {
        TableName: ORDERS_TABLE,
        Key: {
          userId,
          orderId,
        },
      };
      const result = await dynamodb.get(params).promise();
      if (!result.Item) {
        return createResponse(404, { error: "Order not found" });
      }
      return createResponse(200, result.Item);
    }

    // POST /orders
    if (httpMethod === "POST") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (parseError) {
        return createResponse(400, { error: "Invalid JSON" });
      }

      const { items, shippingAddress, paymentMethod } = body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return createResponse(400, {
          error: "Order must contain at least one item",
        });
      }

      // Validate items and calculate total
      let total = 0;
      const validatedItems = [];

      for (const item of items) {
        const { productId, quantity, locationId } = item;
        if (!productId || !quantity || !locationId) {
          return createResponse(400, {
            error: "Each item must have productId, quantity, and locationId",
          });
        }

        // Get product details
        const productParams = {
          TableName: PRODUCTS_TABLE,
          Key: { productId },
        };
        const productResult = await dynamodb.get(productParams).promise();
        if (!productResult.Item) {
          return createResponse(404, {
            error: `Product ${productId} not found`,
          });
        }

        // Check inventory
        const inventoryParams = {
          TableName: INVENTORY_TABLE,
          Key: {
            productId,
            locationId,
          },
        };
        const inventoryResult = await dynamodb.get(inventoryParams).promise();
        const availableQuantity = inventoryResult.Item
          ? inventoryResult.Item.quantity
          : 0;

        if (availableQuantity < quantity) {
          return createResponse(400, {
            error: `Insufficient inventory for product ${productId}. Available: ${availableQuantity}, Requested: ${quantity}`,
          });
        }

        const itemTotal = productResult.Item.price * quantity;
        total += itemTotal;

        validatedItems.push({
          productId,
          productName: productResult.Item.name,
          quantity,
          price: productResult.Item.price,
          subtotal: itemTotal,
          locationId,
        });

        // Update inventory
        const updateInventoryParams = {
          TableName: INVENTORY_TABLE,
          Key: {
            productId,
            locationId,
          },
          UpdateExpression:
            "SET quantity = quantity - :quantity, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":quantity": quantity,
            ":updatedAt": new Date().toISOString(),
          },
        };
        await dynamodb.update(updateInventoryParams).promise();
      }

      const orderId = `order-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const orderDate = new Date().toISOString();

      const order = {
        userId,
        orderId,
        items: validatedItems,
        total: parseFloat(total.toFixed(2)),
        shippingAddress: shippingAddress || {},
        paymentMethod: paymentMethod || "cash",
        status: "pending",
        orderDate,
        createdAt: orderDate,
      };

      const params = {
        TableName: ORDERS_TABLE,
        Item: order,
      };

      await dynamodb.put(params).promise();
      return createResponse(201, order);
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, {
      error: error.message || "Internal server error",
    });
  }
};
