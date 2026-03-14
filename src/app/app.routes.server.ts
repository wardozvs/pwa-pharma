import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'splash',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'add-medicine',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'medicine-list',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'medicines/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      return [];  // Dynamic routes will be server-rendered on demand
    }
  },
  {
    path: 'medicines/:id/edit',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      return [];  // Dynamic routes will be server-rendered on demand
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
