const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const snsClient = new SNSClient({ region: process.env.REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
const REMINDERS_TOPIC_ARN = process.env.REMINDERS_TOPIC_ARN;
const PARTS_TABLE = process.env.PARTS_TABLE;

exports.handler = async (event) => {
  try {
    // This function can be invoked directly or via SNS
    // For now, it's a helper function that can send notifications
    
    const { partId, message, subject, userId } = event;
    
    if (!REMINDERS_TOPIC_ARN) {
      console.warn('REMINDERS_TOPIC_ARN not set, skipping notification');
      return { statusCode: 200, body: JSON.stringify({ message: 'No topic configured' }) };
    }
    
    let notificationSubject = subject || 'Parts Inventory Alert';
    let notificationMessage = message || 'Stock level alert';
    
    // If partId is provided, get part details
    if (partId && userId) {
      const partResult = await dynamoClient.send(new ScanCommand({
        TableName: PARTS_TABLE,
        FilterExpression: 'partId = :partId AND userId = :userId',
        ExpressionAttributeValues: {
          ':partId': partId,
          ':userId': userId
        }
      }));
      
      if (partResult.Items && partResult.Items.length > 0) {
        const part = partResult.Items[0];
        notificationSubject = `Low Stock Alert: ${part.partName}`;
        notificationMessage = `Part "${part.partName}" (${part.partNumber}) is below reorder threshold.\n\n` +
                            `Current Stock: ${part.currentStock || 0}\n` +
                            `Reorder Threshold: ${part.reorderThreshold || 0}\n` +
                            `Vehicle Model: ${part.vehicleModel || 'ALL'}\n` +
                            `Supplier: ${part.supplier || 'N/A'}`;
      }
    }
    
    await snsClient.send(new PublishCommand({
      TopicArn: REMINDERS_TOPIC_ARN,
      Subject: notificationSubject,
      Message: notificationMessage
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notification sent successfully' })
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send notification' })
    };
  }
};

