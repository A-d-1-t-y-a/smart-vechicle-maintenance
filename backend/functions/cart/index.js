const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
  throw new Error('Unauthorized: missing user claims');
}

// Helper to create response
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

// Verify product exists and get details
async function getProduct(productId) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: { productId }
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    const httpMethod = event.requestContext.http.method;
    const pathParameters = event.pathParameters || {};

    // GET /cart - Get user's cart
    if (httpMethod === 'GET') {
      const params = {
        TableName: CART_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const result = await dynamodb.query(params).promise();
      const cartItems = result.Items || [];

      // Enrich cart items with product details
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          const product = await getProduct(item.productId);
          return {
            ...item,
            product: product || null
          };
        })
      );

      // Calculate totals
      const subtotal = enrichedItems.reduce((sum, item) => {
        const product = item.product;
        if (product) {
          return sum + (product.price * item.quantity);
        }
        return sum;
      }, 0);

      return createResponse(200, {
        items: enrichedItems,
        subtotal: subtotal.toFixed(2),
        itemCount: enrichedItems.length
      });
    }

    // POST /cart - Add item to cart
    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const productId = body.productId;
      const quantity = parseInt(body.quantity) || 1;

      if (!productId) {
        return createResponse(400, { error: 'Product ID is required' });
      }

      // Verify product exists
      const product = await getProduct(productId);
      if (!product) {
        return createResponse(404, { error: 'Product not found' });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return createResponse(400, { error: 'Insufficient stock available' });
      }

      // Check if item already in cart
      const existingParams = {
        TableName: CART_TABLE,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'productId = :productId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':productId': productId
        }
      };

      const existing = await dynamodb.query(existingParams).promise();
      
      if (existing.Items && existing.Items.length > 0) {
        // Update quantity
        const existingItem = existing.Items[0];
        const newQuantity = existingItem.quantity + quantity;
        
        if (product.stock < newQuantity) {
          return createResponse(400, { error: 'Insufficient stock available' });
        }

        const updateParams = {
          TableName: CART_TABLE,
          Key: {
            userId,
            cartItemId: existingItem.cartItemId
          },
          UpdateExpression: 'SET quantity = :quantity, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':quantity': newQuantity,
            ':updatedAt': new Date().toISOString()
          },
          ReturnValues: 'ALL_NEW'
        };

        const result = await dynamodb.update(updateParams).promise();
        return createResponse(200, result.Attributes);
      } else {
        // Add new item
        const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const cartItem = {
          userId,
          cartItemId,
          productId,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const params = {
          TableName: CART_TABLE,
          Item: cartItem
        };

        await dynamodb.put(params).promise();
        return createResponse(201, cartItem);
      }
    }

    // PUT /cart/{cartItemId} - Update cart item quantity
    if (httpMethod === 'PUT' && pathParameters.cartItemId) {
      const cartItemId = pathParameters.cartItemId;
      const body = JSON.parse(event.body || '{}');
      const quantity = parseInt(body.quantity);

      if (!quantity || quantity < 1) {
        return createResponse(400, { error: 'Valid quantity is required' });
      }

      // Get existing cart item
      const getParams = {
        TableName: CART_TABLE,
        Key: { userId, cartItemId }
      };

      const existing = await dynamodb.get(getParams).promise();
      if (!existing.Item) {
        return createResponse(404, { error: 'Cart item not found' });
      }

      // Verify product and stock
      const product = await getProduct(existing.Item.productId);
      if (!product) {
        return createResponse(404, { error: 'Product not found' });
      }

      if (product.stock < quantity) {
        return createResponse(400, { error: 'Insufficient stock available' });
      }

      const updateParams = {
        TableName: CART_TABLE,
        Key: { userId, cartItemId },
        UpdateExpression: 'SET quantity = :quantity, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':quantity': quantity,
          ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamodb.update(updateParams).promise();
      return createResponse(200, result.Attributes);
    }

    // DELETE /cart/{cartItemId} - Remove item from cart
    if (httpMethod === 'DELETE' && pathParameters.cartItemId) {
      const cartItemId = pathParameters.cartItemId;
      const params = {
        TableName: CART_TABLE,
        Key: { userId, cartItemId }
      };

      await dynamodb.delete(params).promise();
      return createResponse(200, { message: 'Item removed from cart' });
    }

    // DELETE /cart - Clear entire cart
    if (httpMethod === 'DELETE' && !pathParameters.cartItemId) {
      // Get all cart items
      const getParams = {
        TableName: CART_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const result = await dynamodb.query(getParams).promise();
      const items = result.Items || [];

      // Delete all items
      await Promise.all(
        items.map(item =>
          dynamodb.delete({
            TableName: CART_TABLE,
            Key: { userId, cartItemId: item.cartItemId }
          }).promise()
        )
      );

      return createResponse(200, { message: 'Cart cleared successfully' });
    }

    return createResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, { error: error.message });
  }
};
