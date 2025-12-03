const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const STOCK_TABLE = process.env.STOCK_TABLE;
const PARTS_TABLE = process.env.PARTS_TABLE;

function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims?.sub) return auth.claims.sub;
  if (auth.jwt?.claims?.sub) return auth.jwt.claims.sub;
  throw new Error('Unauthorized: missing user claims');
}

exports.handler = async (event) => {
  const userId = getUserId(event);
  const httpMethod = event.requestContext.http.method;
  const path = event.requestContext.http.path;
  const pathParams = event.pathParameters || {};

  try {
    switch (httpMethod) {
      case 'GET':
        if (path.includes('/low')) {
          // Get low stock items
          const allParts = await dynamoClient.send(new ScanCommand({
            TableName: PARTS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            }
          }));
          
          const lowStockParts = (allParts.Items || []).filter(part => {
            const currentStock = part.currentStock || 0;
            const threshold = part.reorderThreshold || 0;
            return currentStock <= threshold;
          });
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(lowStockParts)
          };
        } else if (pathParams.partId) {
          // Get stock for specific part
          const stockResult = await dynamoClient.send(new QueryCommand({
            TableName: STOCK_TABLE,
            KeyConditionExpression: 'partId = :partId',
            ExpressionAttributeValues: {
              ':partId': pathParams.partId
            },
            Limit: 100
          }));
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(stockResult.Items || [])
          };
        } else {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid request' })
          };
        }

      case 'PUT':
        // Update stock level
        if (!pathParams.partId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Part ID required' })
          };
        }
        
        const body = JSON.parse(event.body || '{}');
        const vehicleModel = body.vehicleModel || 'ALL';
        const quantity = body.quantity;
        const operation = body.operation || 'set'; // 'set', 'add', 'subtract'
        
        if (quantity === undefined) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Quantity required' })
          };
        }
        
        // Get current part info
        const partResult = await dynamoClient.send(new GetCommand({
          TableName: PARTS_TABLE,
          Key: { userId, partId: pathParams.partId }
        }));
        
        if (!partResult.Item) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Part not found' })
          };
        }
        
        // Get current stock
        const currentStockResult = await dynamoClient.send(new QueryCommand({
          TableName: STOCK_TABLE,
          KeyConditionExpression: 'partId = :partId AND vehicleModel = :model',
          ExpressionAttributeValues: {
            ':partId': pathParams.partId,
            ':model': vehicleModel
          },
          Limit: 1
        }));
        
        let newQuantity;
        if (currentStockResult.Items && currentStockResult.Items.length > 0) {
          const currentStock = currentStockResult.Items[0].quantity || 0;
          if (operation === 'add') {
            newQuantity = currentStock + quantity;
          } else if (operation === 'subtract') {
            newQuantity = Math.max(0, currentStock - quantity);
          } else {
            newQuantity = quantity;
          }
        } else {
          newQuantity = operation === 'subtract' ? Math.max(0, -quantity) : quantity;
        }
        
        // Update stock record
        const stockRecord = {
          partId: pathParams.partId,
          vehicleModel,
          userId,
          quantity: newQuantity,
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await dynamoClient.send(new PutCommand({
          TableName: STOCK_TABLE,
          Item: stockRecord
        }));
        
        // Update part's current stock
        const updatedPart = {
          ...partResult.Item,
          currentStock: newQuantity,
          updatedAt: new Date().toISOString()
        };
        
        await dynamoClient.send(new PutCommand({
          TableName: PARTS_TABLE,
          Item: updatedPart
        }));
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ...stockRecord, part: updatedPart })
        };

      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};

