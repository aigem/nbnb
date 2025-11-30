import { render } from 'preact';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

render(<App />, rootElement);

// Remove splash screen with a fade-out effect
const splashScreen = document.getElementById('app-loading');
if (splashScreen) {
  // Wait for the next frame to ensure the app has started rendering
  requestAnimationFrame(() => {
    splashScreen.style.opacity = '0';
    setTimeout(() => {
      splashScreen.remove();
    }, 300); // Match CSS transition duration
  });
}
