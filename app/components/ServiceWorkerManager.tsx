'use client';

import { useEffect } from 'react';

export default function ServiceWorkerManager() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                if (registrations.length > 0) {
                    Promise.all(registrations.map(r => r.unregister())).then(() => {
                        console.log('Unregistered all service workers. Reloading...');
                        window.location.reload();
                    });
                }
            });
        }
    }, []);

    return null;
}
