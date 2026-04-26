# AniList Manga Mobile (Angular + Capacitor)

Application mobile Angular qui reproduit les usages principaux d'AniList pour les mangas:
- onglet `Browse` pour voir les mangas tendance
- onglet `Recherche` pour chercher un manga
- onglet `Ma liste` pour afficher votre MangaList
- onglet `Compte` pour se connecter a AniList et stocker le token

Le projet n'utilise pas de framework CSS complexe (pas de Tailwind).

## Prerequis

- Node.js 20+
- npm 10+
- Android Studio (pour generer un APK)
- JDK 17 (recommande avec Angular/Capacitor recents)

## Installation

```bash
npm install
```

## Configuration AniList OAuth

1. Creez une application OAuth sur AniList.
2. Ouvrez le fichier `src/app/core/anilist-config.ts`.
3. Remplacez:
	- `oauthClientId` par votre vrai client id AniList
	- `oauthRedirectUriWeb` par l'URL de redirection web
	- `oauthRedirectUriNative` pour mobile (par defaut: `anilistmanga://auth/callback`)

Exemple local:
- `oauthRedirectUriWeb: 'http://localhost:4200'`

Configuration recommandee sur AniList:
- Redirect URI web: `http://localhost:4200`
- Redirect URI mobile: `anilistmanga://auth/callback`

Le bouton de connexion de l'onglet `Compte` utilise automatiquement:
- web: redirection navigateur classique
- mobile native (Capacitor): ouverture navigateur + retour auto dans l'app via deep link

## Lancer en developpement

```bash
npm start
```

## Build web

```bash
npm run build
```

## Generer l'APK Android

1. Build Angular:

```bash
npm run build
```

2. Synchroniser Capacitor:

```bash
npx cap sync android
```

Important: relancez `npx cap sync android` apres chaque changement de configuration plugin ou de deep link.

3. Ouvrir le projet Android:

```bash
npx cap open android
```

4. Dans Android Studio:
	- menu `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
	- recuperer le fichier APK genere

## Architecture

- `src/app/core`: services, guard, types, config API
- `src/app/features/layout`: shell mobile + onglets bas
- `src/app/features/browse`: mangas tendances
- `src/app/features/search`: recherche manga
- `src/app/features/my-list`: MangaList utilisateur
- `src/app/features/account`: connexion/token AniList

## Notes

- Les fonctionnalites `Ma liste` et `Ajouter` necessitent un token AniList valide.
- Le token est stocke en local (localStorage) sur l'appareil.
