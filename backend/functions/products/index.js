const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
  return null; // Products can be viewed without auth
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

exports.handler = async (event) => {
  try {
    // Log environment for debugging
    console.log("PRODUCTS_TABLE:", PRODUCTS_TABLE);
    console.log("Event:", JSON.stringify(event, null, 2));

    // Handle different event structures (HTTP API vs REST API)
    const httpMethod =
      event.requestContext?.http?.method ||
      event.httpMethod ||
      event.requestContext?.httpMethod;
    if (!httpMethod) {
      console.error("Could not determine HTTP method from event");
      return createResponse(500, { error: "Invalid event structure" });
    }

    const userId = getUserId(event);
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};

    // GET /products - Get all products (with optional category filter)
    if (
      httpMethod === "GET" &&
      !pathParameters.productId &&
      !pathParameters.category
    ) {
      let params = {
        TableName: PRODUCTS_TABLE,
      };

      // If category query parameter, use GSI
      if (queryParameters.category) {
        params = {
          TableName: PRODUCTS_TABLE,
          IndexName: "category-index",
          KeyConditionExpression: "category = :category",
          ExpressionAttributeValues: {
            ":category": queryParameters.category,
          },
          ScanIndexForward: false, // Sort by createdAt descending
        };
        const result = await dynamodb.query(params).promise();
        return createResponse(200, { products: result.Items || [] });
      }

      // Otherwise scan all products
      const result = await dynamodb.scan(params).promise();
      return createResponse(200, { products: result.Items || [] });
    }

    // GET /products/category/{category} - Get products by category
    if (httpMethod === "GET" && pathParameters.category) {
      const params = {
        TableName: PRODUCTS_TABLE,
        IndexName: "category-index",
        KeyConditionExpression: "category = :category",
        ExpressionAttributeValues: {
          ":category": pathParameters.category,
        },
        ScanIndexForward: false,
      };

      const result = await dynamodb.query(params).promise();
      return createResponse(200, { products: result.Items || [] });
    }

    // GET /products/{productId} - Get single product
    if (httpMethod === "GET" && pathParameters.productId) {
      const productId = pathParameters.productId;
      const params = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      };

      const result = await dynamodb.get(params).promise();
      if (!result.Item) {
        return createResponse(404, { error: "Product not found" });
      }
      return createResponse(200, result.Item);
    }

    // POST /products - Create product (requires auth)
    if (httpMethod === "POST") {
      console.log("POST /products - userId:", userId);

      if (!userId) {
        console.log("No userId found - unauthorized");
        return createResponse(401, {
          error: "Unauthorized: Please login to add products",
        });
      }

      // Check if table name is set
      if (!PRODUCTS_TABLE) {
        console.error("PRODUCTS_TABLE environment variable is not set");
        return createResponse(500, {
          error: "Server configuration error: PRODUCTS_TABLE not set",
        });
      }

      let body;
      try {
        const bodyString = event.body || "{}";
        console.log("Request body:", bodyString);
        body = JSON.parse(bodyString);
        console.log("Parsed body:", JSON.stringify(body, null, 2));
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Body that failed to parse:", event.body);
        return createResponse(400, { error: "Invalid JSON in request body" });
      }

      const productId =
        body.productId ||
        `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const product = {
        productId,
        name: body.name,
        description: body.description || "",
        price: parseFloat(body.price) || 0,
        category: body.category || "general",
        imageUrl: body.imageUrl || "",
        stock: parseInt(body.stock) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate required fields
      if (!product.name || product.price <= 0) {
        return createResponse(400, {
          error: "Name and valid price are required",
        });
      }

      const params = {
        TableName: PRODUCTS_TABLE,
        Item: product,
      };

      try {
        await dynamodb.put(params).promise();
        return createResponse(201, product);
      } catch (dbError) {
        console.error("DynamoDB error:", dbError);
        return createResponse(500, {
          error: "Failed to create product",
          details: dbError.message,
        });
      }
    }

    // PUT /products/{productId} - Update product (requires auth)
    if (httpMethod === "PUT" && pathParameters.productId) {
      if (!userId) {
        return createResponse(401, { error: "Unauthorized" });
      }

      const productId = pathParameters.productId;
      const body = JSON.parse(event.body || "{}");

      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      if (body.name) {
        updateExpression.push("#name = :name");
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = body.name;
      }
      if (body.description !== undefined) {
        updateExpression.push("#description = :description");
        expressionAttributeNames["#description"] = "description";
        expressionAttributeValues[":description"] = body.description;
      }
      if (body.price !== undefined) {
        updateExpression.push("#price = :price");
        expressionAttributeNames["#price"] = "price";
        expressionAttributeValues[":price"] = parseFloat(body.price);
      }
      if (body.category) {
        updateExpression.push("#category = :category");
        expressionAttributeNames["#category"] = "category";
        expressionAttributeValues[":category"] = body.category;
      }
      if (body.imageUrl !== undefined) {
        updateExpression.push("#imageUrl = :imageUrl");
        expressionAttributeNames["#imageUrl"] = "imageUrl";
        expressionAttributeValues[":imageUrl"] = body.imageUrl;
      }
      if (body.stock !== undefined) {
        updateExpression.push("#stock = :stock");
        expressionAttributeNames["#stock"] = "stock";
        expressionAttributeValues[":stock"] = parseInt(body.stock);
      }

      if (updateExpression.length === 0) {
        return createResponse(400, { error: "No fields to update" });
      }

      updateExpression.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      const params = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      };

      const result = await dynamodb.update(params).promise();
      return createResponse(200, result.Attributes);
    }

    // DELETE /products/{productId} - Delete product (requires auth)
    if (httpMethod === "DELETE" && pathParameters.productId) {
      if (!userId) {
        return createResponse(401, { error: "Unauthorized" });
      }

      const productId = pathParameters.productId;
      const params = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      };

      await dynamodb.delete(params).promise();
      return createResponse(200, { message: "Product deleted successfully" });
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Event:", JSON.stringify(event, null, 2));
    return createResponse(500, {
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
