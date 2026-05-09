// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (!localStorage.getItem("userId")) {
  const deviceId = "PL-" + Math.random().toString(36).slice(2, 12).toUpperCase();

  fetch("http://localhost:8080/api/user/register-device", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, language: "ko" }),
  })
    .then((r) => r.json())
    .then((data) => {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("deviceId", deviceId);
    })
    .catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)