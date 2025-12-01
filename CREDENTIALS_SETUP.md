# AWS Credentials Setup

## Important Security Notice

**Never commit actual AWS credentials to git!** 

This repository includes template files for setting up AWS credentials. Follow these steps:

## Setup Instructions

### For Windows (PowerShell/Command Prompt)

1. Copy the template file:
   ```
   copy set-credentials.bat.template set-credentials.bat
   ```

2. Edit `set-credentials.bat` and replace the placeholder values with your actual AWS credentials:
   - `YOUR_AWS_ACCESS_KEY_ID`
   - `YOUR_AWS_SECRET_ACCESS_KEY`
   - `YOUR_AWS_SESSION_TOKEN` (if using temporary credentials)

3. Run the script to set credentials for your current session:
   ```
   set-credentials.bat
   ```

### For Linux/Mac (Bash)

1. Copy the template file:
   ```bash
   cp setup-aws-credentials.sh.template setup-aws-credentials.sh
   ```

2. Edit `setup-aws-credentials.sh` and replace the placeholder values with your actual AWS credentials

3. Make it executable and run:
   ```bash
   chmod +x setup-aws-credentials.sh
   source ./setup-aws-credentials.sh
   ```

## Security Best Practices

- The actual credential files (`set-credentials.bat`, `setup-aws-credentials.sh`) are in `.gitignore` and will not be committed
- Only template files are tracked in git
- Never share your actual credentials files
- Use AWS IAM temporary credentials when possible
- Rotate your credentials regularly

## Alternative: Use AWS CLI Configuration

Instead of credential files, you can use the AWS CLI to configure credentials:

```bash
aws configure
```

This stores credentials in `~/.aws/credentials` (more secure).

