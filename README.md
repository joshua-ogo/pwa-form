# Intake Form PWA 🚀

A premium, offline-capable intake form built with Vue 3 and Vite. This application utilizes Progressive Web App (PWA) technology to ensure it remains functional even without an internet connection.

## ✨ Features

- **PWA Ready**: Installable on mobile and desktop devices.
- **Offline Mode**: Access the form and view previously submitted data without internet.
- **Persistent Storage**: Uses `localStorage` to keep your data safe across page refreshes.
- **Modern UI**: Clean, premium design with glassmorphism effects and Inter typography.
- **Form Validation**: Real-time validation for required fields (Name, Email, Phone).
- **Status Indicator**: Live badge showing your current connection status (Online/Offline).

## 🛠️ Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Bundler**: [Vite](https://vitejs.dev/)
- **PWA Support**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **Styling**: Vanilla CSS with modern CSS variables

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run the dev server
npm run dev
```
> **Note**: For testing offline features in dev mode, refresh the page while online once to register the service worker.

### Production Build (Testing PWA)

To experience the full PWA capabilities (like the install button and reliable offline support), you should build the project:

```bash
# Build the project
npm run build

# Preview the build locally
npm run preview
```

## 🌐 Deployment

This project is optimized for deployment on platforms like **Vercel** or **Netlify**. 

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Vercel will automatically detect the Vite build settings and deploy your PWA.

## 📝 How the Offline Support Works

1. **Caching**: `vite-plugin-pwa` generates a Service Worker that caches all essential app files (HTML, JS, CSS, Icons).
2. **Data**: Form submissions are stored in `localStorage`.
3. **Behavior**: When a user reloads the app offline, the Service Worker serves the cached files, and the Vue app retrieves the last submission from `localStorage` to display it on the same page.

---
Built with ❤️ using Vue 3 + Vite.
