SMART VEHICLE MAINTENANCE - BEGINNER'S SETUP GUIDE
===================================================

IMPORTANT: This guide assumes you have ZERO AWS knowledge.
Follow each step carefully. If you get stuck, see GET_ENV_VARIABLES.md for detailed help.

WHAT YOU NEED FIRST:
-------------------
Before starting, make sure you have installed:
1. Node.js 18+ (download from nodejs.org - get the LTS version)
2. AWS CLI (download from aws.amazon.com/cli)
3. AWS SAM CLI (download from aws.amazon.com/serverless/sam)

If you haven't installed these, do that first!


STEP 1: SET UP YOUR AWS CREDENTIALS
------------------------------------
1. Open PowerShell in this folder (right-click → Open PowerShell here)
2. Run this command:
   .\setup-aws-credentials.ps1

This will set up your AWS credentials. You should see a message saying 
"✅ AWS credentials are valid!" if it worked.


STEP 2: BUILD YOUR APPLICATION
-------------------------------
In PowerShell, run:
   sam build

This prepares your code for deployment. Wait for it to finish (1-2 minutes).


STEP 3: DEPLOY TO AWS
---------------------
In PowerShell, run:
   sam deploy --guided

This will ask you several questions. Here's what to answer:

Question 1: "Stack Name"
  Answer: Press Enter (uses default: smart-vehicle-maintenance)

Question 2: "AWS Region"  
  Answer: Press Enter (uses default: us-west-2)

Question 3: "Parameter ProjectName"
  Answer: Press Enter (uses default)

Question 4: "Confirm changes before deploy"
  Answer: Type Y and press Enter

Question 5: "Allow SAM CLI IAM role creation"
  Answer: Type Y and press Enter ⚠️ THIS IS VERY IMPORTANT!

Question 6: "Disable rollback"
  Answer: Type N and press Enter

Question 7: "Save arguments to configuration file"
  Answer: Type Y and press Enter

NOW WAIT 5-10 MINUTES. The deployment is creating everything in AWS.
Don't close the window! You'll see progress messages.


STEP 4: GET YOUR ENVIRONMENT VARIABLES (VERY IMPORTANT!)
---------------------------------------------------------
At the end of deployment, you'll see a section called "Outputs" that looks like:

  Outputs:
    ApiUrl = https://abc123.execute-api.us-west-2.amazonaws.com
    UserPoolId = us-west-2_ABC123
    UserPoolClientId = 1234567890abcdef
    Region = us-west-2

📝 COPY THESE 4 VALUES RIGHT NOW! Write them down or save to a text file.

⚠️ YOUR VALUES WILL BE DIFFERENT - Copy YOUR actual values, not the examples above!

If you missed this output, see GET_ENV_VARIABLES.md for how to get them from AWS Console.


STEP 5: CONFIGURE YOUR FRONTEND
---------------------------------
1. Go to the frontend folder:
   cd frontend

2. Copy the example environment file:
   copy .env.example .env

3. Open the .env file in Notepad (or any text editor):
   - Right-click .env → Open with → Notepad

4. You'll see 4 lines with placeholder values. Replace each with YOUR values:

   Line 1: REACT_APP_API_URL=...
      Replace with: REACT_APP_API_URL=https://YOUR-API-URL-HERE
      (Use the ApiUrl value from Step 4)

   Line 2: REACT_APP_COGNITO_USER_POOL_ID=...
      Replace with: REACT_APP_COGNITO_USER_POOL_ID=YOUR-USER-POOL-ID-HERE
      (Use the UserPoolId value from Step 4)

   Line 3: REACT_APP_COGNITO_CLIENT_ID=...
      Replace with: REACT_APP_COGNITO_CLIENT_ID=YOUR-CLIENT-ID-HERE
      (Use the UserPoolClientId value from Step 4)

   Line 4: REACT_APP_REGION=...
      Should already say: REACT_APP_REGION=us-west-2
      (If not, change it to us-west-2)

5. Save the file (Ctrl+S)

IMPORTANT RULES:
- No quotes around values
- No spaces around the = sign
- No trailing slashes in URLs


STEP 6: INSTALL DEPENDENCIES AND START
--------------------------------------
Still in the frontend folder, run:

1. Install dependencies (first time only):
   npm install
   Wait for it to finish (1-2 minutes)

2. Start the application:
   npm start

Your browser should automatically open to http://localhost:3000

If you see the login page, everything worked! ✅


STEP 7: USE YOUR APPLICATION
-----------------------------
1. Click "Sign Up" to create an account
2. Enter your email and password
3. Check your email for a verification code
4. Enter the code to verify your account
5. Sign in with your email and password
6. Add your first vehicle
7. Add service records
8. View service predictions


IF SOMETHING GOES WRONG:
-------------------------
Common problems and solutions:

Problem: "aws: command not found"
  Solution: AWS CLI is not installed. Install it first.

Problem: "sam: command not found"  
  Solution: AWS SAM CLI is not installed. Install it first.

Problem: "Access Denied" during deployment
  Solution: Your credentials expired. Run .\setup-aws-credentials.ps1 again.

Problem: "API URL not found" in frontend
  Solution: Check your .env file - make sure you copied the ApiUrl correctly.

Problem: "User Pool not found"
  Solution: Check your .env file - make sure UserPoolId is correct (format: us-west-2_ABC123)

Problem: Frontend won't start
  Solution: Make sure you're in the frontend folder and ran npm install first.

For detailed troubleshooting, see GET_ENV_VARIABLES.md


NEED MORE HELP?
---------------
See GET_ENV_VARIABLES.md for:
- Detailed step-by-step instructions with screenshots descriptions
- How to get values from AWS Console if you missed the deployment output
- Complete troubleshooting guide
- Examples of correct .env files

REMEMBER:
---------
- Your AWS credentials are temporary and will expire
- Region must be us-west-2
- Save deployment outputs immediately - you'll need them!
- First deployment takes 5-10 minutes - be patient!

