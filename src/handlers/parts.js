const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
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
        if (pathParams.partId) {
          // Get single part
          const result = await dynamoClient.send(new GetCommand({
            TableName: PARTS_TABLE,
            Key: { userId, partId: pathParams.partId }
          }));
          
          if (!result.Item) {
            return {
              statusCode: 404,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Part not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result.Item)
          };
        } else {
          // List all parts for user
          const queryParams = event.queryStringParameters || {};
          let parts;
          
          if (queryParams.vehicleModel) {
            // Query by vehicle model using GSI
            parts = await dynamoClient.send(new QueryCommand({
              TableName: PARTS_TABLE,
              IndexName: 'VehicleModelIndex',
              KeyConditionExpression: 'vehicleModel = :model',
              ExpressionAttributeValues: {
                ':model': queryParams.vehicleModel
              }
            }));
          } else {
            // Query all parts for user
            parts = await dynamoClient.send(new QueryCommand({
              TableName: PARTS_TABLE,
              KeyConditionExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': userId
              }
            }));
          }
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(parts.Items || [])
          };
        }

      case 'POST':
        // Create new part
        const body = JSON.parse(event.body || '{}');
        const partId = body.partId || `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newPart = {
          userId,
          partId,
          partName: body.partName,
          partNumber: body.partNumber || '',
          description: body.description || '',
          vehicleModel: body.vehicleModel || '',
          category: body.category || '',
          unitPrice: body.unitPrice || 0,
          reorderThreshold: body.reorderThreshold || 0,
          currentStock: body.currentStock || 0,
          supplier: body.supplier || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await dynamoClient.send(new PutCommand({
          TableName: PARTS_TABLE,
          Item: newPart
        }));
        
        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(newPart)
        };

      case 'PUT':
        // Update part
        if (!pathParams.partId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Part ID required' })
          };
        }
        
        const existing = await dynamoClient.send(new GetCommand({
          TableName: PARTS_TABLE,
          Key: { userId, partId: pathParams.partId }
        }));
        
        if (!existing.Item) {
          return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Part not found' })
          };
        }
        
        const updateBody = JSON.parse(event.body || '{}');
        const updatedPart = {
          ...existing.Item,
          ...updateBody,
          partId: pathParams.partId,
          userId,
          updatedAt: new Date().toISOString()
        };
        
        await dynamoClient.send(new PutCommand({
          TableName: PARTS_TABLE,
          Item: updatedPart
        }));
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(updatedPart)
        };

      case 'DELETE':
        // Delete part
        if (!pathParams.partId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Part ID required' })
          };
        }
        
        await dynamoClient.send(new DeleteCommand({
          TableName: PARTS_TABLE,
          Key: { userId, partId: pathParams.partId }
        }));
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Part deleted successfully' })
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

