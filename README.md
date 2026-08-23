# StockFrame

An interactive financial markets dashboard built with HTML, CSS, and vanilla JavaScript. It displays the latest available prices for major indexes and a selection of popular stocks, supports ticker searches, and draws an interactive one-month price chart.

## Live Demo

[View the deployed StockFrame dashboard](https://stockframe.vercel.app/)

## Key Features

- Displays current price information for six popular stocks
- Searches for stocks using their ticker symbols
- Shows daily percentage movement
- Draws a one-month price history chart when a stock card is selected
- Handles loading states, unavailable data, and invalid tickers
- Uses a responsive, accessible interface

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API and async/await
- SVG for chart rendering
- Yahoo Finance market data
- Vercel Serverless Functions
- Git and GitHub
- Vercel deployment

## How It Works

When the page loads, `script.js` requests data for a predefined list of popular ticker symbols. A user can also submit another ticker through the search form. The returned JSON is validated and transformed into stock cards using DOM methods.

Selecting a card requests one month of daily prices. The application converts those values into a responsive SVG line chart without using a charting library.

### Architecture

```text
Browser → Vercel serverless API route → Yahoo Finance
```

The browser sends same-origin requests to `/api/stock`. The serverless function validates the request, contacts Yahoo Finance, and returns the market data to the browser. It also uses a timeout, a fallback Yahoo host, and short-lived caching to make requests more resilient.

Yahoo Finance does not allow this data to be requested directly from most browser pages because of CORS restrictions. A public CORS proxy can become unavailable, rate-limit requests, or introduce privacy and reliability concerns. Using a serverless API route keeps the data request under the application's control and is better suited to a deployed project.

## What I Learned

This project helped me practise:

- Requesting API data with `fetch` and `async/await`
- Reading and validating JSON responses
- Rendering dynamic content with the DOM
- Creating charts with SVG
- Handling errors and loading states
- Understanding browser CORS restrictions
- Using Git and GitHub for version control
- Deploying a frontend and serverless API with Vercel

## Local Development

Node.js is required because the Vercel development server runs the serverless API route locally.

1. Clone the repository and open the project directory.
2. Start the local Vercel environment:

   ```bash
   npx vercel dev
   ```

3. Open the local URL shown in the terminal.

No API key or environment variable is required. A basic static server or VS Code Live Server will display the page, but it cannot run the `/api/stock` function.

## Future Improvements

- Add selectable chart time ranges
- Add a personal watchlist using local storage
- Improve chart details with hover tooltips
- Add automated tests for the API route and UI logic

> Market prices may be delayed. This project is for educational purposes and is not financial advice.
