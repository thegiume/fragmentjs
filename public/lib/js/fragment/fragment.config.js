window.FragmentJSConfig = {
    debug: false,
    fallbackRoute: '/',
    menuItem: ['/', '/guida', '/api', '/architettura', '/esempi'],
    routes: [
        { path: '/', section: 'section-overview', menu: '/' },
        { path: '/guida', section: 'section-guide', menu: '/guida' },
        { path: '/api', section: 'section-api', menu: '/api' },
        { path: '/architettura', section: 'section-architecture', menu: '/architettura' },
        { path: '/esempi', section: 'section-examples', menu: '/esempi' }
    ],
    onNavigate: function (payload) {
        if (typeof window.fragmentCallback === 'function') {
            window.fragmentCallback(payload.menuIndex);
        }
        if (typeof window.setHeaderAction === 'function') {
            window.setHeaderAction(payload.menuIndex);
        }
    }
};
