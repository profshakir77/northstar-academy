// Local development server: API on :4000 (Vite proxies /api to it).
import app from './app.js';

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
