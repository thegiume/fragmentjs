const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '..', 'public');

async function bootstrap() {
  const app = express();

  // Predisposizione auth: disattivata di default. Impostare ENABLE_AUTH=true per abilitarla.
  if (process.env.ENABLE_AUTH === 'true') {
    const { setupAuth } = require('./auth/auth');
    await setupAuth(app);
  }

  // Rotta principale: serve il file public/index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // File statici da /public
  app.use(express.static(publicPath));

  // Fallback SPA: serve index.html per le rotte client-side (es. /about)
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (path.extname(req.path)) {
      return next();
    }
    return res.sendFile(path.join(publicPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Errore in fase di avvio server', err);
  process.exit(1);
});
