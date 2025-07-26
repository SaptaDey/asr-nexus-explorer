# 🚀 IONOS DNS Update Guide: Complete Migration to GitHub Pages

## 🎯 OBJECTIVE
Update DNS records for `scientific-research.online` to point to GitHub Pages instead of the current Cloudflare hosting.

## 📊 CURRENT STATUS
- **Current DNS**: Points to `185.158.133.1` (Cloudflare/Old hosting)
- **Target DNS**: GitHub Pages IPs
- **Domain Registrar**: IONOS (https://mein.ionos.de/domain)

## 🔧 METHOD 1: IONOS CLI (Automated)

### Prerequisites
- ✅ IONOS CLI installed (`ionosctl`)
- ✅ API credentials available in `Ionos.env.local`

### CLI Commands
```bash
# Set environment variables
export IONOS_API_KEY=9078a1e1d62349f897391cf652c3d0da

# List DNS zones
ionosctl dns zone list

# List current records for scientific-research.online
ionosctl dns record list --zone scientific-research.online

# Delete old A record (pointing to 185.158.133.1)
ionosctl dns record delete --zone scientific-research.online --record-id [OLD_RECORD_ID]

# Add new GitHub Pages A records
ionosctl dns record create --zone scientific-research.online \
  --name @ --type A --content 185.199.108.153 --ttl 3600

ionosctl dns record create --zone scientific-research.online \
  --name @ --type A --content 185.199.109.153 --ttl 3600

ionosctl dns record create --zone scientific-research.online \
  --name @ --type A --content 185.199.110.153 --ttl 3600

ionosctl dns record create --zone scientific-research.online \
  --name @ --type A --content 185.199.111.153 --ttl 3600
```

## 🖥 METHOD 2: IONOS Web Interface (Manual)

### Step 1: Access IONOS DNS Management
1. Go to https://mein.ionos.de/domain
2. Login to your IONOS account
3. Select `scientific-research.online` domain
4. Navigate to "DNS" or "Domain Management"

### Step 2: Update A Records
1. **Find current A record**:
   - Type: A
   - Name: @ (or blank/root)
   - Points to: `185.158.133.1`
   
2. **Delete or modify the old record**

3. **Add new A records** (GitHub Pages):
   ```
   Type: A | Name: @ | Points to: 185.199.108.153 | TTL: 3600
   Type: A | Name: @ | Points to: 185.199.109.153 | TTL: 3600  
   Type: A | Name: @ | Points to: 185.199.110.153 | TTL: 3600
   Type: A | Name: @ | Points to: 185.199.111.153 | TTL: 3600
   ```

4. **Save changes**

### Step 3: Optional WWW CNAME
Add a CNAME record for www subdomain:
```
Type: CNAME | Name: www | Points to: SaptaDey.github.io | TTL: 3600
```

## ✅ VERIFICATION PROCESS

### Immediate Verification
```bash
# Check DNS changes (may show old values initially)
nslookup scientific-research.online

# Check with different DNS servers
nslookup scientific-research.online 8.8.8.8
nslookup scientific-research.online 1.1.1.1
```

### Expected Results
**BEFORE UPDATE**:
```
$ nslookup scientific-research.online
Name: scientific-research.online
Address: 185.158.133.1  # OLD (Cloudflare)
```

**AFTER UPDATE** (may take 24-48 hours):
```
$ nslookup scientific-research.online
Name: scientific-research.online
Address: 185.199.108.153  # NEW (GitHub Pages)
```

### DNS Propagation Checker
Use online tools to check global DNS propagation:
- https://whatsmydns.net/
- https://dnschecker.org/
- Enter: `scientific-research.online` and select `A` record type

## 📈 MONITORING PROGRESS

### Phase 1: DNS Update (0-2 hours)
- [ ] Update DNS records in IONOS
- [ ] Verify changes in IONOS dashboard
- [ ] Initial DNS queries may still show old IP

### Phase 2: Propagation (2-24 hours)
- [ ] DNS starts propagating globally
- [ ] Mixed results from different DNS servers
- [ ] Some regions see new IP, others still old

### Phase 3: Complete (24-48 hours)
- [ ] All DNS servers show new GitHub Pages IP
- [ ] Domain resolves to GitHub Pages
- [ ] SSL certificate automatically issued
- [ ] Migration complete!

## 🚨 TROUBLESHOOTING

### Issue: DNS not updating
**Cause**: Cache or propagation delay
**Solution**: 
- Wait 24-48 hours
- Clear browser cache
- Try different DNS servers

### Issue: Website not loading
**Cause**: SSL certificate not issued yet
**Solution**:
- Wait for GitHub to issue certificate (up to 30 minutes after DNS verification)
- Check GitHub Pages settings for SSL status

### Issue: Mixed content or errors
**Cause**: Browser cached old site
**Solution**:
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache and cookies
- Try incognito/private browsing

## 🎯 SUCCESS CRITERIA

Migration is complete when:
- ✅ `nslookup scientific-research.online` returns GitHub Pages IP
- ✅ https://scientific-research.online/ loads GitHub Pages site
- ✅ No Lovable.dev branding visible
- ✅ SSL certificate shows "Issued by: Let's Encrypt" 
- ✅ All ASR-GoT functionality works
- ✅ Supabase integration functional

## 💰 POST-MIGRATION ACTIONS

Once DNS migration is verified:
- [ ] Test all functionality on custom domain
- [ ] Cancel Lovable.dev subscription
- [ ] Update any external links
- [ ] Monitor for 1 week for any issues
- [ ] Document lessons learned

---

**🚀 TIMELINE**: 24-48 hours for complete DNS propagation  
**💰 SAVINGS**: $600-2400/year by moving to GitHub Pages  
**📞 SUPPORT**: If issues persist, contact IONOS support or check GitHub Pages status