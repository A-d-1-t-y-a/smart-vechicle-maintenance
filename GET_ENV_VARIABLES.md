# How to Get Environment Variables - Complete Beginner's Guide

This guide assumes you have **zero AWS knowledge**. Follow each step carefully.

## What Are Environment Variables?

Environment variables are settings your frontend application needs to connect to your AWS backend. Think of them as addresses and passwords that tell your app where to find things in AWS.

You need **4 values**:
1. **API URL** - The address of your backend API
2. **User Pool ID** - The ID of your user authentication system
3. **Client ID** - The ID of your app within the authentication system
4. **Region** - The AWS region where everything is located (us-west-2)

---

## Method 1: Get Values from Deployment Output (EASIEST - Do This First!)

### Step 1: Deploy Your Application

If you haven't deployed yet, do this first:

1. Open PowerShell in your project folder
2. Run these commands one by one:

```powershell
# Set up your AWS credentials
.\setup-aws-credentials.ps1

# Build the application
sam build

# Deploy to AWS (this takes 5-10 minutes)
sam deploy --guided
```

3. When `sam deploy --guided` asks questions, answer:
   - **Stack name**: Press Enter (uses default: smart-vehicle-maintenance)
   - **Region**: Press Enter (uses default: us-west-2)
   - **Parameter ProjectName**: Press Enter (uses default)
   - **Confirm changes**: Type `Y` and press Enter
   - **Allow SAM CLI IAM role creation**: Type `Y` and press Enter ⚠️ **IMPORTANT!**
   - **Disable rollback**: Type `N` and press Enter
   - **Save arguments**: Type `Y` and press Enter

4. **Wait 5-10 minutes** - The deployment is creating everything in AWS

### Step 2: Find the Output Section

At the very end of the deployment, you'll see something like this:

```
---------------------------------------------------------------------------------------------------
Outputs
---------------------------------------------------------------------------------------------------
Key                 ApiUrl
Description         API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-west-2.amazonaws.com

Key                 UserPoolId
Description         Cognito User Pool ID
Value               us-west-2_ABC123XYZ

Key                 UserPoolClientId
Description         Cognito User Pool Client ID
Value               1234567890abcdefghijklmn

Key                 Region
Description         AWS Region
Value               us-west-2
---------------------------------------------------------------------------------------------------
```

### Step 3: Copy These Values

**📝 COPY THESE VALUES RIGHT NOW!** Write them down or copy to a text file:

- **ApiUrl**: `https://abc123xyz.execute-api.us-west-2.amazonaws.com`
- **UserPoolId**: `us-west-2_ABC123XYZ`
- **UserPoolClientId**: `1234567890abcdefghijklmn`
- **Region**: `us-west-2`

**⚠️ IMPORTANT:** Your actual values will be different! Copy YOUR values, not the example ones above.

---

## Method 2: Get Values from AWS Console (If You Missed the Output)

If you closed the terminal or lost the output, you can get the values from AWS Console (the web interface).

### First: Log Into AWS Console

1. Open your web browser
2. Go to: https://console.aws.amazon.com
3. Sign in with your AWS account
4. Make sure you're in the **us-west-2** region (check top-right corner)

---

### Getting API URL (API Gateway)

**What is this?** This is the web address where your backend API lives. Your frontend will send requests here.

**Steps:**

1. In AWS Console, look at the top search bar (it says "Search for services, resources, and docs")
2. Type: `API Gateway`
3. Click on **"API Gateway"** from the search results

4. You'll see a list of APIs. Look for one named something like:
   - `smart-vehicle-maintenance-*` 
   - Or `ServerlessHttpApi-*`
   - Or just click on the first API in the list

5. Once you click on the API, you'll see the API details page

6. Look for a section called **"Invoke URL"** or **"API endpoint"**
   - It will look like: `https://abc123xyz.execute-api.us-west-2.amazonaws.com`
   - This is your **API URL** - copy it!

7. **If you don't see it:**
   - Look for a tab called "Stages" or "Default stage"
   - Click on it
   - You'll see the "Invoke URL" there

**✅ You now have: REACT_APP_API_URL**

---

### Getting User Pool ID (Cognito)

**What is this?** This identifies your user authentication system. It's like the name of your user database.

**Steps:**

1. In AWS Console search bar, type: `Cognito`
2. Click on **"Amazon Cognito"** from the results

3. You'll see a page with tabs at the top. Click on **"User pools"** (not "Identity pools")

4. You'll see a list of User Pools. Look for one named:
   - `smart-vehicle-maintenance-users`
   - Or something similar

5. **Click on the User Pool name** (not the checkbox, click the actual name)

6. At the top of the page, you'll see the User Pool details. Look for:
   - **"User pool ID"** or just a big ID at the top
   - It will look like: `us-west-2_ABC123XYZ`
   - This is your **User Pool ID** - copy it!

**✅ You now have: REACT_APP_COGNITO_USER_POOL_ID**

---

### Getting Client ID (Cognito App Client)

**What is this?** This is the ID of your application within the User Pool. Think of it as a key that lets your app use the authentication system.

**Steps:**

1. You should still be on the Cognito User Pool page (from previous step)
   - If not, go back: AWS Console → Cognito → User pools → Click your User Pool

2. Look at the left sidebar menu. Find and click on **"App integration"**
   - It might be under a section called "App integration and federation"

3. Scroll down to find a section called **"App clients and analytics"**

4. Under "App clients", you'll see a list. Click on the app client name
   - It might be named: `smart-vehicle-maintenance-client`
   - Or just click the first one in the list

5. You'll see the App Client details. Look for:
   - **"Client ID"** 
   - It will be a long string of letters and numbers like: `1234567890abcdefghijklmn`
   - This is your **Client ID** - copy it!

**✅ You now have: REACT_APP_COGNITO_CLIENT_ID**

---

### Getting Region

**What is this?** This is the AWS data center location where your resources are stored.

**Steps:**

1. Look at the **top-right corner** of AWS Console
2. You'll see the region name, like: `us-west-2` or `Oregon`
3. If it says a city name (like "Oregon"), click on it to see the code
4. The code should be: `us-west-2`
5. This is your **Region** - copy it!

**✅ You now have: REACT_APP_REGION**

---

## Step 3: Create Your .env File

Now that you have all 4 values, let's put them in a file.

### Step 3.1: Navigate to Frontend Folder

1. Open PowerShell
2. Make sure you're in your project folder: `D:\projects\smart-vechicle-maintenance`
3. Go to the frontend folder:
   ```powershell
   cd frontend
   ```

### Step 3.2: Copy the Example File

```powershell
copy .env.example .env
```

This creates a new file called `.env` from the example.

### Step 3.3: Open the .env File

You can open it with:
- **Notepad**: Right-click `.env` → Open with → Notepad
- **VS Code**: `code .env` (if you have VS Code)
- **Any text editor**

### Step 3.4: Replace the Placeholder Values

You'll see something like this:

```env
REACT_APP_API_URL=https://your-api-id.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
REACT_APP_COGNITO_CLIENT_ID=XXXXXXXXXXXXXX
REACT_APP_REGION=us-west-2
```

**Replace each line with YOUR actual values:**

```env
REACT_APP_API_URL=https://abc123xyz.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_ABC123XYZ
REACT_APP_COGNITO_CLIENT_ID=1234567890abcdefghijklmn
REACT_APP_REGION=us-west-2
```

**⚠️ IMPORTANT RULES:**
- ✅ No quotes around the values
- ✅ No spaces around the `=` sign
- ✅ No trailing slashes (no `/` at the end of URLs)
- ✅ Copy the values exactly as they appear

### Step 3.5: Save the File

Press `Ctrl + S` to save, or File → Save

---

## Step 4: Verify Your Configuration

### Step 4.1: Install Dependencies (If Not Done)

In PowerShell (still in the `frontend` folder):

```powershell
npm install
```

Wait for it to finish (takes 1-2 minutes).

### Step 4.2: Start the Application

```powershell
npm start
```

This will:
- Start the React development server
- Open your browser to `http://localhost:3000`
- Show your application

### Step 4.3: Test It Works

1. You should see the login page
2. Try clicking "Sign Up"
3. If the page loads without errors, your configuration is correct! ✅
4. If you see errors, check the troubleshooting section below

---

## Troubleshooting - Common Problems

### Problem: "API URL not found" or "Network Error"

**What it means:** Your frontend can't reach your backend API.

**How to fix:**
1. ✅ Check your `.env` file - is `REACT_APP_API_URL` correct?
2. ✅ Make sure there's NO trailing slash: `https://...amazonaws.com` (not `...amazonaws.com/`)
3. ✅ Go to AWS Console → API Gateway → Check if your API exists
4. ✅ Make sure the region matches (should be `us-west-2`)

### Problem: "User Pool not found" or "Invalid User Pool"

**What it means:** Your frontend can't find your authentication system.

**How to fix:**
1. ✅ Check your `.env` file - is `REACT_APP_COGNITO_USER_POOL_ID` correct?
2. ✅ Format should be: `us-west-2_ABC123XYZ` (region_underscore_id)
3. ✅ Go to AWS Console → Cognito → User pools → Verify it exists
4. ✅ Make sure you copied the FULL ID, not just part of it

### Problem: "Invalid Client ID" or "Client not found"

**What it means:** Your app client ID is wrong.

**How to fix:**
1. ✅ Check your `.env` file - is `REACT_APP_COGNITO_CLIENT_ID` correct?
2. ✅ Make sure there are NO spaces in the Client ID
3. ✅ Go to AWS Console → Cognito → Your User Pool → App integration → App clients
4. ✅ Copy the Client ID again (it's a long string, make sure you got it all)

### Problem: "CORS Error" in Browser Console

**What it means:** The API is blocking requests from your frontend.

**How to fix:**
1. ✅ This is usually an AWS configuration issue
2. ✅ Check that your API Gateway has CORS enabled
3. ✅ Verify your API URL is correct
4. ✅ Try redeploying: `sam deploy` (without --guided)

### Problem: Frontend Won't Start

**What it means:** There's an error in your configuration or setup.

**How to fix:**
1. ✅ Make sure you're in the `frontend` folder: `cd frontend`
2. ✅ Run `npm install` first
3. ✅ Check Node.js version: `node --version` (needs 18 or higher)
4. ✅ Verify `.env` file exists: `dir .env` (should show the file)
5. ✅ Check `.env` file has no syntax errors (no extra quotes, spaces, etc.)

### Problem: "Cannot find module" Errors

**What it means:** Dependencies aren't installed.

**How to fix:**
```powershell
cd frontend
npm install
```

### Problem: Values Look Wrong

**Double-check your values:**

1. **API URL** should:
   - Start with `https://`
   - Contain `execute-api`
   - End with `.amazonaws.com`
   - Example: `https://abc123.execute-api.us-west-2.amazonaws.com`

2. **User Pool ID** should:
   - Start with region code (like `us-west-2_`)
   - Have an underscore `_`
   - Have letters/numbers after underscore
   - Example: `us-west-2_ABC123XYZ`

3. **Client ID** should:
   - Be a long string of letters and numbers
   - No spaces, no dashes
   - Example: `1234567890abcdefghijklmn`

4. **Region** should be:
   - `us-west-2` (for your setup)

---

## Example of Correct .env File

Here's what a **correct** `.env` file looks like (with example values):

```env
REACT_APP_API_URL=https://abc123xyz.execute-api.us-west-2.amazonaws.com
REACT_APP_COGNITO_USER_POOL_ID=us-west-2_ABC123XYZ
REACT_APP_COGNITO_CLIENT_ID=1234567890abcdefghijklmn
REACT_APP_REGION=us-west-2
```

**Notice:**
- ✅ No quotes
- ✅ No spaces around `=`
- ✅ No trailing slashes
- ✅ All values are on separate lines
- ✅ No blank lines between values

---

## Still Having Problems?

1. **Check your deployment worked:**
   - Go to AWS Console → CloudFormation
   - Look for stack named `smart-vehicle-maintenance`
   - Status should be "CREATE_COMPLETE" (green)

2. **Check AWS resources exist:**
   - API Gateway: Should see your API
   - Cognito: Should see your User Pool
   - Lambda: Should see 4 functions

3. **Verify credentials are still valid:**
   ```powershell
   aws sts get-caller-identity
   ```
   If this fails, your credentials expired. Run `.\setup-aws-credentials.ps1` again.

4. **Check browser console:**
   - Press F12 in your browser
   - Look at the "Console" tab
   - Read any error messages - they often tell you what's wrong

---

## Quick Checklist

Before asking for help, make sure:

- [ ] Deployment completed successfully (no errors)
- [ ] All 4 values copied correctly
- [ ] `.env` file created in `frontend` folder
- [ ] All placeholder values replaced with real values
- [ ] No quotes, no spaces, no trailing slashes
- [ ] `npm install` completed successfully
- [ ] Region is `us-west-2`
- [ ] AWS credentials are still valid

---

**You're done!** Your frontend should now connect to your AWS backend. 🎉
