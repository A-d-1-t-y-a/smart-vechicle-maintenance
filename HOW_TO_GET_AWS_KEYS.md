# How to Get AWS Access Keys for Your Own AWS Account
# =====================================================

## Step 1: Sign in to AWS Console
1. Go to: https://console.aws.amazon.com/
2. Sign in with your AWS account email and password

## Step 2: Create Access Keys (IAM User Method - RECOMMENDED)

### Option A: Create IAM User with Access Keys (Best Practice)

1. In AWS Console, search for "IAM" in the top search bar
2. Click on "IAM" (Identity and Access Management)
3. Click "Users" in the left sidebar
4. Click "Create user" button

5. **Create User:**
   - User name: smart-vehicle-admin (or any name you want)
   - Click "Next"

6. **Set Permissions:**
   - Select "Attach policies directly"
   - Search and check these policies:
     * AmazonDynamoDBFullAccess
     * AWSLambda_FullAccess
     * AmazonAPIGatewayAdministrator
     * AmazonCognitoPowerUser
     * AmazonSNSFullAccess
     * IAMFullAccess
     * CloudFormationFullAccess
   - Click "Next"
   - Click "Create user"

7. **Create Access Key:**
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Scroll down to "Access keys" section
   - Click "Create access key"
   - Select "Command Line Interface (CLI)"
   - Check the confirmation box
   - Click "Next"
   - Add description (optional): "Smart Vehicle Maintenance App"
   - Click "Create access key"

8. **SAVE YOUR CREDENTIALS:**
   You will see:
   - Access key ID: AKIAXXXXXXXXXXXXXXXX (20 characters)
   - Secret access key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (40 characters)
   
   **IMPORTANT:** 
   - Copy both values NOW!
   - Click "Download .csv file" to save them
   - You won't be able to see the Secret Key again!

## Option B: Use Root Account Access Keys (NOT RECOMMENDED for production)

**WARNING:** This is less secure but works for learning/testing.

1. In AWS Console, click your account name (top right)
2. Click "Security credentials"
3. Scroll down to "Access keys" section
4. Click "Create access key"
5. Acknowledge the warning
6. Save both:
   - Access key ID (starts with AKIA)
   - Secret access key

## Step 3: Use Your Credentials

After getting your credentials, run:

```powershell
.\setup-aws-credentials.ps1
```

When prompted, enter:
- **AWS Access Key ID**: AKIAXXXXXXXXXXXXXXXX (your actual key)
- **AWS Secret Access Key**: (your actual secret - will be hidden)
- **Session Token**: Just press Enter (skip - not needed for permanent keys)
- **Region**: Press Enter (uses default us-west-2)

## What Each Credential Looks Like:

| Credential Type | Format | Example |
|----------------|---------|---------|
| Account ID | 12 digits | 495930420806 |
| Access Key ID | 20 chars, starts with AKIA | AKIAIOSFODNN7EXAMPLE |
| Secret Access Key | 40 chars | wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY |
| Session Token | Long string | Only for temporary credentials (AWS Academy) |

## Security Tips:

1. Never share your Secret Access Key
2. Never commit credentials to Git
3. Use IAM users instead of root account
4. Delete access keys when not needed
5. Enable MFA (Multi-Factor Authentication) on your account

## Troubleshooting:

**Problem:** Can't find IAM in AWS Console
**Solution:** Make sure you're signed in as root user or have IAM permissions

**Problem:** Don't see "Create access key" button
**Solution:** You might not have permission. Contact your AWS administrator

**Problem:** Lost Secret Access Key
**Solution:** You can't recover it. Delete the old key and create a new one

## Need Help?

See AWS Official Guide:
https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
