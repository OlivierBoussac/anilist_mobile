import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./features/layout/tabs-layout').then((m) => m.TabsLayout),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'browse'
			},
			{
				path: 'browse',
				loadComponent: () => import('./features/browse/browse-page').then((m) => m.BrowsePage)
			},
			{
				path: 'search',
				loadComponent: () => import('./features/search/search-page').then((m) => m.SearchPage)
			},
			{
				path: 'my-list',
				canActivate: [authGuard],
				loadComponent: () => import('./features/my-list/my-list-page').then((m) => m.MyListPage)
			},
			{
				path: 'my-list/:entryId',
				canActivate: [authGuard],
				loadComponent: () => import('./features/my-list/my-list-entry-page').then((m) => m.MyListEntryPage)
			},
			{
				path: 'account',
				loadComponent: () => import('./features/account/account-page').then((m) => m.AccountPage)
			}
		]
	},
	{
		path: '**',
		redirectTo: '/browse'
	}
];
