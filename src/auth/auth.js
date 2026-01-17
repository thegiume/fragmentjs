const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { setGlobalDispatcher, Agent } = require('undici');

require('dotenv').config({ path: path.join(__dirname, 'auth.env') });

// Aumenta il timeout di connessione HTTP (undici) a 20s
setGlobalDispatcher(
  new Agent({
    connect: {
      timeout: 20000,
    },
  })
);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const getLocalBaseUrl = () => {
  const port = process.env.LOGTO_LOCAL_PORT;
  return port ? `http://localhost:${port}` : null;
};
const resolveBaseUrl = (req) => {
  const localUrl = getLocalBaseUrl();
  const serverUrl = process.env.LOGTO_BASE_URL;
  if (req && LOCAL_HOSTS.has(req.hostname)) {
    return localUrl || serverUrl;
  }
  return serverUrl || localUrl;
};

// Config Logto base; il baseUrl viene risolto in base a server/locale.
const logtoConfigBase = {
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
};
const logtoConfig = {
  ...logtoConfigBase,
  baseUrl: resolveBaseUrl(),
};

const logtoModulePromise = import('@logto/express');
// Sceglie il nome da mostrare al frontend in ordine di priorita.
const pickDisplayName = (claims = {}) =>
  claims.username ||
  claims.preferred_username ||
  claims.name ||
  claims.email ||
  claims.sub ||
  'utente';

/**
 * Inizializza middleware e rotte di autenticazione Logto.
 * Restituisce withLogto per proteggere altre rotte.
 * @param {import('express').Express} app
 */
async function setupAuth(app) {
  const { handleAuthRoutes, withLogto } = await logtoModulePromise;
  const buildLogtoConfig = (req) => ({
    ...logtoConfigBase,
    baseUrl: resolveBaseUrl(req),
  });
  const withLogtoDynamic = (req, res, next) => withLogto(buildLogtoConfig(req))(req, res, next);

  // Cookie + sessione
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: 'auto',
      },
    })
  );

  // Rotte di autenticazione Logto (login, callback, logout)
  app.use((req, res, next) =>
    handleAuthRoutes(buildLogtoConfig(req), {
      callbackUri: '/logto/sign-in-callback',
      postLogoutRedirectUri: resolveBaseUrl(req),
    })(req, res, next)
  );

  // Endpoint di stato autenticazione per il frontend.
  // Esegue anche la verifica relationship su endpoint esterno e forza il logout se non autorizzato.
  app.get('/auth/state', withLogtoDynamic, async (req, res) => {
    const claims = req.user.claims || {};
    const isAuth = req.user.isAuthenticated;

    if (!isAuth) {
      return res.json({
        authenticated: false,
        displayName: null,
        sub: null,
      });
    }

    try {
      const username =
        claims.username || claims.preferred_username || claims.email || claims.sub || null;

      const baseUrl = resolveBaseUrl(req);
      const url = new URL('/relationship/check', baseUrl);
      url.searchParams.set('username', username || '');
      url.searchParams.set('app', logtoConfig.appId);

      const relRes = await fetch(url.toString(), { method: 'GET' });
      if (!relRes.ok) {
        throw new Error(`relationship check failed with status ${relRes.status}`);
      }
      const relData = await relRes.json();

      if (!relData.authorized) {
        const reason = relData.reason || 'relationship_not_found';
        console.warn(
          `Logout forzato via relationship route: reason=${reason} (user=${username}, appId=${logtoConfig.appId})`
        );
        req.session.destroy(() => {});
        return res.json({
          authenticated: false,
          forceLogout: true,
          reason,
        });
      }

      const isSuperuser = relData.role === 'superuser';
      if (isSuperuser) {
        console.info(
          `Accesso superuser (via route): utente=${username}, appId=${logtoConfig.appId}, bypass relationship`
        );
      }

      res.json({
        authenticated: true,
        sub: claims.sub,
        displayName: pickDisplayName(claims),
        claims,
        app: {
          endpoint: logtoConfig.endpoint,
          appId: logtoConfig.appId,
          baseUrl,
        },
        relationship: relData.role ? { role: relData.role } : null,
        superuser: isSuperuser,
      });
    } catch (err) {
      console.error('Errore verifica relationship, logout forzato', err);
      req.session.destroy(() => {});
      res.json({
        authenticated: false,
        forceLogout: true,
        reason: 'relationship_error',
      });
    }
  });

  return { withLogto };
}

module.exports = {
  logtoConfig,
  setupAuth,
  pickDisplayName,
};
