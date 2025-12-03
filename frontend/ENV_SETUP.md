# Frontend Environment Variables Setup

## Step 1: Create .env file

After deploying the backend with `sam deploy`, copy this template to create your `.env` file:

```powershell
cd frontend
copy env.template .env
```

## Step 2: Update .env with your deployment outputs

Edit the `.env` file and replace the placeholder values with the actual values from your SAM deployment outputs:

```
REACT_APP_API_URL=https://YOUR-API.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_xxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
REACT_APP_REGION=us-west-2
```

### How to get the values:

After running `sam deploy`, you'll see outputs like:

```
Outputs:
  ApiUrl: https://abc123xyz.execute-api.us-west-2.amazonaws.com
  UserPoolId: us-west-2_ABC123XYZ
  UserPoolClientId: 1a2b3c4d5e6f7g8h9i0j
  Region: us-west-2
```

Copy these values into your `.env` file:

```
REACT_APP_API_URL=https://abc123xyz.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_ABC123XYZ
REACT_APP_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
REACT_APP_REGION=us-west-2
```

## Important Notes:

- **NO QUOTES** around the values
- **NO TRAILING SLASHES** in the API URL
- The `.env` file is gitignored (won't be committed to git)
- Restart the React dev server after changing `.env`

## Quick Setup Command:

```powershell
# After deployment, get outputs and create .env
cd frontend
copy env.template .env
notepad .env
# Edit with your actual values, then save
```

