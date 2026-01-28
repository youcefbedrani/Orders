# 🔥 Warm Lead - Pixel Warming Tool

Professional pixel warming solution for Facebook, TikTok, and Google Analytics advertising campaigns.

## Overview

Warm Lead is a powerful automation tool designed to optimize your advertising pixels by generating purchase events. This helps improve ad performance, reduce cost per acquisition, and enhance pixel learning for better campaign results.

## Key Features

- 🔥 **Pixel Warming**: Generate purchase events for Facebook, TikTok, and Google Analytics
- 🎲 **Random Data Mode**: Automatically generate realistic customer data
- 📊 **Excel Upload Mode**: Import your own customer data from Excel/CSV files
- 📈 **Real-time Monitoring**: Track processing status and success rates
- 🚀 **High Volume Processing**: Handle up to 500 orders per session
- 🌐 **Universal Compatibility**: Works with any e-commerce platform (Shopify, WooCommerce, YouCan, custom sites)
- 💾 **Data Persistence**: All data stored securely in local database

## How It Works

The application visits your landing page and fires pixel tracking events:
- **Facebook Pixel**: `fbq('track', 'Purchase', {...})`
- **TikTok Pixel**: `ttq.track('CompletePayment', {...})`
- **Google Analytics**: `gtag('event', 'purchase', {...})`

> **Note**: This tool fires pixel events only. No actual orders are created in your store.

## Installation

### Docker Installation (Recommended)

See [INSTALLATION.md](INSTALLATION.md) for detailed Docker installation instructions.

Quick start:
```bash
docker-compose up -d
```

Access at: `http://localhost:3000`

### Manual Installation

```bash
# Install dependencies
npm install

# Start the application
npm run build
npm start
```

## Default Login

```
Email: admin@example.com
Password: admin123
```

> ⚠️ **Security**: Change default credentials after first login.

## Usage Guide

### Basic Workflow

1. **Login** to the dashboard
2. **Enter landing page URL** (must have pixel installed)
3. **Select mode**:
   - Random Data: Auto-generate customer information
   - Excel Upload: Use your own customer data
4. **Configure settings**:
   - Number of orders (1-500)
   - Processing speed
5. **Start processing**
6. **Monitor results** in real-time
7. **Verify events** in your advertising platform's Events Manager

### Excel Data Format

For Excel upload mode, use this structure:

| name | phone | city | price |
|------|-------|------|-------|
| Ahmed | 0555123456 | Alger | 3200 |
| Fatima | 0666789012 | Oran | 4500 |

**Supported columns**: `name`, `firstName`, `lastName`, `phone`, `telephone`, `city`, `ville`, `price`, `value`

## System Requirements

- **Docker**: 20.10+ (recommended)
- **Node.js**: 18+ (for manual installation)
- **RAM**: 2GB minimum
- **Disk Space**: 1GB free
- **Browser**: Chrome/Chromium (automatically installed with Docker)

## Technical Specifications

- **Framework**: Next.js 14
- **Database**: SQLite
- **Automation Engine**: Puppeteer
- **Data Processing**: SheetJS (xlsx)
- **Styling**: Tailwind CSS

## Performance

- **Processing Speed**: 2-3 seconds per order
- **Maximum Capacity**: 500 orders per session
- **Concurrent Processing**: Optimized for stability
- **Success Rate**: 95%+ (depends on target website)

## Frequently Asked Questions

**Q: Will this create real orders in my store?**  
A: No. The tool only fires pixel tracking events. No orders are created.

**Q: What platforms are supported?**  
A: All e-commerce platforms with pixel integration (Shopify, WooCommerce, YouCan, custom sites).

**Q: Do I need a special landing page?**  
A: No. Any page with a pixel installed will work.

**Q: How many events should I generate?**  
A: Start with 20-50 events, then scale to 100-200 for optimal results.

**Q: Is my data secure?**  
A: Yes. All data is stored locally in your database. Nothing is sent to external servers.

## Support & Maintenance

For technical support:
- Check application logs: `docker-compose logs -f`
- Review [INSTALLATION.md](INSTALLATION.md) for troubleshooting
- Verify system requirements are met

## License

Proprietary software. All rights reserved.

---

**Optimize your advertising campaigns with Warm Lead** 🚀
