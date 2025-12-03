const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const snsClient = new SNSClient({ region: process.env.REGION });
const PARTS_TABLE = process.env.PARTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;
const REMINDERS_TOPIC_ARN = process.env.REMINDERS_TOPIC_ARN;

function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims?.sub) return auth.claims.sub;
  if (auth.jwt?.claims?.sub) return auth.jwt.claims.sub;
  // For scheduled events, there's no user context
  if (event.requestContext === undefined) return null;
  throw new Error('Unauthorized: missing user claims');
}

async function checkAndNotifyLowStock(userId = null) {
  try {
    // Get all parts
    const scanParams = userId 
      ? {
          TableName: PARTS_TABLE,
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId }
        }
      : {
          TableName: PARTS_TABLE
        };
    
    const partsResult = await dynamoClient.send(new ScanCommand(scanParams));
    const parts = partsResult.Items || [];
    
    const lowStockItems = [];
    const reorderTasks = [];
    
    for (const part of parts) {
      const currentStock = part.currentStock || 0;
      const threshold = part.reorderThreshold || 0;
      
      if (currentStock <= threshold && threshold > 0) {
        lowStockItems.push(part);
        
        const reorderTask = {
          partId: part.partId,
          partName: part.partName,
          partNumber: part.partNumber,
          currentStock,
          reorderThreshold: threshold,
          vehicleModel: part.vehicleModel || 'ALL',
          supplier: part.supplier || '',
          unitPrice: part.unitPrice || 0,
          suggestedOrderQuantity: Math.max(threshold * 2, 10), // Order at least 2x threshold or 10 units
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        
        reorderTasks.push(reorderTask);
      }
    }
    
    // Send notifications if there are low stock items
    if (lowStockItems.length > 0 && REMINDERS_TOPIC_ARN) {
      const message = {
        subject: `Low Stock Alert: ${lowStockItems.length} part(s) need reordering`,
        body: `The following parts are below their reorder threshold:\n\n` +
              lowStockItems.map(p => 
                `- ${p.partName} (${p.partNumber}): Current: ${p.currentStock}, Threshold: ${p.reorderThreshold}`
              ).join('\n') +
              `\n\nPlease review and place orders as needed.`
      };
      
      try {
        await snsClient.send(new PublishCommand({
          TopicArn: REMINDERS_TOPIC_ARN,
          Subject: message.subject,
          Message: message.body
        }));
      } catch (snsError) {
        console.error('SNS publish error:', snsError);
      }
    }
    
    return { lowStockItems, reorderTasks };
  } catch (error) {
    console.error('Error checking stock:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  try {
    // Handle scheduled event (from CloudWatch Events)
    if (event.source === 'aws.events' || !event.requestContext) {
      // Scheduled check - check all users' parts
      const result = await checkAndNotifyLowStock();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Stock check completed',
          lowStockCount: result.lowStockItems.length,
          reorderTasksCount: result.reorderTasks.length
        })
      };
    }
    
    // Handle API requests
    const userId = getUserId(event);
    const httpMethod = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    
    switch (httpMethod) {
      case 'POST':
        if (path.includes('/check')) {
          // Manual reorder check
          const result = await checkAndNotifyLowStock(userId);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              message: 'Reorder check completed',
              lowStockItems: result.lowStockItems,
              reorderTasks: result.reorderTasks
            })
          };
        }
        break;
        
      case 'GET':
        if (path.includes('/tasks')) {
          // Get reorder tasks (low stock items)
          const result = await checkAndNotifyLowStock(userId);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result.reorderTasks)
          };
        }
        break;
    }
    
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};

