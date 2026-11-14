# SweetChat Starter

A static anime-character chat website for GitHub Pages.

## Files
- `index.html` — app layout
- `style.css` — responsive dark theme
- `app.js` — character list, browser chat history, Gemini API calls

## Run locally
Open `index.html` in a modern browser. Add your Gemini API key in **Settings**.

## Publish with GitHub Pages
1. Create a new GitHub repository (for example, `sweetchat`).
2. Upload all four files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for the published URL to appear in the Pages section.

## Important API-key warning
This is a browser-only project. The Gemini API key is stored in the browser's LocalStorage and is used directly by the browser. It is not safe for a public multi-user website or a shared device. Do not commit your API key to GitHub, and do not share a browser profile that has your key saved.

The app currently uses the Gemini `generateContent` REST endpoint. Check Google's current API docs and model availability if a model is unavailable:
https://ai.google.dev/gemini-api/docs/models
