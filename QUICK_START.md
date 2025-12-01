# Quick Start Guide - Smart Vehicle Maintenance System

This guide will help you deploy and run your Smart Vehicle Maintenance application quickly.

## Prerequisites

Before starting, ensure you have:
-  Node.js 18+ installed ([Download](https://nodejs.org/))
-  AWS CLI installed ([Download](https://aws.amazon.com/cli/))
-  AWS SAM CLI installed ([Download](https://aws.amazon.com/serverless/sam/))
-  AWS Account with credentials (Access Key ID and Secret Access Key)

---

## Step 1: Set Up AWS Credentials

### Option A: Interactive Setup (Recommended)
Run the credential setup script:
```powershell
.\setup-aws-credentials.ps1
```

This will:
- Prompt you for your AWS credentials
- Validate them
- Set them for your current PowerShell session

### Option B: Using AWS CLI Configure
```powershell
aws configure
```
Enter your credentials when prompted.

### For AWS Academy / Learner Lab Users:
1. Go to AWS Academy  Learner Lab
2. Click **AWS Details**
3. Click **Show** next to AWS CLI credentials
4. Copy the credentials
5. Run `setup-aws-credentials.ps1` and paste when prompted

**Important:** AWS Academy credentials expire after a few hours. You'll need to refresh them.

---

## Step 2: Deploy Backend to AWS

### Build the application:
```powershell
sam build
```
This takes 1-2 minutes. Wait for "Build Succeeded!" message.

### Deploy to AWS:
```powershell
sam deploy --guided
```

Answer the prompts:
| Question | Answer |
|----------|--------|
| Stack Name | Press **Enter** (default: smart-vehicle-maintenance) |
| AWS Region | Press **Enter** (default: us-west-2) |
| Confirm changes | Type **Y** |
| Allow SAM CLI IAM role creation | Type **Y**  **IMPORTANT!** |
| Disable rollback | Type **N** |
| Save arguments | Type **Y** |

**Wait 5-10 minutes** for deployment. Don't close the window!

### Save the Output Values:
At the end, you'll see:
```
Outputs
-----------------------------------
ApiUrl = https://abc123.execute-api.us-west-2.amazonaws.com
UserPoolId = us-west-2_ABC123XYZ
UserPoolClientId = 1234567890abcdef
Region = us-west-2
```

 **COPY THESE VALUES IMMEDIATELY!** You'll need them for Step 3.

---

## Step 3: Configure Frontend

### Navigate to frontend folder:
```powershell
cd frontend
```

### Copy the example environment file:
```powershell
copy .env.example .env
```

### Edit the .env file:
Open `.env` in Notepad or any text editor:
```powershell
notepad .env
```

Replace the placeholder values with YOUR values from Step 2:
```env
REACT_APP_API_URL=https://your-actual-api-url.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_YourActualPoolId
REACT_APP_COGNITO_CLIENT_ID=YourActualClientId
REACT_APP_REGION=us-west-2
```

 **Important:**
- NO quotes around values
- NO spaces around = sign
- NO trailing slashes in URLs

Save and close the file.

---

## Step 4: Install Dependencies & Run

### Install frontend dependencies:
```powershell
npm install
```
This takes 1-2 minutes.

### Start the application:
```powershell
npm start
```

Your browser should automatically open to `http://localhost:3000`

---

## Step 5: Use the Application

1. **Sign Up:**
   - Click "Sign Up"
   - Enter your email and password (min 8 chars with uppercase, lowercase, number, symbol)
   - Check your email for verification code
   - Enter the code to verify

2. **Sign In:**
   - Use your email and password to log in

3. **Add a Vehicle:**
   - Click "Add Vehicle"
   - Fill in make, model, year, VIN, and current mileage

4. **Add Service Records:**
   - Click on a vehicle
   - Click "Add Service Record"
   - Fill in service details

5. **View Predictions:**
   - Click on a vehicle
   - Switch to "Upcoming Services" tab
   - See predicted maintenance dates based on your service history

---

## Common Issues & Solutions

### Issue: "Access Denied" during deployment
**Solution:** Your credentials expired. Run `.\setup-aws-credentials.ps1` again.

### Issue: "API URL not found" in frontend
**Solution:** 
1. Check your `.env` file
2. Make sure you copied the ApiUrl correctly
3. Remove any trailing slashes from the URL

### Issue: "User Pool not found"
**Solution:**
1. Check your `.env` file
2. Make sure UserPoolId format is: `us-west-2_ABC123XYZ`
3. Make sure you copied the full ID

### Issue: Frontend won't start
**Solution:**
1. Make sure you're in the `frontend` folder
2. Run `npm install` first
3. Check that `.env` file exists

### Issue: CORS errors in browser
**Solution:**
1. Make sure your backend is deployed successfully
2. Check that API URL in `.env` is correct
3. Try redeploying: `sam deploy` (without --guided)

---

## Stopping the Application

### Stop Frontend:
Press `Ctrl+C` in the terminal where `npm start` is running.

### Clean Up AWS Resources (Optional):
To delete all AWS resources and avoid charges:
```powershell
aws cloudformation delete-stack --stack-name smart-vehicle-maintenance
```

 **Warning:** This will delete ALL your data!

---

## Need More Help?

- See `README.txt` for detailed setup instructions
- See `GET_ENV_VARIABLES.md` for AWS Console screenshots and troubleshooting
- Check AWS CloudFormation console to see deployment status

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Set up credentials | `.\setup-aws-credentials.ps1` |
| Build application | `sam build` |
| Deploy to AWS | `sam deploy --guided` |
| Redeploy (after changes) | `sam build` then `sam deploy` |
| Start frontend | `cd frontend` then `npm start` |
| Install dependencies | `npm install` |
| Check AWS credentials | `aws sts get-caller-identity` |
| View deployment outputs | `aws cloudformation describe-stacks --stack-name smart-vehicle-maintenance --query 'Stacks[0].Outputs'` |

---

**You're all set! **

If you followed all steps, your Smart Vehicle Maintenance system is now running!
