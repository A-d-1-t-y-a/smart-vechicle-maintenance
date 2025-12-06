# AWS Serverless E-Commerce Platform - Complete Project Summary

## Executive Summary

This document provides a comprehensive guide for building a fully functional, serverless e-commerce platform on AWS. It covers the complete journey from initial setup to public deployment, including all blockers encountered, mistakes made, and solutions implemented.

---

## 1. Project Architecture

### Technology Stack

**Backend (Serverless):**
- AWS Lambda (Node.js 18.x) - Serverless compute
- AWS DynamoDB - NoSQL database (Products, Cart, Orders tables)
- AWS API Gateway (HTTP API) - RESTful API with JWT authentication
- AWS Cognito - User authentication and JWT token generation
- AWS SAM - Infrastructure as Code

**Frontend:**
- React 18 with React Router 6
- Axios for API calls
- Amazon Cognito Identity JS for authentication

**Deployment:**
- AWS S3 - Static website hosting
- AWS CloudFront - CDN with HTTPS (required for mobile/public access)

### System Flow

```
User → CloudFront (HTTPS) → S3 → React App
  ↓
API Gateway → JWT Authorizer (Cognito) → Lambda Functions → DynamoDB
```

---

## 2. AWS Services Deep Dive

### 2.1 AWS Lambda Functions

**Key Implementation Pattern:**

```javascript
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME; // From SAM template

function getUserId(event) {
  const auth = event?.requestContext?.authorizer || {};
  if (auth.claims && auth.claims.sub) {
    return auth.claims.sub; // Cognito user ID
  }
  return null; // Return null, don't throw
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) {
      return createResponse(401, { error: 'Unauthorized' });
    }
    // Business logic
  } catch (error) {
    return createResponse(500, { error: error.message });
  }
};
```

**Critical Learnings:**
- Always return `null` from helpers, check auth at handler level
- Environment variables injected automatically by SAM
- Always handle JSON parsing: `event.body` is a string
- Use consistent response format with CORS headers

### 2.2 AWS DynamoDB Tables

**Table Design:**

1. **ProductsTable:**
   - Partition Key: `productId` (String)
   - GSI: `category-index` (category + createdAt)
   - Billing: PAY_PER_REQUEST

2. **CartTable:**
   - Partition Key: `userId`, Sort Key: `cartItemId`
   - User-specific cart items

3. **OrdersTable:**
   - Partition Key: `userId`, Sort Key: `orderId`
   - GSI: `orderDate-index`

**Critical Learnings:**
- Use `PAY_PER_REQUEST` for development (no capacity planning)
- GSI enables efficient queries by category/date
- Composite keys (Partition + Sort) for user-scoped data

### 2.3 AWS API Gateway (HTTP API)

**Configuration:**
```yaml
HttpApiGateway:
  Type: AWS::Serverless::HttpApi
  Properties:
    CorsConfiguration:
      AllowOrigins: ['*']
      AllowMethods: [GET, POST, PUT, DELETE, OPTIONS]
      AllowHeaders: [Content-Type, Authorization]
    Auth:
      Authorizers:
        CognitoJwtAuthorizer:
          JwtConfiguration:
            issuer: !Sub 'https://cognito-idp.${AWS::Region}.amazonaws.com/${UserPool}'
            audience: [!Ref UserPoolClient]
```

**Critical Learnings:**
- HTTP API is simpler and cheaper than REST API
- CORS must be configured at API Gateway level
- JWT claims injected into `event.requestContext.authorizer`
- Public endpoints don't need `Auth` property

### 2.4 AWS Cognito User Pool

**Configuration:**
```yaml
UserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    AutoVerifiedAttributes: [email]
    UsernameAttributes: [email]
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: true

UserPoolClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    GenerateSecret: false  # Must be false for frontend
    ExplicitAuthFlows:
      - ALLOW_USER_PASSWORD_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH
```

**Frontend Integration:**
```javascript
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const POOL_DATA = {
  UserPoolId: 'us-west-2_xxxxx',
  ClientId: 'xxxxxxxxxxxxx'
};

const userPool = new CognitoUserPool(POOL_DATA);
const cognitoUser = userPool.getCurrentUser();
cognitoUser.getSession((err, session) => {
  const token = session.getIdToken().getJwtToken();
});
```

**Critical Learnings:**
- `GenerateSecret: false` required for frontend apps
- JWT tokens auto-validated by API Gateway
- User ID in `claims.sub` field

### 2.5 AWS SAM Template Structure

**Key Sections:**

```yaml
Globals:
  Function:
    Runtime: nodejs18.x
    Environment:
      Variables:
        PRODUCTS_TABLE: !Ref ProductsTable

Resources:
  ProductsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/functions/products/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ProductsTable
      Events:
        GetProducts:
          Type: HttpApi
          Properties:
            Path: /products
            Method: GET
```

**Critical Learnings:**
- `!Ref` references other resources
- `!Sub` allows string interpolation
- Policies auto-attached to Lambda execution role
- Events auto-create API Gateway routes

### 2.6 AWS S3 + CloudFront

**S3 Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::bucket-name/*"
  }]
}
```

**CloudFront Configuration:**
- Origin: S3 website endpoint (not bucket endpoint)
- Viewer Protocol: Redirect HTTP to HTTPS
- Custom Error Responses: 403/404 → /index.html → 200
- Deployment: 10-15 minutes

**Critical Learnings:**
- S3 website URLs are HTTP-only (won't work on mobile)
- CloudFront provides free SSL certificate
- Custom error responses essential for SPA routing

---

## 3. Blockers and Solutions

### Blocker 1: "Failed to load orders" - 500 Error

**Problem:** Lambda throwing errors when user ID couldn't be extracted

**Solution:**
```javascript
// BEFORE (WRONG):
function getUserId(event) {
  if (!auth.claims.sub) {
    throw new Error('User not authenticated'); // ❌
  }
}

// AFTER (CORRECT):
function getUserId(event) {
  return auth.claims?.sub || null; // ✅
}

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) {
    return createResponse(401, { error: 'Unauthorized' });
  }
};
```

**Learning:** Return `null` from helpers, handle errors at handler level.

### Blocker 2: "Failed to add products" - 500 Errors

**Problem:** Missing error handling for env vars, JSON parsing, DynamoDB errors

**Solution:**
```javascript
if (!PRODUCTS_TABLE) {
  return createResponse(500, { error: 'PRODUCTS_TABLE not set' });
}

let body;
try {
  body = JSON.parse(event.body || '{}');
} catch (parseError) {
  return createResponse(400, { error: 'Invalid JSON' });
}

try {
  await dynamodb.put(params).promise();
} catch (dbError) {
  console.error('DynamoDB error:', dbError);
  return createResponse(500, { error: dbError.message });
}
```

**Learning:** Add defensive checks and extensive logging.

### Blocker 3: IAM Permission Errors

**Problem:** `dynamodb:UpdateItem` and `dynamodb:DeleteItem` errors during checkout

**Solution:**
```yaml
OrdersFunction:
  Policies:
    - DynamoDBCrudPolicy:  # Full CRUD
        TableName: !Ref CartTable
    - DynamoDBWritePolicy:  # Added for stock updates
        TableName: !Ref ProductsTable
```

**Learning:** Functions needing cross-table operations require multiple policies.

### Blocker 4: PowerShell Script Errors

**Problem:** JSON encoding issues (BOM characters), AWS CLI RemoteException

**Solution:**
```powershell
# BEFORE:
$json | Set-Content -Encoding UTF8

# AFTER:
$json | Out-File -Encoding ascii -NoNewline

# AWS CLI:
try {
  $result = & aws s3api put-bucket-policy ... 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { Write-Host "Error" }
} catch { Write-Host "Exception: $_" }
```

**Learning:** Use `Out-File -Encoding ascii` for JSON, handle exit codes explicitly.

### Blocker 5: Mobile Access - 403 Forbidden

**Problem:** S3 HTTP-only URLs don't work on mobile (HTTPS required)

**Solution:**
1. Fix S3 bucket policy (remove public access block)
2. Create CloudFront distribution with HTTPS
3. Configure custom error responses for SPA routing
4. Wait 10-15 minutes for deployment

**Learning:** CloudFront is essential for mobile/public access.

---

## 4. Mistakes and Fixes

### Mistake 1: Using `.js` Instead of `.jsx`
**Fix:** Renamed all React components to `.jsx`

### Mistake 2: Missing Error Handling
**Fix:** Added specific error messages based on error type (network, server, auth)

### Mistake 3: Hardcoded Image URLs
**Fix:** Added size parameters: `?w=500&h=500&fit=crop`

### Mistake 4: Not Handling JSON Parsing
**Fix:** Wrapped `JSON.parse()` in try-catch with specific error messages

### Mistake 5: Incorrect IAM Policy
**Fix:** Changed `DynamoDBReadPolicy` to `DynamoDBCrudPolicy` for DeleteItem operations

---

## 5. Deployment Journey

### Phase 1: Backend
1. Create SAM template (`ecommerce-template.yaml`)
2. Write Lambda functions (Products, Cart, Orders)
3. Deploy: `sam build && sam deploy --guided`
4. Capture outputs (API URL, Cognito IDs)

### Phase 2: Frontend
1. Create React app with hardcoded API URLs
2. Integrate Cognito authentication
3. Build: `npm run build`

### Phase 3: S3 Deployment
1. Create bucket: `aws s3 mb s3://bucket-name`
2. Enable website hosting
3. Remove public access block
4. Apply bucket policy
5. Upload: `aws s3 sync build/ s3://bucket-name`

### Phase 4: CloudFront
1. Create distribution with S3 website endpoint as origin
2. Configure HTTPS redirect
3. Add custom error responses (403/404 → index.html)
4. Wait 10-15 minutes for deployment

---

## 6. Key Learnings

### Lambda Functions
- Validate all inputs (env vars, JSON parsing)
- Handle authentication gracefully (return null, check at handler)
- Log extensively (CloudWatch Logs)
- Return consistent responses with proper HTTP codes

### DynamoDB
- Use composite keys for user-scoped data
- Create GSI for query patterns
- Use `PAY_PER_REQUEST` for development

### API Gateway
- Configure CORS at API Gateway level
- JWT claims auto-injected into event
- Public endpoints don't need Auth property

### Frontend
- Hardcode values in production (no .env files)
- Use Axios interceptors for token injection
- Handle 401 errors (redirect to login)

### Deployment
- Always use CloudFront for production (HTTPS requirement)
- Configure custom error responses for SPA routing
- Use `Out-File -Encoding ascii` for JSON files in PowerShell

---

## 7. Quick Reference

### SAM Commands
```bash
sam build
sam deploy --guided
sam logs -n ProductsFunction
```

### S3 Commands
```powershell
aws s3 mb s3://bucket-name
aws s3 website s3://bucket-name --index-document index.html
aws s3 sync build/ s3://bucket-name --delete
```

### CloudFront
```powershell
aws cloudfront create-distribution --distribution-config file://config.json
aws cloudfront get-distribution --id DIST_ID --query 'Distribution.Status'
```

---

## 8. Troubleshooting

**Lambda 500 Error:**
- Check CloudWatch Logs
- Verify environment variables
- Check IAM permissions
- Handle JSON parsing

**API Gateway 401:**
- Verify JWT token in Authorization header
- Check token expiration
- Verify Cognito User Pool ID matches

**CORS Errors:**
- Configure CORS in API Gateway
- Include Authorization in allowed headers

**CloudFront 403/404:**
- Check S3 bucket policy
- Remove public access block
- Verify custom error responses
- Wait for deployment completion

---

## 9. Conclusion

This project demonstrates a complete serverless e-commerce platform. Key takeaways:

1. **Infrastructure as Code:** SAM templates make deployment repeatable
2. **Serverless Architecture:** Lambda + DynamoDB + API Gateway = scalable, cost-effective
3. **Security:** Cognito handles auth, API Gateway validates JWT
4. **Deployment:** S3 + CloudFront provides reliable HTTPS hosting
5. **Error Handling:** Comprehensive error handling improves UX
6. **Mobile Access:** CloudFront essential for HTTPS requirement

Understanding these patterns will help you build similar applications more efficiently.

---

## 10. Next Steps for Similar Projects

1. Start with SAM template (define infrastructure first)
2. Implement Lambda functions (one per resource)
3. Test locally with `sam local`
4. Deploy backend with `sam deploy`
5. Build frontend with hardcoded API URLs
6. Deploy to S3, create CloudFront distribution
7. Test end-to-end
8. Monitor with CloudWatch Logs

**Remember:** Always handle errors gracefully, log extensively, and test on mobile devices before considering deployment complete.
