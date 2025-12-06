const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const INVENTORY_TABLE = process.env.INVENTORY_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

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
    const productId = pathParameters.productId;
    const queryParams = event.queryStringParameters || {};
    const locationId = queryParams.locationId;

    // GET /inventory
    if (httpMethod === "GET" && !productId) {
      const params = {
        TableName: INVENTORY_TABLE,
      };
      if (locationId) {
        params.IndexName = "location-index";
        params.KeyConditionExpression = "locationId = :locationId";
        params.ExpressionAttributeValues = {
          ":locationId": locationId,
        };
        const result = await dynamodb.query(params).promise();
        return createResponse(200, result.Items || []);
      } else {
        const result = await dynamodb.scan(params).promise();
        return createResponse(200, result.Items || []);
      }
    }

    // GET /inventory/product/{productId}
    if (httpMethod === "GET" && productId) {
      const params = {
        TableName: INVENTORY_TABLE,
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: {
          ":productId": productId,
        },
      };
      const result = await dynamodb.query(params).promise();
      return createResponse(200, result.Items || []);
    }

    // PUT /inventory/{productId}
    if (httpMethod === "PUT" && productId) {
      const userId = getUserId(event);
      if (!userId) {
        return createResponse(401, { error: "Unauthorized" });
      }

      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (parseError) {
        return createResponse(400, { error: "Invalid JSON" });
      }

      const { locationId, quantity, reorderLevel } = body;
      if (!locationId || quantity === undefined) {
        return createResponse(400, { error: "Missing required fields" });
      }

      // Check if product exists
      const productParams = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      };
      const productResult = await dynamodb.get(productParams).promise();
      if (!productResult.Item) {
        return createResponse(404, { error: "Product not found" });
      }

      const inventoryItem = {
        productId,
        locationId,
        quantity: parseInt(quantity),
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
        updatedAt: new Date().toISOString(),
      };

      const params = {
        TableName: INVENTORY_TABLE,
        Item: inventoryItem,
      };

      await dynamodb.put(params).promise();
      return createResponse(200, inventoryItem);
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, {
      error: error.message || "Internal server error",
    });
  }
};
