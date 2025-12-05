# CloudFront Setup for Mobile HTTPS Access

## Problem
S3 website endpoints use HTTP only, which mobile browsers and networks often block for security reasons.

## Solution: CloudFront Distribution

CloudFront provides:
- ✅ HTTPS (secure connection)
- ✅ Works on all mobile devices
- ✅ Faster loading (CDN)
- ✅ Better reliability

---

## Option 1: AWS Console (Easiest - Recommended)

### Step 1: Go to CloudFront Console
1. Open: https://console.aws.amazon.com/cloudfront
2. Make sure you're in the correct AWS account
3. Click **"Create Distribution"**

### Step 2: Configure Origin
1. **Origin Domain**: 
   ```
   smart-vehicle-maintenance-frontend-495930420806.s3-website-us-west-2.amazonaws.com
   ```
   ⚠️ **IMPORTANT**: Use the website endpoint (with `.s3-website-`), NOT the bucket name!

2. **Origin Type**: Select **"Custom Origin"** (not S3 origin)

3. **Origin Protocol**: **HTTP Only** (S3 website endpoints are HTTP)

4. **Origin Path**: Leave empty

### Step 3: Configure Default Cache Behavior
1. **Viewer Protocol Policy**: **"Redirect HTTP to HTTPS"** ⚠️ **CRITICAL!**
2. **Allowed HTTP Methods**: **GET, HEAD, OPTIONS**
3. **Cache Policy**: **"CachingOptimized"** or **"CachingDisabled"** (for development)

### Step 4: Configure Settings
1. **Default Root Object**: `index.html`
2. **Price Class**: **"Use only North America and Europe"** (cheapest option)
3. **Alternate Domain Names (CNAMEs)**: Leave empty (unless you have a custom domain)

### Step 5: Configure Custom Error Responses
1. Click **"Create custom error response"**
2. **HTTP Error Code**: `404`
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: `200`
   - **Error Caching Minimum TTL**: `300`
3. Click **"Create custom error response"** again
4. **HTTP Error Code**: `403`
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: `200`
   - **Error Caching Minimum TTL**: `300`

### Step 6: Create Distribution
1. Click **"Create Distribution"**
2. Wait 10-15 minutes for deployment
3. Status will change from "In Progress" to "Deployed"

### Step 7: Get Your HTTPS URL
Once deployed, you'll see:
- **Distribution Domain Name**: `d1234567890abc.cloudfront.net`
- **Your HTTPS URL**: `https://d1234567890abc.cloudfront.net`

**This URL will work on mobile!** ✅

---

## Option 2: AWS CLI (Automated)

### Run the setup script:
```powershell
.\setup-cloudfront.ps1
```

### Or manually:
```powershell
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### Check status:
```powershell
aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'smart-vehicle')].{Id:Id,DomainName:DomainName,Status:Status}" --output table
```

### Get your HTTPS URL:
```powershell
aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'smart-vehicle')].DomainName" --output text
```

---

## Option 3: Update SAM Template (For Future Deployments)

Add CloudFront to your `template.yaml`:

```yaml
Resources:
  FrontendDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !Sub '${FrontendBucket}.s3-website.${AWS::Region}.amazonaws.com'
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        CustomErrorResponses:
          - ErrorCode: 404
            ResponsePagePath: /index.html
            ResponseCode: 200
            ErrorCachingMinTTL: 300
          - ErrorCode: 403
            ResponsePagePath: /index.html
            ResponseCode: 200
            ErrorCachingMinTTL: 300
        PriceClass: PriceClass_100

Outputs:
  FrontendUrl:
    Description: CloudFront HTTPS URL
    Value: !GetAtt FrontendDistribution.DomainName
    Export:
      Name: !Sub '${ProjectName}-frontend-url'
```

---

## Testing

### After CloudFront is deployed:

1. **Desktop Test**:
   ```
   https://YOUR-DISTRIBUTION-ID.cloudfront.net
   ```

2. **Mobile Test**:
   - Open the same URL on your mobile browser
   - Should load with HTTPS (green lock icon)
   - Should work on all mobile networks

3. **Verify HTTPS**:
   - Check browser address bar shows `https://`
   - Check for green lock icon
   - Mobile should not show "site can't be reached"

---

## Troubleshooting

### Issue: "Distribution still deploying"
- **Solution**: Wait 10-15 minutes. CloudFront takes time to deploy globally.

### Issue: "403 Forbidden" or "404 Not Found"
- **Solution**: Check Custom Error Responses are configured (404/403 -> /index.html)

### Issue: "Still not working on mobile"
- **Solution**: 
  1. Clear browser cache on mobile
  2. Try incognito/private mode
  3. Verify you're using the CloudFront URL (not S3 URL)
  4. Check CloudFront status is "Deployed"

### Issue: "Changes not showing"
- **Solution**: 
  1. Invalidate CloudFront cache:
     ```powershell
     aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
     ```
  2. Wait 2-5 minutes for invalidation to complete

---

## Cost

CloudFront pricing (very cheap):
- **First 1 TB/month**: Free
- **Next 9 TB/month**: $0.085 per GB
- **HTTPS requests**: No extra charge
- **For typical app**: ~$0.50-2.00/month

---

## Quick Reference

**Current HTTP URL (mobile issues)**:
```
http://smart-vehicle-maintenance-frontend-495930420806.s3-website-us-west-2.amazonaws.com
```

**New HTTPS URL (after CloudFront)**:
```
https://YOUR-DISTRIBUTION-ID.cloudfront.net
```

**Check existing distributions**:
```powershell
aws cloudfront list-distributions --output table
```

---

**Once CloudFront is set up, your app will work perfectly on mobile!** 🚀

