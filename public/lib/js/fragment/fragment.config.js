window.FragmentJSConfig = {
    debug: false,
    fallbackRoute: '/',
    menuItem: ['/', '/about', '/contatti'],
    routes: [
        { path: '/', section: 'section-home', menu: '/' },
        { path: '/about', section: 'section-about', menu: '/about' },
        { path: '/contatti', section: 'section-contatti', menu: '/contatti' }
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
