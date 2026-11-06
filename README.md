# Moody

Moody consigne une humeur et une note par journée. Il propose un calendrier éditable et des statistiques de répartition des humeurs.

Le nom affiché dans l’application, les favoris et les métadonnées d’installation web est **Moody** ; le nom technique npm est `moody`. Le manifeste est dans `public/manifest.json`, l’icône de l’application dans `public/moody.svg` et le logo des paramètres dans `public/gaspo_logo.svg`.

Les icônes utilisent un canevas de 512 × 512, un fond noir opaque et des formes gris-blanc `#D9D9D9`. Les PNG `public/moody-192.png` et `moody-512.png` sont les exports standard ; `moody-maskable-512.png` (Android) et `moody-apple-touch-icon.png` (Apple, 180 × 180) appliquent la même marge de 10 % par côté, avec un symbole à 80 % de sa taille d’origine. Ils dérivent du SVG et sont référencés par le manifeste et les métadonnées Apple. Après modification du SVG, régénérer ces exports.

## Fonctionnalités

- Enregistrement de l’humeur du jour en appuyant sur sa couleur ; modification ou effacement de cette sélection.
- Palette compacte de trois colonnes sur l’accueil et bandeau indiquant l’humeur choisie.
- Note quotidienne, enregistrée à la perte du focus ou avec la commande Save lorsqu’elle est modifiée.
- Calendrier mensuel permettant de consulter, modifier ou supprimer une entrée passée.
- Humeurs majoritaires de la semaine, du mois et de l’année ; histogrammes par période avec modes Current et Average.
- Ajout, modification et suppression d’humeurs et de leurs couleurs dans les paramètres ; export CSV des journées et notes.
- Thèmes clair et sombre persistants, restauration des humeurs par défaut, effacement de l’historique ou réinitialisation complète.

## Écrans

| URL | Écran |
| --- | --- |
| `/home` | Home : humeur et note du jour |
| `/calendar` | Calendar : historique et édition des journées |
| `/statistics` | Statistics |
| `/settings` | Settings : humeurs, thème, compte, export et réinitialisations |

La racine `/` redirige vers l’accueil. La connexion s’affiche lorsqu’aucune session n’est active. Les écrans secondaires sont chargés à la demande.

## Stack et organisation

React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, React Router, Lucide et Firebase Authentication / Firestore.

- [src/pages/](src/pages/) : écrans de l’application.
- [src/providers/Providers.tsx](src/providers/Providers.tsx) : authentification, données locales/Firebase et mutations.
- [src/lib/firebase.ts](src/lib/firebase.ts) : initialisation de Firebase.
- [src/components/AddMoodDialog.tsx](src/components/AddMoodDialog.tsx) : ajout d’une humeur.
- [src/styles/home.css](src/styles/home.css) : palette et bandeau compacts propres à Moody.
- [src/styles/](src/styles/) : imports des styles partagés et styles propres à l’application.

## Installation

Environnement de référence : Node.js 24 et npm. Exécuter les commandes depuis ce dépôt.

```bash
npm ci
npm run dev
```

Le serveur de développement écoute sur le port 3000. Ouvrir `http://localhost:3000`.

## Configuration et données

Sans configuration Firebase complète et initialisée, Moody utilise le stockage local et crée une session de développement au premier lancement. Avec Firebase, les journées et paramètres sont rattachés au compte connecté.

Le mode local conserve ses données dans le `localStorage` du navigateur, sans synchronisation entre appareils. Sa session de développement n’est pas une authentification distante. Changer de mode de stockage ne transfère pas automatiquement ces données.

Pour utiliser Firebase, copier [.env.example](.env.example) vers `.env.local` et renseigner la configuration de l’application web :

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Activer l’authentification email/mot de passe et Firestore dans le projet Firebase concerné. Ces variables sont lues par Vite au démarrage et lors du build : redémarrer le serveur ou reconstruire après une modification. Conserver les fichiers d’environnement locaux hors Git.

## Commandes et validation

| Commande | Rôle |
| --- | --- |
| `npm ci` | Installer les versions du lockfile, y compris l’archive UI locale |
| `npm run dev` | Lancer le serveur de développement sur le port 3000 |
| `npm run lint` | Vérifier les types avec `tsc --noEmit` |
| `npm run check:ui` | Vérifier l’archive UI, son empreinte, le lockfile et les réexports |
| `npm run build` | Exécuter `prebuild` puis générer le site statique dans `dist/` |
| `npm run preview` | Prévisualiser le dernier build localement |

Aucun script `npm test` n’est défini actuellement ; les contrôles disponibles sont le typage, la vérification du package UI et le build.

## Saisie quotidienne

Une date possède au plus une entrée, contenant l’humeur choisie et sa note. Effacer l’humeur depuis l’accueil conserve la note ; supprimer l’entrée dans le calendrier enlève la journée enregistrée. L’accueil n’a pas de bouton « + » : les humeurs se gèrent dans les paramètres.

Les palettes importantes et les notes restent accessibles par défilement. Les humeurs et leurs couleurs sont conservées dans les deux modes de stockage.

## Interface partagée

L’application utilise `@3gaspo/app-ui`, actuellement en version 0.1.8, pour la navigation, les titres, dialogues, formulaires, commandes, retours d’état et formats visibles. L’interface utilise Inter et des thèmes clair et sombre communs. Les dates affichées utilisent `en-GB` et les heures le format 24 h ; les formats de stockage et d’export restent propres à l’application.

L’archive est incluse dans [vendor/](vendor/) et référencée par `package.json` et `package-lock.json`. Ce dépôt est installable et déployable seul : aucun accès au dépôt source voisin `app-ui` ni à un registre privé n’est nécessaire. Relancer `npm ci` après un pull qui change les dépendances. La vérification du package partagé s’exécute automatiquement avant le build.

## Déploiement

Le site statique est servi par Firebase Hosting depuis `dist/`. [firebase.json](firebase.json) redirige les routes de l’application vers `index.html` et déclare aussi les règles et index Firestore.

Après avoir authentifié la CLI Firebase et sélectionné le bon projet :

```bash
git pull
npm ci
npm run build
firebase deploy --only hosting
```

Ajouter `--project ID_DU_PROJET` si aucun projet n’est sélectionné. Un `firebase deploy` sans restriction peut aussi publier les règles et index Firestore déclarés. Un retour à une version conservée dans l’historique Firebase Hosting restaure le site, pas les données.
