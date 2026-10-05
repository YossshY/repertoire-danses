# Rapport de migration

Feuilles analysées : 10/10

## Feuilles

- **Code ISO** (iso, 257 lignes × 3 colonnes) — Pays et codes. Fusion avec la feuille Pays uniquement quand le code ISO2 est identique.
- **Pays** (pays, 252 lignes × 3 colonnes) — Pays et codes. Un nom différent pour le même ISO2 est gardé comme nom alternatif.
- **Chorégraphes** (choregraphes, 2799 lignes × 6 colonnes) — Référentiel. Une ligne = une personne ou un collectif, sans fusion par ressemblance.
- **6.079 au 05-04-2026** (main, 6435 lignes × 187 colonnes) — Source des danses. Une ligne de données = une fiche. Aucune fusion des noms répétés.
- **Révisions** (revisions, 70 lignes × 5 colonnes) — Historique / planning. Lien vers une danse seulement si le libellé correspond exactement à un seul nom.
- **Révision Matt & Lucky** (matt, 55 lignes × 8 colonnes) — Feuille conservée intégralement dans matt_lucky_lignes, en plus des cellules sources.
- **Numéro** (numero, 3302 lignes × 18 colonnes) — Historique de numéros conservé et comparé à la feuille principale. Rien n'est écarté avant cette comparaison.
- **Resto-Aires d'autoroutes** (resto, 30 lignes × 7 colonnes) — Module restaurants, séparé des danses. Textes originaux conservés.
- **Feuil1** (feuil1, 2 lignes × 1 colonnes) — Note conservée dans annexes. Utilité encore ouverte.
- **Feuil3** (feuil3, 129 lignes × 1 colonnes) — Lignes conservées dans annexes. Ni titre ni artiste imposé.

## Données importées

- Cellules sources : 363809
- Danses : 6427
- Chorégraphes : 3610
- Musiques : 4795
- Répertoires (une colonne = une entrée, valeurs d'origine conservées) : 132
- Liens : 12941
- Révisions : 220
- Lignes Matt & Lucky : 54
- Numéros historiques : 3300
- Pays : 250
- Restaurants : 27
- Annexes (Feuil1, Feuil3) : 131
- Propositions de rapprochement, sans fusion : 1290
- Anomalies : 197
- Formules : 0

## Sens des cellules

- renseigne : 342017
- incertain : 19210
- inconnu : 2186
- technique : 215
- en_tete : 181

## Comparaison feuille Numéro / feuille principale

- Valeurs de la feuille Numéro absentes des fiches : 1871
- Numéros de fiches absents de la feuille Numéro : 0
- Valeurs répétées dans la feuille Numéro : 986 (2)

La feuille Numéro est conservée. Elle n'est pas déclarée redondante.

## Comparaison Excel / base

- Cellules identiques : 363809
- Cellules différentes : 0
- Cellules perdues : 0
- Cellules en base sans équivalent relu : 0

Données perdues : 0
Colonnes en attente d'interprétation : 194
Colonnes marquées ignore : 0

Les jetons `?`, `??`, `.` et `Inconnu` restent dans les cellules sources. Ils ne sont pas effacés.
Les lignes au même nom de danse restent des fiches séparées.
Les chorégraphes proches sont proposés, pas fusionnés.