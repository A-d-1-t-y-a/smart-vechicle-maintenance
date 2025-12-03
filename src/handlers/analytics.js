const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const PARTS_TABLE = process.env.PARTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;

function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims?.sub) return auth.claims.sub;
  if (auth.jwt?.claims?.sub) return auth.jwt.claims.sub;
  throw new Error('Unauthorized: missing user claims');
}

function getMonthStartEnd(monthOffset = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthOffset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

exports.handler = async (event) => {
  const userId = getUserId(event);
  const httpMethod = event.requestContext.http.method;
  const queryParams = event.queryStringParameters || {};
  
  try {
    if (httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Get all parts for user
    const partsResult = await dynamoClient.send(new ScanCommand({
      TableName: PARTS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    const parts = partsResult.Items || [];
    
    // Calculate analytics
    const analytics = {
      totalParts: parts.length,
      totalValue: 0,
      lowStockCount: 0,
      lowStockItems: [],
      categories: {},
      vehicleModels: {},
      monthlyConsumption: {}
    };
    
    // Get month range for consumption
    const { start: monthStart, end: monthEnd } = getMonthStartEnd(0);
    
    for (const part of parts) {
      const currentStock = part.currentStock || 0;
      const unitPrice = part.unitPrice || 0;
      const threshold = part.reorderThreshold || 0;
      
      // Total inventory value
      analytics.totalValue += currentStock * unitPrice;
      
      // Low stock tracking
      if (currentStock <= threshold && threshold > 0) {
        analytics.lowStockCount++;
        analytics.lowStockItems.push({
          partId: part.partId,
          partName: part.partName,
          partNumber: part.partNumber,
          currentStock,
          reorderThreshold: threshold,
          vehicleModel: part.vehicleModel || 'ALL'
        });
      }
      
      // Category breakdown
      const category = part.category || 'Uncategorized';
      if (!analytics.categories[category]) {
        analytics.categories[category] = {
          count: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }
      analytics.categories[category].count++;
      analytics.categories[category].totalValue += currentStock * unitPrice;
      if (currentStock <= threshold && threshold > 0) {
        analytics.categories[category].lowStockCount++;
      }
      
      // Vehicle model breakdown
      const vehicleModel = part.vehicleModel || 'ALL';
      if (!analytics.vehicleModels[vehicleModel]) {
        analytics.vehicleModels[vehicleModel] = {
          count: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }
      analytics.vehicleModels[vehicleModel].count++;
      analytics.vehicleModels[vehicleModel].totalValue += currentStock * unitPrice;
      if (currentStock <= threshold && threshold > 0) {
        analytics.vehicleModels[vehicleModel].lowStockCount++;
      }
      
      // Monthly consumption (simplified - would need stock history)
      // For now, we'll estimate based on stock movements
      if (part.updatedAt) {
        const updatedDate = new Date(part.updatedAt);
        if (updatedDate >= new Date(monthStart) && updatedDate <= new Date(monthEnd)) {
          const monthKey = updatedDate.toISOString().substring(0, 7); // YYYY-MM
          if (!analytics.monthlyConsumption[monthKey]) {
            analytics.monthlyConsumption[monthKey] = {
              partsUpdated: 0,
              estimatedConsumption: 0
            };
          }
          analytics.monthlyConsumption[monthKey].partsUpdated++;
        }
      }
    }
    
    // Sort low stock items by urgency (stock/threshold ratio)
    analytics.lowStockItems.sort((a, b) => {
      const ratioA = a.currentStock / (a.reorderThreshold || 1);
      const ratioB = b.currentStock / (b.reorderThreshold || 1);
      return ratioA - ratioB;
    });
    
    // Format response based on query params
    if (queryParams.type === 'low-stock') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(analytics.lowStockItems)
      };
    }
    
    if (queryParams.type === 'summary') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          totalParts: analytics.totalParts,
          totalValue: Math.round(analytics.totalValue * 100) / 100,
          lowStockCount: analytics.lowStockCount,
          categoriesCount: Object.keys(analytics.categories).length,
          vehicleModelsCount: Object.keys(analytics.vehicleModels).length
        })
      };
    }
    
    // Return full analytics
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(analytics)
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

