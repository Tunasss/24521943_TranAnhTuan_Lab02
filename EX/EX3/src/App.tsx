/**
 * @file App.tsx
 * @description Main application container mounting the DataFeed component.
 */

import { DataFeed } from './DataFeed';
import './App.css';

function App() {
  return (
    <main className="app-container">
      <header>
        <h1>Resilient State Machine &amp; Skeleton Loader</h1>
        <p>4-State Lifecycle with Skeleton Pulse Animation (WCAG 2.0 AA)</p>
      </header>

      <DataFeed />
    </main>
  );
}

export default App;
