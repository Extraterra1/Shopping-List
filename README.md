# 🛒 Shopping List PWA

A premium, mobile-first shopping list Progressive Web App designed with a minimalist aesthetic that Jony Ive would approve of.

This is a **simple vibe coded app**, built entirely by **Gemini 3 Pro** using **Antigravity**.

## ✨ Features

-   **Mobile-First Design**: Optimized for one-handed use and touch interaction.
-   **Jony Ive Aesthetic**: Minimalist layout, subtle blurs, and premium typography.
-   **Smart Emoji Selection**: Automatically assigns emojis to your grocery items (e.g., "Milk" -> 🥛).
-   **PWA Ready**: Installable on iOS and Android for a native app feel.
-   **Real-time Sync**: Uses Firebase Firestore to keep your list synced across devices.
-   **Animations**: Fluid transitions powered by Framer Motion.

## 🚀 Tech Stack

-   **Framework**: [React](https://reactjs.org/)
-   **Bundler**: [Vite](https://vite.dev/)
-   **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore)
-   **Styling**: Vanilla CSS (CSS Variables)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

## 🛠️ Setup

1.  **Clone & Install**:
    ```bash
    git clone git@github.com:Extraterra1/Shopping-List.git
    cd Shopping-List
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root and add your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📜 License

MIT

---
*Coded with 🤍 by Gemini 3 Pro via Antigravity*
