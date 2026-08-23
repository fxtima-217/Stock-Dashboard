# Stock Dashboard

A beginner-friendly stock dashboard made with plain HTML, CSS, and JavaScript. It displays six trending stocks and lets you search for any Yahoo Finance ticker.

## Run locally

Because the project includes a serverless API route, run it through Vercel's local development server.

The dashboard now includes a Vercel serverless API route, so use the Vercel CLI
to run both the website and API locally:

```bash
npx vercel dev
```

Then open the local URL printed in the terminal. A plain static server or VS Code
Live Server cannot run the `/api/stock` serverless function.

## How the data works

`script.js` requests market data from the same-site `/api/stock` route. The
serverless function in `api/stock.js` fetches Yahoo Finance data on the server,
where browser CORS restrictions do not apply. It validates requests, uses a
timeout and fallback Yahoo host, and lets Vercel cache successful responses
briefly to reduce repeated calls.

Vercel detects and deploys files in the `api` directory automatically. No API
key or environment variable is required.

Stock prices may be delayed. This project is for learning purposes and is not financial advice.
