## FragmentJS (include + routing leggero)

**Autore:** Alessandro Giumentaro

### Cos'è
Fragment è una libreria JS leggera che:
- include frammenti HTML in pagina usando l'attributo `fragment`
- gestisce la navigazione client-side (URL + history)
- mostra/nasconde sezioni con classe `.fragment`
- invoca callback dinamiche per caricare dati in base alla pagina

La libreria è composta da due file:
- `fragment.config.js` (config e callback)
- `fragment.js` (motore di include + routing)

### Dipendenze
- jQuery (usa `$` e `jQuery.inArray`)
- Le funzioni globali usate in `fragment.config.js`:
  - `fragmentCallback(index)`
  - `setHeaderAction(index)`
  - opzionali: `window.loadLogtoUsers`, `window.loadLogtoUserByPath`,
    `window.loadLogtoApps`, `window.loadLogtoAppByPath`, `window.loadDashboardStats`,
    `window.bindAssocButtons`

### Come si include in `index.html`
Inserisci gli script nell'ordine corretto **dopo** jQuery:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script>
<script type="text/javascript" src="lib/js/fragment/fragment.config.js"></script>
<script type="text/javascript" src="lib/js/fragment/fragment.js"></script>
```

### Come si usa l'include
Per includere HTML dinamicamente:
```html
<section fragment="/sections/dashboard.html"></section>
```
Al caricamento, Fragment sostituisce l'elemento con il contenuto del file.
Se `debug = true`, appende un timestamp ai file inclusi per evitare cache.

### Routing e comportamento
Quando la pagina cambia:
- `FragmentJS.navigateTo(path, delay)` elabora l'URL
- aggiorna la history con `pushState`
- chiama `onNavigate(payload)` definita in `fragment.config.js`
- dopo `delay`:
  - nasconde tutte le `.fragment`
  - mostra solo le sezioni previste da `route.section`
  - sposta i nodi nel container `[data-fragment-slot]` se esiste, altrimenti `body`
  - scrolla in alto

Il listener `popstate` richiama `FragmentJS.navigateTo()` per supportare back/forward.

### Refresh API
`FragmentJS.refresh(delay = 0)` ricarica la route corrente senza cambiare URL.
Utile per forzare `onNavigate` e riallineare la UI dopo aggiornamenti dati.

### Configurazione centralizzata (fragment.config.js)
Definisci `window.FragmentJSConfig` con:
- `debug`: boolean per bypass cache include
- `fallbackRoute`: route di fallback (`'/'` di default, oppure `'/section-not-found'`)
- `menuItem`: lista dei percorsi gestiti per la nav
- `routes`: array di route con `path`, `section` (stringa o array), `menu` (per evidenziare la nav)
- `onNavigate(payload)`: hook per caricare dati o aggiornare UI
- `className`: classe delle sezioni (default: `fragment`)
- `slotSelector`: selector del container (default: `[data-fragment-slot]`)

Esempio minimale:
```js
window.FragmentJSConfig = {
  fallbackRoute: "/",
  menuItem: ["/", "/utenti"],
  routes: [
    { path: "/", section: "section-dashboard", menu: "/" },
    { path: "/utenti", section: "section-utenti", menu: "/utenti" },
    { path: "/utenti/:id", section: "section-dettaglio-utente", menu: "/utenti" },
  ],
  onNavigate: function (payload) {
    fragmentCallback(payload.menuIndex);
    setHeaderAction(payload.menuIndex);
  },
};
```

`payload` include: `route`, `params`, `path`, `query`, `hash`, `menuIndex`.

### Funzionamento in dettaglio
- **Include HTML**: `FragmentJS.loadIncludes()` cerca `[fragment]:not([data-included])` e fa fetch del file.
- **Caching**: se `debug = true`, aggiunge `?v=<timestamp>` agli include.
- **Routing**: `FragmentJS.parseRoutePath()` normalizza URL e estrae query/hash; le route supportano parametri tipo `:id`.
- **Sezioni**: ogni pagina mostra solo le sezioni associate all'indice corrente.

### Convenzioni consigliate
- Ogni sezione renderizzata deve avere classe `.fragment`.
- Ogni sezione deve avere un `id` unico corrispondente a `route.section`.
- Usa `data-fragment-slot` su un container se vuoi controllare dove vengono spostate le sezioni.

