# Fix GitHub Push Protection - AWS Credentials in History

## Problem
GitHub blocked the push because AWS credentials were found in commit `f691fdf1c6fd678da2871bc98c3e555e882e3731` in file `setup-ecommerce-credentials.ps1`.

## Solution Options

### Option 1: Use GitHub's Unblock Feature (Easiest)

GitHub provided unblock URLs. Click these to allow the push:

1. **AWS Access Key ID:**
   https://github.com/A-d-1-t-y-a/smart-vechicle-maintenance/security/secret-scanning/unblock-secret/36SCQ9ntgWdPrCRScHMkmWpgxvx

2. **AWS Secret Access Key:**
   https://github.com/A-d-1-t-y-a/smart-vechicle-maintenance/security/secret-scanning/unblock-secret/36SCQBPmP5hhLhz5y5jxUVIOUEG

After clicking both URLs and allowing the secrets, push again:
```powershell
git push origin HEAD:main
```

**Note:** These credentials should be rotated immediately after pushing, as they're now exposed in git history.

---

### Option 2: Remove File from Git History (Recommended)

**Step 1: Install BFG Repo-Cleaner (if not installed)**
```powershell
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Or use chocolatey: choco install bfg
```

**Step 2: Remove the file from history**
```powershell
cd d:\projects\smart-vechicle-maintenance
bfg --delete-files setup-ecommerce-credentials.ps1
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Step 3: Force push**
```powershell
git push origin HEAD:main --force
```

---

### Option 3: Use Git Filter-Branch (Manual)

```powershell
cd d:\projects\smart-vechicle-maintenance

# Remove file from all commits
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch setup-ecommerce-credentials.ps1" --prune-empty --tag-name-filter cat -- --all

# Clean up
Remove-Item -Path ".git/refs/original" -Recurse -Force -ErrorAction SilentlyContinue
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin HEAD:main --force
```

---

### Option 4: Create New Branch Without Problematic Commit

```powershell
# Find the commit before the problematic one
git log --oneline

# Create new branch from before problematic commit
git checkout -b main-clean <commit-before-f691fdf>

# Cherry-pick commits you want (skip the one with credentials)
# Then force push new branch
git push origin main-clean:main --force
```

---

## Important: Rotate AWS Credentials

**After resolving this issue, you MUST:**

1. **Rotate the exposed AWS credentials immediately:**
   - Go to AWS IAM Console
   - Delete the access key: `AKIAV5A44WJZGPN6WZ56`
   - Create new access keys
   - Update your local AWS credentials

2. **Update deployment scripts** with new credentials (securely)

3. **Never commit credentials to git again**

---

## Prevention

The file `setup-ecommerce-credentials.ps1` is now in `.gitignore`. For future projects:

1. Always use `.env` files (in `.gitignore`)
2. Use AWS IAM roles instead of access keys when possible
3. Use AWS Secrets Manager for production
4. Never hardcode credentials in scripts

---

## Quick Fix (If you just want to push now)

**Use Option 1** - Click the unblock URLs, then push. This is the fastest solution, but remember to rotate the credentials afterward.
