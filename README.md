# Stock Dashboard

A beginner-friendly stock dashboard made with plain HTML, CSS, and JavaScript. It displays six trending stocks and lets you search for any Yahoo Finance ticker.

## Run locally

Because browsers apply stricter rules when a page is opened directly as a file, run the project through a small local web server.

If Python is installed, open a terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000> in your browser.

You can also use an editor extension such as VS Code Live Server.

## How the data works

`script.js` requests market data from Yahoo Finance's chart endpoint. Since Yahoo Finance blocks direct browser requests with CORS, requests pass through the public `corsproxy.io` service.

This keeps the first version simple and backend-free, but a public proxy is not suitable for a production app: it can be slow, unavailable, or rate-limited. A later version should use a small server-side API route.

Stock prices may be delayed. This project is for learning purposes and is not financial advice.
