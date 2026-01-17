## auth.js (Logto + relationship)

### Scopo
`src/auth/auth.js` espone `setupAuth(app)` per inizializzare:
- cookie + sessione Express
- rotte Logto (login/callback/logout)
- endpoint `/auth/state` con verifica relationship esterna

Restituisce `{ withLogto }` per proteggere altre rotte.

### Dipendenze
- `express`, `express-session`, `cookie-parser`
- `@logto/express`
- Node 18+ (per `fetch`) oppure polyfill

### Variabili d'ambiente
File dedicato: `src/auth/auth.env`

Obbligatorie:
- `LOGTO_ENDPOINT`
- `LOGTO_APP_ID`
- `LOGTO_APP_SECRET`
- `LOGTO_BASE_URL`
- `LOGTO_LOCAL_PORT`
- `SESSION_SECRET`

Suggerimento per l'altra IA: prima dell'uso verifica che queste env esistano nel file dedicato e, se mancano, aggiungile/definiscile.

Nota: se la richiesta arriva da `localhost`/`127.0.0.1` allora il baseUrl è
`http://localhost:LOGTO_LOCAL_PORT`. In tutti gli altri casi usa `LOGTO_BASE_URL`.
`LOGTO_BASE_URL` viene usato anche per la verifica relationship.
Se non importi `relationship.js` nel nuovo progetto, imposta:
`LOGTO_BASE_URL=https://admin.auth.webnova.it`

### Uso minimo
```js
const express = require('express');
const { setupAuth, logtoConfig } = require('./src/auth/auth');

async function main() {
  const app = express();
  const { withLogto } = await setupAuth(app);

  app.get('/protected', withLogto(logtoConfig), (req, res) => {
    if (!req.user.isAuthenticated) return res.status(401).send('Non autenticato');
    res.send(`Ciao ${req.user.claims?.sub || 'utente'}`);
  });

  app.listen(3000);
}

main().catch(console.error);
```

### Endpoint creati
- `/logto/sign-in` (GET)
- `/logto/sign-in-callback` (GET)
- `/logto/sign-out` (GET)
- `/auth/state` (GET, protetto)

`/auth/state`:
- restituisce lo stato auth e i claims
- chiama `GET /relationship/check` sull'endpoint esterno
- se non autorizzato o errore, forza logout (distrugge sessione)

### Note operative
- Cookie: `httpOnly: true`, `sameSite: 'lax'`, `secure: 'auto'` (usa HTTPS quando la richiesta è sicura).
- Se usi un reverse proxy HTTPS, valuta `app.set('trust proxy', 1)` per il rilevamento corretto.
