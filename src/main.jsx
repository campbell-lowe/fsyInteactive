import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">FSY Interactive</p>
      <h1>Your Body Is Sacred</h1>
      <p className="intro">
        Explore this month&apos;s gospel learning module through scripture,
        discussion, and collaborative activities.
      </p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
