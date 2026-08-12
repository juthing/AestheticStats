# Aesthetic Stats

Site statique qui affiche les statistiques de modération des reports du bot
Discord **Aesthetic Whale**. Next.js + shadcn/ui (preset `b1ZOwaIvg`), graphiques
Recharts via le composant `chart` de shadcn/ui.

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
```

## Les données

Tout est dans `stats/`. `stats/index.json` donne l'ordre d'affichage et la liste
des graphiques ; chaque autre fichier décrit un graphique et porte ses propres
données :

```jsonc
{
  "id": "reports_par_semaine",
  "title": "…",
  "description": "…",
  "chartType": "line",   // stats | line | bar | area | pie | radar
  "xKey": "semaine",     // clé de l'axe des catégories
  "series": [{ "key": "total", "label": "Reports", "color": "…" }],
  "layout": "vertical",  // optionnel, barres horizontales
  "stacked": true,       // optionnel, barres/aires empilées
  "data": [{ "semaine": "2025-31", "total": 2 }]
}
```

Le rendu est générique : `components/stat-chart.tsx` lit ces champs, aucun
graphique n'est codé en dur.

**Pour mettre à jour les stats** : remplacer les fichiers de `stats/`. Un
nouveau fichier doit être ajouté à `stats/index.json` **et** au registre de
`lib/stats.ts` (les JSON sont importés statiquement pour être inclus dans le
build). Un id présent dans l'index mais absent du registre est ignoré et
signalé en pied de page plutôt que de casser la page.

Les valeurs listées dans `EXCLUDED_VALUES` (`lib/stats.ts`) sont retirées de
tous les graphiques, séries et tableaux.

## Couleurs

Les 8 emplacements catégoriels `--chart-1` … `--chart-8` sont définis dans
`app/globals.css`, en version claire et sombre. Ils sont attribués dans l'ordre
et jamais recyclés : au-delà de 8 séries, les plus petites sont regroupées sous
« Autres » (cf. `resolveSeries` dans `lib/chart-utils.ts`). Les camemberts, qui
affichent toutes leurs parts, réutilisent les mêmes teintes éclaircies au-delà
de la 8e (`slotColor`), l'identité étant portée par la légende chiffrée.

## Logo

Le header utilise deux fichiers de `public/`, échangés par la variante `dark:` :

- `logo-light.png` — logo noir (`Sombre.png`), affiché en thème clair
- `logo-dark.png` — logo blanc (`Clair.png`), affiché en thème sombre

## Déploiement

Le site est statique : sur Vercel, importer le repo, aucun réglage particulier
(framework Next.js détecté automatiquement).
