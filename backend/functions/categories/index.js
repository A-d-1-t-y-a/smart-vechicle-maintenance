const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
    const categoryId = pathParameters.categoryId;

    // GET /categories
    if (httpMethod === "GET" && !categoryId) {
      const params = {
        TableName: CATEGORIES_TABLE,
      };
      const result = await dynamodb.scan(params).promise();
      return createResponse(200, result.Items || []);
    }

    // GET /categories/{categoryId}
    if (httpMethod === "GET" && categoryId) {
      const params = {
        TableName: CATEGORIES_TABLE,
        Key: { categoryId },
      };
      const result = await dynamodb.get(params).promise();
      if (!result.Item) {
        return createResponse(404, { error: "Category not found" });
      }
      return createResponse(200, result.Item);
    }

    // POST /categories
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

      const { name, description, imageUrl } = body;
      if (!name) {
        return createResponse(400, { error: "Missing required fields" });
      }

      const categoryId = `cat-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const category = {
        categoryId,
        name,
        description: description || "",
        imageUrl: imageUrl || "",
        createdAt: new Date().toISOString(),
      };

      const params = {
        TableName: CATEGORIES_TABLE,
        Item: category,
      };

      await dynamodb.put(params).promise();
      return createResponse(201, category);
    }

    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Error:", error);
    return createResponse(500, {
      error: error.message || "Internal server error",
    });
  }
};
