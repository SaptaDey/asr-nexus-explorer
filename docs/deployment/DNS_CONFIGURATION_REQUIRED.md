# DNS Configuration Required for scientific-research.online

## IMPORTANT: Manual DNS Configuration Needed

The GitHub Pages deployment is complete, but you need to configure DNS records with your domain registrar.

### Required DNS Records

Add the following A records for scientific-research.online:

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

For www subdomain (optional):
```
Type: CNAME
Name: www
Value: SaptaDey.github.io
```

### Steps to Complete

1. **Log in to your domain registrar** (where you purchased scientific-research.online)
2. **Navigate to DNS settings**
3. **Add the A records** listed above
4. **Wait for DNS propagation** (can take up to 24-48 hours)
5. **GitHub will automatically provision SSL certificate** once DNS is verified

### Current Status

- ✅ GitHub Pages deployed successfully
- ✅ Custom domain configured in GitHub
- ⏳ Waiting for DNS configuration
- ⏳ SSL certificate will be issued after DNS verification

### Verify DNS Configuration

After adding DNS records, you can verify them using:
```bash
nslookup scientific-research.online
dig scientific-research.online
```

### Access URLs

- Temporary URL: https://saptadey.github.io/asr-nexus-explorer/
- Final URL (after DNS): https://scientific-research.online/

Once DNS propagates and SSL certificate is issued, HTTPS will be automatically enforced.