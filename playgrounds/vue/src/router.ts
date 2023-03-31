import { createRouter, createWebHistory } from 'vue-router';

import collection from './pages/collection.vue';
import home from './pages/home.vue';

const routes = [
    {
        path: '/:collection',
        component: collection,
    },
    {
        path: '/',
        component: home,
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
