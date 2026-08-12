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
graphique n'est codé en dur. Quelques comportements dérivés des données :

- les aires passent en dégradé jusqu'à 4 séries, en aplat translucide au-delà ;
- les barres sur un axe `mois` / `semaine` restent horizontales, les autres
  basculent en barres couchées passé 12 catégories ;
- les courbes de plus de 2 séries reçoivent des boutons de sélection (toutes
  affichées par défaut) ;
- un axe hebdomadaire est libellé par mois, chaque libellé étant posé sur la
  semaine médiane du mois ; l'infobulle donne la semaine exacte
  (« Semaine du 10 août 2026 ») ;
- un champ `from` optionnel coupe le début d'une série (`"from": "2026-04"`
  ne garde que les semaines à partir de celle-là).

Chaque graphique n'est monté qu'en arrivant dans le champ de vision
(`components/in-view.tsx`), ce qui déclenche son animation d'apparition au
scroll ; la place est réservée d'avance par `chartHeight`, donc rien ne saute.
Sur mobile, un encart signale que la lecture est plus confortable sur grand
écran ; il se ferme et ne revient pas (`components/desktop-notice.tsx`).

**Pour mettre à jour les stats** : remplacer les fichiers de `stats/`. Un
nouveau fichier doit être ajouté à `stats/index.json` **et** au registre de
`lib/stats.ts` (les JSON sont importés statiquement pour être inclus dans le
build). Un id présent dans l'index mais absent du registre est ignoré et
signalé en pied de page plutôt que de casser la page.

Les valeurs listées dans `EXCLUDED_VALUES` (`lib/stats.ts`) sont retirées de
tous les graphiques, séries et tableaux.

## Couleurs

Les 8 emplacements catégoriels `--chart-1` … `--chart-8` sont définis dans
`app/globals.css`, en version claire et sombre. Les séries sont slugifiées en
`s0`, `s1`, … à l'affichage : shadcn/ui transforme chaque clé de `ChartConfig`
en propriété `--color-<clé>`, ce que des libellés accentués ne peuvent pas être.
Les marks référencent donc `var(--color-s0)` comme dans la doc. Un graphique à
série unique conserve la couleur demandée dans son JSON. Ils sont attribués dans l'ordre
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
