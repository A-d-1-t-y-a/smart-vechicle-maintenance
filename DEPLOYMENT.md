# Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites Check

```powershell
# Verify AWS CLI
aws --version

# Verify SAM CLI
sam --version

# Verify credentials
aws sts get-caller-identity
```

### 2. Build

```powershell
sam build
```

This will:
- Install Node.js dependencies for Lambda functions
- Package the application

### 3. Deploy (First Time)

```powershell
sam deploy --guided
```

**Answer the prompts:**
- Stack Name: `smart-vehicle-maintenance` (or press Enter)
- AWS Region: `us-west-2` (or press Enter)  
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback on CloudFormation errors: `N` (recommended)
- Function has no authentication: Answer `y` for each function (or avoid by setting Auth in template)
- Save arguments to configuration file: `Y`

### 4. Subsequent Deployments

After first deployment, you can use:

```powershell
sam deploy
```

### 5. Get Outputs

After deployment, get the outputs:

```powershell
aws cloudformation describe-stacks --stack-name smart-vehicle-maintenance --region us-west-2 --query "Stacks[0].Outputs" --output table
```

Or check the SAM output for:
- `ApiUrl`
- `UserPoolId`
- `UserPoolClientId`
- `Region`

### 6. Update Frontend .env

Copy the outputs to `frontend/.env`:

```
REACT_APP_API_URL=<ApiUrl from output>
REACT_APP_COGNITO_USER_POOL_ID=<UserPoolId from output>
REACT_APP_COGNITO_CLIENT_ID=<UserPoolClientId from output>
REACT_APP_REGION=<Region from output>
```

### 7. Run Frontend

```powershell
cd frontend
npm install
npm start
```

## Updating the Stack

### Update Lambda Functions

```powershell
sam build
sam deploy
```

### Update Only Frontend

```powershell
cd frontend
npm run build
# Then deploy to S3 or your hosting service
```

## Troubleshooting Deployment

### Build Errors

- Ensure Node.js 18+ is installed
- Check that `src/handlers/package.json` exists
- Run `npm install` in `src/handlers/` if needed

### Deploy Errors

- Check CloudFormation stack events for specific errors
- Verify IAM permissions
- Ensure region is correct (`us-west-2`)
- Check if resources already exist (may need to delete stack first)

### Delete Stack

If you need to start over:

```powershell
aws cloudformation delete-stack --stack-name smart-vehicle-maintenance --region us-west-2
```

Wait for deletion to complete before redeploying.

## Environment-Specific Deployments

For different environments (dev, staging, prod), use different stack names:

```powershell
sam deploy --stack-name smart-vehicle-maintenance-dev --guided
sam deploy --stack-name smart-vehicle-maintenance-staging --guided
sam deploy --stack-name smart-vehicle-maintenance-prod --guided
```

Update the stack name in `samconfig.toml` accordingly.

