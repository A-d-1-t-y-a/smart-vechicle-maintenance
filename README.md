# Workshop Parts Inventory & Auto-Reorder System

A cloud-based application for small car workshops to track spare parts inventory, set reorder thresholds, automatically create reorder notifications when stock runs low, and view inventory analytics.

## Features

- **Parts Management**: Add, update, and remove parts with details like part number, vehicle model, category, and supplier
- **Stock Tracking**: Track stock levels per part and per vehicle model
- **Auto-Reorder System**: Set reorder thresholds and receive automatic alerts when stock falls below threshold
- **Analytics Dashboard**: View inventory statistics, low-stock items, category breakdowns, and monthly consumption
- **User Authentication**: Secure login using Amazon Cognito

## Architecture

### AWS Services Used

1. **Amazon DynamoDB** - Store parts, stock levels, and workshop data
2. **AWS Lambda** - Business logic for CRUD operations, reorder checks, and analytics
3. **Amazon API Gateway** - REST API (HTTP API) for frontend
4. **Amazon Cognito** - User authentication and user pools
5. **Amazon SNS** - Push reorder notifications (email/SMS)
6. **Amazon S3** - Store invoices and attachments
7. **Amazon CloudWatch Events** - Scheduled rules to run periodic stock checks

### Project Structure

```
.
├── template.yaml          # SAM template defining all AWS resources
├── src/
│   └── handlers/          # Lambda function handlers
│       ├── parts.js       # Parts CRUD operations
│       ├── stock.js       # Stock level management
│       ├── reorder.js     # Reorder threshold checks
│       ├── analytics.js   # Analytics and reports
│       └── notification.js # SNS notification handler
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   └── services/      # API service layer
│   └── public/
└── README.md
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- AWS SAM CLI installed
- Node.js 18+ and npm
- Docker (for local testing, optional)

## Setup Instructions

### 1. Configure AWS Credentials

You need AWS Access Keys (not Account ID). Three ways to set them up:

**Option A: PowerShell Script**
```powershell
.\setup-aws-credentials.ps1
```

**Option B: AWS CLI Profile**
```powershell
aws configure
# Enter Access Key ID, Secret Access Key, Region: us-west-2
```

**Option C: Environment Variables**
```powershell
$env:AWS_ACCESS_KEY_ID="AKIA..."
$env:AWS_SECRET_ACCESS_KEY="..."
$env:AWS_DEFAULT_REGION="us-west-2"
```

For AWS Academy/temporary credentials, also include:
```powershell
$env:AWS_SESSION_TOKEN="..."
```

Verify credentials:
```powershell
aws sts get-caller-identity
```

### 2. Build and Deploy Backend

```powershell
# Build the SAM application
sam build

# Deploy (first time - guided)
sam deploy --guided
```

When prompted:
- **Stack Name**: `smart-vehicle-maintenance` (or press Enter)
- **AWS Region**: `us-west-2` (or press Enter)
- **Confirm changes**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Disable rollback**: `N` (recommended)
- **Save arguments to configuration file**: `Y`

**Important**: Copy the outputs immediately:
- `ApiUrl`
- `UserPoolId`
- `UserPoolClientId`
- `Region`

### 3. Configure Frontend

```powershell
cd frontend

# Copy environment template
copy .env.example .env

# Edit .env with the outputs from deployment
notepad .env
```

Update `.env` with:
```
REACT_APP_API_URL=https://YOUR-API.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_xxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
REACT_APP_REGION=us-west-2
```

**Important**: No quotes, no trailing slashes in .env file.

### 4. Install and Run Frontend

```powershell
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

## Usage

1. **Sign Up**: Create a new account
2. **Verify Email**: Check your email for verification code
3. **Sign In**: Login with your credentials
4. **Add Parts**: Navigate to Parts → Add New Part
5. **Set Reorder Thresholds**: When adding/editing parts, set the reorder threshold
6. **Manage Stock**: Update stock levels in the Stock Management page
7. **View Reorder Tasks**: Check the Reorder Tasks page for items needing reorder
8. **Analytics**: View inventory analytics and reports

## API Endpoints

### Parts
- `GET /parts` - List all parts
- `GET /parts/{partId}` - Get single part
- `POST /parts` - Create new part
- `PUT /parts/{partId}` - Update part
- `DELETE /parts/{partId}` - Delete part

### Stock
- `GET /stock/{partId}` - Get stock for part
- `GET /stock/low` - Get low stock items
- `PUT /stock/{partId}` - Update stock level

### Reorder
- `GET /reorder/tasks` - Get reorder tasks
- `POST /reorder/check` - Manually trigger reorder check

### Analytics
- `GET /analytics` - Get full analytics
- `GET /analytics?type=summary` - Get summary statistics
- `GET /analytics?type=low-stock` - Get low stock items only

## Verification Checklist

After deployment, verify all services:

```powershell
# Verify credentials and region
aws sts get-caller-identity
echo $env:AWS_DEFAULT_REGION

# Check CloudFormation stack
aws cloudformation describe-stack-resources --stack-name smart-vehicle-maintenance --region us-west-2 --output table

# Check DynamoDB tables
aws dynamodb list-tables --region us-west-2

# Check Lambda functions
aws lambda list-functions --region us-west-2 --query "Functions[?starts_with(FunctionName, 'smart-vehicle-maintenance')].FunctionName"

# Check API Gateway
aws apigatewayv2 get-apis --region us-west-2 --query "Items[?contains(ApiEndpoint, 'execute-api')].[Name,ApiEndpoint]" --output table

# Check Cognito User Pool
aws cognito-idp list-users --user-pool-id YOUR_POOL_ID --region us-west-2 --limit 5

# Check SNS Topic
aws sns list-topics --region us-west-2 --query "Topics[?contains(TopicArn, 'smart-vehicle-maintenance-reminders')].TopicArn"
```

## Troubleshooting

### Frontend says "Failed to load vehicles/parts"
- Ensure JWT token is added to Authorization header (check axios interceptor)
- Ensure Lambda functions read `jwt.claims.sub` correctly
- Confirm Cognito IDs are correct in `.env`
- Sign out and sign in again to refresh JWT after redeploy

### CloudFormation deployment fails
- Keep rollback enabled (answer `N` to "Disable rollback")
- Read the specific resource error in CloudFormation stack events
- Check IAM permissions for creating resources

### No tables in console
- Switch to `us-west-2` region in AWS Console
- Confirm you're in the right account (`aws sts get-caller-identity`)
- Check CloudFormation resources list

### "Security Constraints Not Satisfied" during deploy
- Answer `y` (not just ENTER) for each "has no authentication" prompt
- Or avoid prompts by setting `ApiId` and `Auth.Authorizer` per event in template.yaml

### Wrong Cognito authorizer type
- For HTTP API, use JWT config (issuer + audience)
- Don't mix Lambda Authorizer with JWT Authorizer

## Auto-Reorder System

The system automatically checks stock levels every hour via CloudWatch Events. When a part's stock falls below its reorder threshold:

1. A reorder task is created
2. An SNS notification is sent (if SNS topic is configured)
3. The item appears in the Reorder Tasks page

To configure SNS notifications:
1. Subscribe to the SNS topic (email or SMS)
2. Confirm the subscription
3. You'll receive alerts when stock is low

## Security Notes

- All API endpoints require Cognito JWT authentication
- Each user can only access their own parts (filtered by userId)
- S3 bucket has public access blocked
- API Gateway CORS is configured for frontend access

## Cost Optimization

- DynamoDB uses PAY_PER_REQUEST billing mode (no provisioned capacity)
- Lambda functions have 512MB memory and 30s timeout
- CloudWatch Events rule runs hourly (adjustable in template.yaml)

## License

This project is provided as-is for educational and commercial use.

