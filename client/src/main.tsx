import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Capture impersonation one-time code from URL, exchange for access token, store in sessionStorage
async function exchangeImpersonationCode() {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('impersonationCode');
    if (code) {
      console.log('Impersonation code received, exchanging for token...');
      try {
        const res = await fetch('/api/impersonation/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          credentials: 'include',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        const { accessToken } = await res.json();
        sessionStorage.setItem('impersonationToken', accessToken);
        console.log('✅ Impersonation token stored successfully');
      } catch (error) {
        console.error('❌ Failed to exchange impersonation code:', error);
        // Best-effort; if exchange fails, ensure no stale token
        sessionStorage.removeItem('impersonationToken');
      } finally {
        url.searchParams.delete('impersonationCode');
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  } catch (e) {
    console.error('Error in impersonation code exchange:', e);
  }
}

// Wait for token exchange before rendering app
exchangeImpersonationCode().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
