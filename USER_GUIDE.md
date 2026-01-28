# Warm Lead - User Guide

## Getting Started

### First Time Setup

1. **Access the Application**
   - Open your browser
   - Navigate to `http://localhost:3000`
   - You'll be redirected to the login page

2. **Login**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Click "Sign In"

3. **Change Password** (Recommended)
   - After login, go to Settings
   - Update your email and password
   - Save changes

## Dashboard Overview

The dashboard provides:
- Quick access to pixel warming tools
- Recent activity history
- Success rate statistics
- Quick start buttons

## Creating a Pixel Warming Campaign

### Method 1: Random Data Mode

1. Click **"New Campaign"** or **"Start Pixel Warming"**
2. Enter your **landing page URL**
   - Example: `https://yourstore.com/product/item`
   - Must have Facebook/TikTok/Google pixel installed
3. Select **"Random Data"** mode
4. Set **number of orders** (1-500)
5. Click **"Start Processing"**
6. Monitor progress in real-time
7. View results when complete

### Method 2: Excel Upload Mode

1. Click **"New Campaign"**
2. Enter your **landing page URL**
3. Select **"Excel Upload"** mode
4. Click **"Upload File"**
5. Select your Excel/CSV file
6. **Map columns** to fields:
   - Name → Customer name
   - Phone → Phone number
   - City → City/Location
   - Price → Order value
7. Click **"Start Processing"**
8. Monitor progress

## Excel File Format

### Required Structure

Create an Excel or CSV file with these columns:

| name | phone | city | price |
|------|-------|------|-------|
| Ahmed Benali | 0555123456 | Alger | 3200 |
| Fatima Mansouri | 0666789012 | Oran | 4500 |
| Youssef Khalil | 0777345678 | Constantine | 2800 |

### Supported Column Names

- **Name**: `name`, `firstName`, `lastName`, `fullName`
- **Phone**: `phone`, `telephone`, `tel`, `mobile`
- **City**: `city`, `ville`, `wilaya`, `location`
- **Price**: `price`, `value`, `amount`, `total`

### Tips for Best Results

- Use realistic names and phone numbers
- Include valid Algerian cities
- Set reasonable prices (1000-10000 DZD)
- Minimum 10 rows for meaningful results
- Maximum 500 rows per file

## Understanding Results

### Success Indicators

- ✅ **Green checkmark**: Pixel event fired successfully
- ⚠️ **Yellow warning**: Partial success (verify manually)
- ❌ **Red X**: Failed to process

### Success Rate

- **95-100%**: Excellent - All pixels firing correctly
- **80-94%**: Good - Minor issues, check failed items
- **Below 80%**: Review landing page and pixel installation

## Verifying Pixel Events

### Facebook Events Manager

1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Select your pixel
3. Click "Test Events"
4. You should see "Purchase" events appearing
5. Verify event parameters (value, currency, etc.)

### TikTok Events Manager

1. Go to TikTok Ads Manager
2. Navigate to "Events" → "Web Events"
3. Select your pixel
4. Check for "CompletePayment" events
5. Verify event data

### Google Analytics

1. Go to Google Analytics
2. Navigate to "Realtime" → "Events"
3. Look for "purchase" events
4. Check event parameters

## Best Practices

### Campaign Strategy

1. **Start Small**: Begin with 20-50 events
2. **Verify**: Check Events Manager after first batch
3. **Scale Up**: Increase to 100-200 events
4. **Consistency**: Run campaigns regularly (daily/weekly)
5. **Monitor**: Track ad performance improvements

### Optimal Settings

- **Frequency**: 2-3 campaigns per week
- **Volume**: 50-150 events per campaign
- **Timing**: Spread throughout the day
- **Data Quality**: Use realistic customer information

### Landing Page Requirements

Your landing page must have:
- ✅ Facebook Pixel installed and active
- ✅ TikTok Pixel installed (if using TikTok ads)
- ✅ Google Analytics configured (if using Google ads)
- ✅ Page loads within 10 seconds
- ✅ No CAPTCHA or bot protection

## Troubleshooting

### Common Issues

**Problem**: Low success rate (below 80%)
- **Solution**: Verify pixel installation on landing page
- Check browser console for pixel errors
- Ensure page loads correctly

**Problem**: No events showing in Events Manager
- **Solution**: Wait 5-10 minutes for events to appear
- Verify pixel ID is correct
- Check if pixel is active

**Problem**: Processing is slow
- **Solution**: Reduce number of concurrent orders
- Check internet connection
- Verify server resources

**Problem**: "Page not found" errors
- **Solution**: Verify landing page URL is correct
- Ensure page is publicly accessible
- Check for redirects or authentication

### Getting Help

If you encounter issues:
1. Check application logs: `docker-compose logs -f`
2. Verify landing page is accessible
3. Test pixel manually in browser
4. Review this guide's troubleshooting section

## Advanced Features

### Custom Processing Speed

Adjust processing speed based on your needs:
- **Fast**: 2 seconds per order (may trigger anti-bot)
- **Normal**: 3-4 seconds per order (recommended)
- **Slow**: 5-6 seconds per order (safest)

### Batch Processing

For large campaigns (200+ events):
- Split into multiple batches
- Run batches 2-3 hours apart
- Monitor success rate between batches

### Data Management

- Export campaign results to CSV
- Review historical performance
- Track pixel warming effectiveness

## Security & Privacy

### Data Storage

- All data stored locally in SQLite database
- No data sent to external servers
- Customer data encrypted at rest

### Access Control

- Change default password immediately
- Use strong passwords (12+ characters)
- Limit access to authorized users only

### Compliance

- Use only for legitimate advertising purposes
- Comply with platform terms of service
- Respect privacy regulations (GDPR, etc.)

## Tips for Maximum Results

1. **Warm Pixels Gradually**: Don't send 500 events at once
2. **Use Realistic Data**: Better data = better pixel learning
3. **Monitor Ad Performance**: Track improvements in ROAS
4. **Consistency is Key**: Regular warming yields best results
5. **Verify Events**: Always check Events Manager
6. **Test Different Pages**: Try multiple landing pages
7. **Track Success Rates**: Maintain 90%+ success rate

## Maintenance

### Regular Tasks

- **Daily**: Monitor campaign results
- **Weekly**: Review success rates
- **Monthly**: Backup database
- **Quarterly**: Update application

### Database Backup

```bash
docker cp warm-lead-app:/app/prisma/dev.db ./backup-$(date +%Y%m%d).db
```

### Performance Optimization

- Clear old campaign data monthly
- Monitor disk space usage
- Restart application weekly for best performance

---

**Need help? Check the logs or contact support.**
