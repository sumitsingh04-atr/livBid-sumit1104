# Ngrok Setup Guide

To connect external frontend developers to your local backend, follow these steps:

## 1. Authentication (One-time)
If you haven't already, you need to sign up at [ngrok.com](https://ngrok.com) and get your auth token.

Run the following command in your terminal:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## 2. Start the Tunnel
Once your backend server is running (`npm run dev`), open a new terminal and run:
```bash
npm run tunnel
```

## 3. Share the URL
Ngrok will provide a public URL (e.g., `https://random-id.ngrok-free.app`). 
Share this URL with the frontend developers. They can use it as the base URL for API calls.

> [!IMPORTANT]
> Keep the terminal window open while you want the tunnel to be active.
> The URL will change every time you restart the tunnel unless you use a static domain (paid feature).
