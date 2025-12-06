const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE;

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
    const categoryId = pathParameters.categoryId;

    // GET /products
    if (httpMethod === "GET" && !productId && !categoryId) {
      const params = {
        TableName: PRODUCTS_TABLE,
      };
      const result = await dynamodb.scan(params).promise();
      return createResponse(200, result.Items || []);
    }

    // GET /products/{productId}
    if (httpMethod === "GET" && productId && !categoryId) {
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

    // GET /products/category/{categoryId}
    if (httpMethod === "GET" && categoryId) {
      const params = {
        TableName: PRODUCTS_TABLE,
        IndexName: "category-index",
        KeyConditionExpression: "categoryId = :categoryId",
        ExpressionAttributeValues: {
          ":categoryId": categoryId,
        },
      };
      const result = await dynamodb.query(params).promise();
      return createResponse(200, result.Items || []);
    }

    // POST /products
    if (httpMethod === "POST") {
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

      const { name, description, price, categoryId, imageUrl, unit, brand } =
        body;
      if (!name || !price || !categoryId) {
        return createResponse(400, { error: "Missing required fields" });
      }

      const productId = `prod-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const product = {
        productId,
        name,
        description: description || "",
        price: parseFloat(price),
        categoryId,
        imageUrl: imageUrl || "",
        unit: unit || "piece",
        brand: brand || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const params = {
        TableName: PRODUCTS_TABLE,
        Item: product,
      };

      await dynamodb.put(params).promise();
      return createResponse(201, product);
    }

    // PUT /products/{productId}
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
      if (body.categoryId) {
        updateExpression.push("categoryId = :categoryId");
        expressionAttributeValues[":categoryId"] = body.categoryId;
      }
      if (body.imageUrl !== undefined) {
        updateExpression.push("imageUrl = :imageUrl");
        expressionAttributeValues[":imageUrl"] = body.imageUrl;
      }
      if (body.unit) {
        updateExpression.push("#unit = :unit");
        expressionAttributeNames["#unit"] = "unit";
        expressionAttributeValues[":unit"] = body.unit;
      }
      if (body.brand) {
        updateExpression.push("brand = :brand");
        expressionAttributeValues[":brand"] = body.brand;
      }

      updateExpression.push("updatedAt = :updatedAt");
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      const params = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      };

      const result = await dynamodb.update(params).promise();
      return createResponse(200, result.Attributes);
    }

    // DELETE /products/{productId}
    if (httpMethod === "DELETE" && productId) {
      const userId = getUserId(event);
      if (!userId) {
        return createResponse(401, { error: "Unauthorized" });
      }

      const params = {
        TableName: PRODUCTS_TABLE,
        Key: { productId },
      };

      await dynamodb.delete(params).promise();
      return createResponse(200, { message: "Product deleted" });
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, {
      error: error.message || "Internal server error",
    });
  }
};
