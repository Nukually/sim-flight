import './style.css';
import { GameApp } from './app/GameApp';

const mount = document.querySelector<HTMLDivElement>('#app');

if (!mount) {
  throw new Error('Missing #app mount node');
}

const app = new GameApp(mount);
app.start();
