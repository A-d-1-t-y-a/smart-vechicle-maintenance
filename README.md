# Retail Supermarket Chains - Complete Deployment Guide

## Overview

This is a complete serverless retail supermarket application built with:
- **Backend**: AWS Lambda, DynamoDB, API Gateway, Cognito
- **Frontend**: React 18
- **Deployment**: S3 + CloudFront

## Prerequisites

1. **AWS Account** with credentials
2. **AWS CLI** installed and configured
3. **SAM CLI** installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
4. **Node.js** and npm installed
5. **PowerShell** (for Windows)

## Quick Start

### Step 1: Setup AWS Credentials

```powershell
.\setup-credentials.ps1 -AccessKey YOUR_ACCESS_KEY -SecretKey YOUR_SECRET_KEY
```

### Step 2: Deploy Backend

```powershell
.\deploy-backend.ps1
```

This will:
- Build SAM application
- Deploy Lambda functions, DynamoDB tables, API Gateway, Cognito
- Output API URL, User Pool ID, and Client ID

**Save the outputs** - you'll need them for frontend deployment.

### Step 3: Deploy Frontend

```powershell
.\deploy-frontend.ps1
```

This will:
- Create .env file with backend configuration
- Install npm dependencies
- Build React app
- Create S3 bucket
- Upload build files
- Configure static website hosting

### Step 4: Setup CloudFront (for HTTPS/Mobile Access)

```powershell
.\setup-cloudfront.ps1
```

This will:
- Create CloudFront distribution
- Enable HTTPS access
- Configure custom error responses for SPA routing
- Takes 10-15 minutes to deploy

## Project Structure

```
.
├── backend/
│   └── functions/
│       ├── products/      # Product management
│       ├── categories/    # Category management
│       ├── inventory/     # Inventory management
│       └── orders/       # Order processing
├── frontend-supermarket/  # React application
├── retail-supermarket-template.yaml  # SAM template
├── setup-credentials.ps1   # AWS credentials setup
├── deploy-backend.ps1     # Backend deployment
├── deploy-frontend.ps1    # Frontend deployment
└── setup-cloudfront.ps1   # CloudFront setup
```

## Features

### Backend
- **Products**: CRUD operations for supermarket products
- **Categories**: Product categorization
- **Inventory**: Multi-location inventory management
- **Orders**: Order processing with inventory updates

### Frontend
- **Home**: Featured products and categories
- **Products**: Browse all products with category filtering
- **Product Detail**: View product details and add to cart
- **Cart**: Shopping cart management
- **Checkout**: Order placement
- **Orders**: View order history
- **Authentication**: Sign up, login, logout

## API Endpoints

### Products
- `GET /products` - Get all products
- `GET /products/{productId}` - Get product details
- `GET /products/category/{categoryId}` - Get products by category
- `POST /products` - Create product (authenticated)
- `PUT /products/{productId}` - Update product (authenticated)
- `DELETE /products/{productId}` - Delete product (authenticated)

### Categories
- `GET /categories` - Get all categories
- `GET /categories/{categoryId}` - Get category details
- `POST /categories` - Create category (authenticated)

### Inventory
- `GET /inventory` - Get all inventory
- `GET /inventory/product/{productId}` - Get inventory for product
- `PUT /inventory/{productId}` - Update inventory (authenticated)

### Orders
- `GET /orders` - Get user orders (authenticated)
- `GET /orders/{orderId}` - Get order details (authenticated)
- `POST /orders` - Create order (authenticated)

## Environment Variables

Frontend requires these environment variables (auto-generated during deployment):
- `REACT_APP_API_URL` - API Gateway URL
- `REACT_APP_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `REACT_APP_COGNITO_CLIENT_ID` - Cognito Client ID
- `REACT_APP_REGION` - AWS Region

## Troubleshooting

### Build Fails
- Check Node.js version (should be 14+)
- Delete `node_modules` and `package-lock.json`, then `npm install` again
- Check for syntax errors in React components

### Deployment Fails
- Verify AWS credentials are set correctly
- Check AWS CLI and SAM CLI are installed
- Ensure you have proper IAM permissions

### CloudFront Not Working
- Wait 10-15 minutes for deployment
- Check distribution status: `aws cloudfront get-distribution --id DIST_ID`
- Verify S3 bucket policy allows public read access

## Support

For issues or questions, check:
- AWS CloudWatch Logs for Lambda errors
- Browser console for frontend errors
- AWS Console for resource status

## License

This project is for educational purposes.
