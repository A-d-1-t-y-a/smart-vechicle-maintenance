# Architecture Overview

## System Architecture

```
┌─────────────┐
│   React     │
│  Frontend   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  API Gateway    │
│   (HTTP API)    │
└──────┬──────────┘
       │ JWT Auth
       ▼
┌─────────────────┐
│  Amazon Cognito │
│   User Pool     │
└─────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Lambda Functions            │
├─────────────────────────────────────┤
│  • PartsFunction (CRUD)             │
│  • StockFunction (Stock Management)  │
│  • ReorderFunction (Threshold Check) │
│  • AnalyticsFunction (Reports)      │
│  • NotificationFunction (SNS)       │
└──────┬──────────────────────────────┘
       │
       ├──► DynamoDB (Parts Table)
       ├──► DynamoDB (Stock Table)
       ├──► SNS (Notifications)
       └──► S3 (Attachments)
       
┌─────────────────┐
│ CloudWatch      │
│ Events (Hourly) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ReorderFunction │
│ (Auto-Check)    │
└─────────────────┘
```

## AWS Services Details

### 1. Amazon DynamoDB

**Tables:**
- **PartsTable** (`smart-vehicle-maintenance-parts`)
  - Primary Key: `userId` (HASH) + `partId` (RANGE)
  - GSI: `VehicleModelIndex` on `vehicleModel` + `partId`
  - Stores: Part details, prices, reorder thresholds, suppliers

- **StockTable** (`smart-vehicle-maintenance-stock`)
  - Primary Key: `partId` (HASH) + `vehicleModel` (RANGE)
  - GSI: `UserIdTimestampIndex` on `userId` + `timestamp`
  - Stores: Stock levels per part and vehicle model

**Billing:** PAY_PER_REQUEST (no provisioned capacity)

### 2. AWS Lambda Functions

**PartsFunction** (`smart-vehicle-maintenance-parts`)
- Handles CRUD operations for parts
- Endpoints: GET, POST, PUT, DELETE `/parts`
- Permissions: DynamoDB (PartsTable), S3 (read/write)

**StockFunction** (`smart-vehicle-maintenance-stock`)
- Manages stock levels
- Endpoints: GET `/stock/{partId}`, GET `/stock/low`, PUT `/stock/{partId}`
- Permissions: DynamoDB (StockTable, PartsTable)

**ReorderFunction** (`smart-vehicle-maintenance-reorder`)
- Checks stock against thresholds
- Endpoints: GET `/reorder/tasks`, POST `/reorder/check`
- Triggered by: API calls + CloudWatch Events (hourly)
- Permissions: DynamoDB (read), SNS (publish)

**AnalyticsFunction** (`smart-vehicle-maintenance-analytics`)
- Generates inventory analytics
- Endpoint: GET `/analytics`
- Permissions: DynamoDB (read)

**NotificationFunction** (`smart-vehicle-maintenance-notification`)
- Sends SNS notifications
- Invoked by: Other functions or directly
- Permissions: SNS (publish), DynamoDB (read)

**Configuration:**
- Runtime: Node.js 20.x
- Memory: 512 MB
- Timeout: 30 seconds

### 3. Amazon API Gateway

**Type:** HTTP API (not REST API)
- Lower latency and cost
- Built-in CORS support
- JWT authorizer with Cognito

**Authentication:**
- Cognito JWT Authorizer
- All endpoints require valid JWT token
- Token extracted from `Authorization: Bearer <token>` header

**CORS:**
- Allow Origins: `*`
- Allow Methods: GET, POST, PUT, DELETE, OPTIONS
- Allow Headers: Content-Type, Authorization

### 4. Amazon Cognito

**User Pool:** `smart-vehicle-maintenance-users`
- Email-based authentication
- Auto-verified email addresses
- Password policy:
  - Minimum 8 characters
  - Require uppercase, lowercase, numbers
  - Symbols optional

**App Client:** `smart-vehicle-maintenance-client`
- No client secret (for frontend use)
- Auth flows: USER_PASSWORD_AUTH, USER_SRP_AUTH, REFRESH_TOKEN_AUTH

### 5. Amazon SNS

**Topic:** `smart-vehicle-maintenance-reminders`
- Sends reorder notifications
- Supports email and SMS subscriptions
- Triggered when stock ≤ threshold

**Subscription:**
1. Go to SNS Console
2. Find the topic
3. Create subscription (Email or SMS)
4. Confirm subscription

### 6. Amazon S3

**Bucket:** `{StackName}-attachments-{AccountId}`
- Stores invoices and attachments
- Versioning enabled
- Public access blocked
- Access via Lambda functions only

### 7. Amazon CloudWatch Events (EventBridge)

**Rule:** `smart-vehicle-maintenance-stock-check`
- Schedule: `rate(1 hour)`
- Target: ReorderFunction
- Automatically checks all parts for low stock
- Sends notifications if needed

## Data Flow

### Adding a Part
1. User submits form → Frontend
2. Frontend → API Gateway (with JWT)
3. API Gateway → PartsFunction
4. PartsFunction → DynamoDB (PartsTable)
5. Response → Frontend

### Stock Update
1. User updates stock → Frontend
2. Frontend → API Gateway
3. API Gateway → StockFunction
4. StockFunction → DynamoDB (StockTable + PartsTable)
5. Response → Frontend

### Auto-Reorder Check
1. CloudWatch Events triggers (hourly)
2. EventBridge → ReorderFunction
3. ReorderFunction scans PartsTable
4. For each part with stock ≤ threshold:
   - Creates reorder task
   - Publishes to SNS
5. SNS → Email/SMS to subscribers

### Analytics Request
1. User views analytics → Frontend
2. Frontend → API Gateway
3. API Gateway → AnalyticsFunction
4. AnalyticsFunction queries DynamoDB
5. Calculates statistics
6. Response → Frontend

## Security

1. **Authentication:** All API calls require Cognito JWT
2. **Authorization:** Users can only access their own data (filtered by userId)
3. **Data Isolation:** DynamoDB queries filtered by userId
4. **S3 Security:** Bucket has public access blocked
5. **API Security:** CORS configured, JWT validation on all routes

## Scalability

- **DynamoDB:** PAY_PER_REQUEST scales automatically
- **Lambda:** Auto-scales based on request volume
- **API Gateway:** Handles high request rates automatically
- **No single point of failure:** All services are managed AWS services

## Cost Optimization

- DynamoDB: Pay only for what you use (no provisioned capacity)
- Lambda: Pay per invocation (512MB, 30s timeout)
- API Gateway HTTP API: Lower cost than REST API
- CloudWatch Events: Free tier includes 1M invocations/month
- SNS: First 1M requests/month free

## Monitoring

- CloudWatch Logs: All Lambda functions log to CloudWatch
- CloudWatch Metrics: Lambda invocations, errors, duration
- DynamoDB Metrics: Read/Write capacity, throttles
- API Gateway Metrics: Request count, latency, errors

## Disaster Recovery

- DynamoDB: Point-in-time recovery (can be enabled)
- S3: Versioning enabled
- Lambda: Code stored in S3 (managed by SAM)
- CloudFormation: Stack can be recreated from template

