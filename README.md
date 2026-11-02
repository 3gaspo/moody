# Moody

Moody permet de consigner son humeur quotidienne et des notes, de modifier les journées dans un calendrier et de consulter des statistiques par période. Les paramètres permettent de gérer les humeurs, leur couleur et le thème.

Application React et TypeScript construite avec Vite et Tailwind CSS. Le mode local utilise le stockage du navigateur ; Firebase est utilisé lorsqu’il est configuré.

## Développement

Installer avec `npm ci`, lancer avec `npm run dev`, vérifier les types avec `npm run lint` et produire les fichiers statiques avec `npm run build`.


## Interface partagée

L'application utilise le package privé versionné `@3gaspo/app-ui` pour ses composants, styles et formats communs. Son archive est incluse dans `vendor` : `npm ci` et `npm run build` fonctionnent avec ce dépôt seul.

`npm run check:ui` vérifie l'archive, le lockfile, les sources installées et les points d'entrée communs. Ce contrôle s'exécute aussi avant le build. Les sources du socle sont maintenues dans le dépôt indépendant `app-ui` ; les données, calculs, parcours et styles métier restent ici. Les formats de stockage et d'export ne sont pas modifiés par les conventions d'affichage.
