$(document).ready(function() {
    // Quando il documento è pronto, se la modalità debug è attiva, aggiungi timestamp agli include
    if (FragmentJS.getConfig().debug) {
        bustIncludeCache();
    }
    // Includi HTML e aggiungi listener per il popstate
    loadIncludes();
    window.addEventListener('popstate', onHistoryPop);
});

const DEFAULT_CONFIG = {
    debug: false,
    routes: [],
    menuItem: [],
    onNavigate: () => {},
    className: 'fragment',
    slotSelector: '[data-fragment-slot]',
    fallbackRoute: '/',
};

const mergeConfig = () => ({
    ...DEFAULT_CONFIG,
    ...(window.FragmentJSConfig || {}),
});

const bustIncludeCache = () => {
    // Aggiungi un timestamp ai file HTML inclusi per evitare la cache
    $('section[fragment]').each(function() {
        const currentAttrValue = $(this).attr('fragment');
        $(this).attr('fragment', `${currentAttrValue}?v=${new Date().getTime()}`);
    });
};

const onHistoryPop = () => {
    // Gestisci il cambiamento di stato della cronologia
    navigateTo(window.location.pathname + window.location.search + window.location.hash, 100);
};

const loadIncludes = () => {
    // Includi i file HTML specificati negli attributi "fragment"
    const elements = document.querySelectorAll('[fragment]:not([data-included])');
    const totalCount = elements.length;
    if (totalCount === 0) {
        finalizeRoute();
        return;
    }
    let completedCount = 0;

    elements.forEach(function(elmnt) {
        const file = elmnt.getAttribute("fragment");
        if (file) {
            // Se il file esiste, fetch il contenuto e sostituisci l'elemento
            fetchInclude(file, elmnt, () => {
                completedCount++;
                if (completedCount === totalCount) {
                    finalizeRoute();
                }
            });
        } else {
            completedCount++;
            if (completedCount === totalCount) {
                finalizeRoute();
            }
        }
    });
};

const fetchInclude = (file, element, callback) => {
    // Fetch il file HTML e sostituisci l'elemento con il contenuto del file
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                try {
                    element.outerHTML = this.responseText;
                } catch (e) {
                    console.error("Errore durante l'elaborazione della risposta:", e);
                }
            } else if (this.status === 404) {
                console.error("Pagina non trovata.");
            }
            callback();
        }
    };
    xhttp.open("GET", file, true);
    xhttp.send();
};

const finalizeRoute = () => {
    // Finalizza il caricamento della pagina cambiando la pagina dopo un ritardo
    navigateTo(window.location.pathname + window.location.search + window.location.hash, 300);
};

const navigateTo = (path, delay) => {
    const config = FragmentJS.getConfig();
    const routes = Array.isArray(config.routes) ? config.routes : [];
    const menuItem = Array.isArray(config.menuItem) ? config.menuItem : [];
    const location = parseRoutePath(path);
    const match = matchRoute(location.pathname, routes);

    if (!match) {
        const fallbackTarget = config.fallbackRoute || '/';
        if (location.pathname !== fallbackTarget) {
            navigateTo(fallbackTarget, delay);
        }
        return;
    }

    const menuPath = match.route.menu || match.route.path;
    const menuIndex = menuItem.indexOf(menuPath);
    const sections = Array.isArray(match.route.section)
        ? match.route.section
        : [match.route.section].filter(Boolean);

    window.history.pushState({}, '', location.fullPath);

    if (typeof config.onNavigate === 'function') {
        config.onNavigate({
            route: match.route,
            params: match.params,
            path: location.pathname,
            query: location.query,
            hash: location.hash,
            menuIndex,
        });
    }

    setTimeout(function() {
        const target = $(config.slotSelector).length ? $(config.slotSelector) : $('body');
        $("." + config.className).addClass("hidden");
        sections.forEach((sectionId) => {
            $("#" + sectionId).removeClass("hidden");
            $("#" + sectionId).appendTo(target);
        });
        $("footer").appendTo(target);
        $("html, body").animate({ scrollTop: 0 }, 400);
    }, delay);
};

const refresh = (delay = 0) => {
    navigateTo(window.location.pathname + window.location.search + window.location.hash, delay);
};

const parseRoutePath = (rawPath) => {
    const url = new URL(rawPath || '/', window.location.origin);
    return {
        pathname: url.pathname || '/',
        query: Object.fromEntries(url.searchParams.entries()),
        hash: url.hash || '',
        fullPath: `${url.pathname}${url.search}${url.hash}`,
    };
};

const normalizePath = (path) => {
    const cleaned = path.replace(/\/+$/, '');
    return cleaned === '' ? '/' : cleaned;
};

const matchRoute = (pathname, routes) => {
    const current = normalizePath(pathname || '/');
    for (const route of routes) {
        const routePath = normalizePath(route.path || '');
        if (routePath === '/' && current === '/') {
            return { route, params: {} };
        }
        const routeParts = routePath.split('/').filter(Boolean);
        const pathParts = current.split('/').filter(Boolean);
        if (routeParts.length !== pathParts.length) {
            continue;
        }
        const params = {};
        let matched = true;
        for (let i = 0; i < routeParts.length; i += 1) {
            const routeSegment = routeParts[i];
            const pathSegment = pathParts[i];
            if (routeSegment.startsWith(':')) {
                params[routeSegment.slice(1)] = decodeURIComponent(pathSegment || '');
            } else if (routeSegment !== pathSegment) {
                matched = false;
                break;
            }
        }
        if (matched) {
            return { route, params };
        }
    }
    return null;
};

const fetchHtml = (url, callback) => {
    $.ajax({
        url: url,
        type: 'GET',
        success: function(data) {
            callback(data);
        },
        error: function() {
            console.error("Errore nel caricamento del file");
        }
    });
};

const fetchJson = (url, callback) => {
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            callback(data);
        },
        error: function(error) {
            console.log('Errore nel recupero dei dati: ', error);
        }
    });
};

const replaceAllLiteral = (inputString, searchString, replacementString) => {
    // Escape regexp special characters in searchString
    var escapedSearchString = searchString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return inputString.replace(new RegExp(escapedSearchString, 'g'), replacementString);
};

window.FragmentJS = {
    getConfig: () => mergeConfig(),
    navigateTo,
    refresh,
    loadIncludes,
    parseRoutePath,
    bustIncludeCache,
    fetchInclude,
    fetchHtml,
    fetchJson,
    replaceAllLiteral,
};
