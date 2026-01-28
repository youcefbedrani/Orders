# 🔥 Warm Lead - Pixel Warming Tool

A powerful pixel warming tool to generate fake purchase events for Facebook, TikTok, and Google Analytics pixels without creating real orders.

## Features

- 🔥 **Pixel Warming**: Fire purchase events to warm up your advertising pixels
- 🎲 **Random Data Mode**: Auto-generate realistic customer data
- 📊 **Excel Upload Mode**: Use your own customer data from Excel/CSV files
- 📈 **Real-time Progress**: Watch orders being processed in real-time
- 📊 **Detailed Analytics**: Success rate, total orders, and individual order status
- 🚀 **High Volume**: Support for up to 500 orders per session
- 🌐 **Universal**: Works with any website (Shopify, WooCommerce, YouCan, custom sites)

## How It Works

Warm Lead visits your landing page and fires pixel events via JavaScript:
- Facebook Pixel: `fbq('track', 'Purchase', {...})`
- TikTok Pixel: `ttq.track('CompletePayment', {...})`
- Google Analytics: `gtag('event', 'purchase', {...})`

**Important**: This tool does NOT create real orders in your store. It only fires pixel events.

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### Default Login Credentials

```
Email: admin@example.com
Password: admin123
```

## Usage

1. **Login** to the dashboard
2. **Enter your landing page URL** (any website with a pixel installed)
3. **Choose mode**:
   - **Random Data**: Set number of orders (1-500)
   - **Excel Upload**: Upload CSV/Excel with customer data
4. **Click "Start Pixel Warming"**
5. **Monitor progress** in real-time
6. **Check results** in Facebook/TikTok Events Manager

## Excel Format

For Excel upload mode, use this format:

| name | phone | city | price |
|------|-------|------|-------|
| Ahmed | 0555123456 | Alger | 3200 |
| Fatima | 0666789012 | Oran | 4500 |

Supported columns: `name`, `firstName`, `lastName`, `phone`, `telephone`, `city`, `ville`, `price`, `value`

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Create a `.env.local` file:

```env
# Optional: Add your own environment variables
NEXT_PUBLIC_APP_NAME=Warm Lead
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- Vercel
- Netlify
- Railway
- DigitalOcean
- AWS
- Any Node.js hosting

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Automation**: Puppeteer
- **Excel**: SheetJS (xlsx)

## Requirements

- Node.js 18+
- Chrome/Chromium (for Puppeteer)

## Limitations

- Maximum 500 orders per session
- Requires target website to have pixel installed
- Processing time: ~2-3 seconds per order

## FAQ

**Q: Will this create real orders in my store?**  
A: No. It only fires pixel events.

**Q: Do I need a special landing page?**  
A: No. Any URL with a pixel installed works.

**Q: Can I use this with Shopify/WooCommerce?**  
A: Yes! Works with any e-commerce platform.

**Q: How many orders should I generate?**  
A: Start with 20-50, then scale to 100-200 for better results.

## Support

For issues or questions, check the `/warm_lead_guide.md` in the artifacts folder.

## License

MIT License - Free to use for personal and commercial projects.

---

**Made with ❤️ for better ad performance**
