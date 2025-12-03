# Quick Start Guide

## 1. Setup AWS Credentials (5 minutes)

```powershell
# Option 1: Use the setup script
.\setup-aws-credentials.ps1

# Option 2: Manual AWS CLI
aws configure

# Verify
aws sts get-caller-identity
```

## 2. Deploy Backend (10 minutes)

```powershell
# Build
sam build

# Deploy (first time)
sam deploy --guided

# Answer prompts:
# - Stack name: ENTER (default: smart-vehicle-maintenance)
# - Region: us-west-2
# - Confirm changes: Y
# - Allow IAM creation: Y
# - Disable rollback: N
# - Save config: Y
```

**IMPORTANT**: Copy these outputs immediately:
- `ApiUrl`
- `UserPoolId`
- `UserPoolClientId`
- `Region`

## 3. Configure Frontend (2 minutes)

```powershell
cd frontend

# Create .env file
@"
REACT_APP_API_URL=<paste ApiUrl>
REACT_APP_COGNITO_USER_POOL_ID=<paste UserPoolId>
REACT_APP_COGNITO_CLIENT_ID=<paste UserPoolClientId>
REACT_APP_REGION=<paste Region>
"@ | Out-File -FilePath .env -Encoding utf8

# Or manually create .env with the values above (no quotes, no trailing slashes)
```

## 4. Run Frontend (2 minutes)

```powershell
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

## 5. First Use

1. Click "Sign Up"
2. Enter email, password (min 8 chars, uppercase, lowercase, number)
3. Check email for verification code
4. Enter code to confirm
5. Sign in
6. Add your first part!

## Common Commands

```powershell
# Rebuild and redeploy
sam build && sam deploy

# View stack outputs
aws cloudformation describe-stacks --stack-name smart-vehicle-maintenance --region us-west-2 --query "Stacks[0].Outputs" --output table

# Check Lambda functions
aws lambda list-functions --region us-west-2 --query "Functions[?starts_with(FunctionName, 'smart-vehicle-maintenance')].FunctionName"

# View DynamoDB tables
aws dynamodb list-tables --region us-west-2
```

## Troubleshooting

**"Failed to load parts"**
- Check `.env` file has correct values (no quotes)
- Sign out and sign in again
- Check browser console for errors

**"Unauthorized" errors**
- Verify Cognito IDs in `.env` match deployment outputs
- Clear browser cache and cookies
- Re-authenticate

**Deployment fails**
- Check `aws sts get-caller-identity` works
- Verify region is `us-west-2`
- Check CloudFormation stack events for specific errors

## Next Steps

- Add parts with reorder thresholds
- Update stock levels
- View reorder tasks
- Check analytics dashboard
- Subscribe to SNS topic for email alerts

