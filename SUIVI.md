# Suivi — 5 octobre 2026

Au début de cette étape, le projet ne contenait que la lecture du classeur (scripts d'analyse, aucun schéma, aucune base, aucune interface). L'architecture Tauri n'existait pas encore : elle n'a pas été remplacée. La migration est un outil séparé, comme le cahier des charges le permet. La future application ouvrira le même fichier SQLite.

## 1. Ce qui est déjà implémenté

- Lecture du classeur réel, sans le modifier. Le 7 octobre 2026, le client a transmis `00 aa REPERTOIRE des DANSES 6.303 au 15-06-2026 Orig modifié.xlsx`. C'est cette version qui est importée. L'ancien fichier du Bureau n'a pas été écrasé.
- Copie intacte dans `SOURCE/`.
- Base `data/repertoire.db` (SQLite), identifiants stables, `created_at`, `updated_at`, `deleted_at` sur les tables métier.
- **363 812 cellules non vides** relues et comparées une à une : **0 perdue, 0 différente**. Une formule est présente : `A2546` vaut `=A2546:AA2546`. Elle est conservée comme formule et n'est pas copiée dans la fiche.
- 10 feuilles sur 10 ont une stratégie. 6427 fiches danse (une ligne Excel = une fiche).
- 132 répertoires, 4795 musiques, 3610 chorégraphes, 12941 liens, 220 révisions, 54 lignes Matt & Lucky, 3300 numéros historiques, 250 pays, 27 restaurants, 131 lignes d'annexes (Feuil1 et Feuil3).
- Matrice de toutes les colonnes : `docs/mapping-excel.md`.
- Rapport : `docs/rapport-migration.md`. Comparaison : `docs/comparaison.md`.
- Aucune colonne au statut « ignorée ».
- Les jetons `?`, `??`, `.` et `Inconnu` restent stockés, avec un sens séparé : renseigné, inconnu, incertain, technique, en-tête. Rien n'est classé « non applicable ».
- Les répétitions de danses, de musiques et de chorégraphes sont des propositions (1290), pas des fusions.
- Le numéro 986, présent deux fois, est signalé. Les deux fiches restent.
- Une sauvegarde est créée avant un nouvel import (`backups/`).
- Tests : classeur miniature (formule, doublon, `?`, `.`, lien, pas décimal) et classeur réel.

## 2. Ce qui manque

- L'application Windows (React, Tauri, écran d'accueil, fiches, recherche, administration).
- La modification, l'ajout, la suppression réversible et la modification de masse.
- L'export Excel, la restauration guidée, la page Maintenance, le diagnostic `Diagnostic.txt`.
- L'écran qui permet de fusionner ou de conserver une proposition.
- Le regroupement visuel de plusieurs colonnes d'un même club (la date Riverside et la colonne Riverside sont encore deux répertoires distincts).

## 3. Ce qui était mal interprété

Ces lectures ont été corrigées avant d'écrire la base. Elles ne sont plus appliquées.

- Effacer `?`, `.` ou `Inconnu` pour les remplacer par vide.
- Traiter la colonne PDF comme une URL. Ce sont des marques (`Fr`, `x`, `a`, `pp`…).
- Déclarer la feuille Numéro vide ou redondante avant comparaison.
- Réduire une cellule de répertoire (`x`, une date, `?`, un nombre, un texte) à « présent ».
- Fusionner deux chorégraphes parce que les noms se ressemblent.
- Considérer `48.1` comme non numérique. La valeur est gardée comme nombre et comme texte.
- Copier la formule `A2546` (`=A2546:AA2546`) dans le nom ou la date de la danse. Dans le fichier nettoyé, la formule est revenue. Elle est stockée à part. La fiche reste « Have I Told You ». Le détecteur est aussi testé sur un classeur miniature.

## 4. Données Excel encore incomplètement représentées

Elles sont dans `source_cells`. Leur sens métier n'est pas figé (194 colonnes au statut « à analyser »).

- 164 colonnes de la feuille principale : surtout les répertoires, plus les colonnes sans rôle confirmé (codes `R/O/V/X/S`, origines `Ok` / `Chin.`, colonnes de points, marqueurs `P` / `PP`, colonne finale `x`).
- La feuille Numéro : 1871 valeurs n'apparaissent pas sur une fiche danse. Aucun numéro de fiche ne manque dans cette feuille. Elle est conservée à part.
- Feuil3 : titres et artistes mélangés. Aucune ligne n'est versée d'office dans les musiques. Une suggestion est notée seulement quand le texte est identique à un titre ou un interprète déjà connu.
- Feuil1 : la note est dans les annexes. Son utilité reste ouverte.
- Restaurants : la ville de l'événement et l'autre lieu sont tous les deux gardés. Le nom du restaurant tiré de l'adresse est une suggestion.
- 190 lignes de danse citent un chorégraphe dont le texte exact correspond à plusieurs fiches du référentiel (par exemple deux lignes « Séverine Fillion (FR) »). Aucun lien n'est choisi. Le texte original reste sur la danse.
- Codes pays contradictoires conservés côte à côte : `UK` avec ISO3 `GBR` et `SCO`, `IR` avec `IRN` et `IRL`.

## 5. Risques de perte de données

- Comparaison actuelle : **0 cellule perdue**.
- Le risque restant est une étape ultérieure qui masquerait les colonnes « à analyser » ou fusionnerait des propositions sans confirmation.
- La protection est la table `source_cells` : chaque cellule non vide y est, avec son texte, son hyperlien et sa formule éventuelle.
- Le classeur du Bureau n'est ouvert qu'en lecture. Une copie est dans `SOURCE/`.

## 6. Corrections prioritaires

Déjà faites dans cette étape : conserver toutes les cellules, écrire la matrice, refuser la fusion automatique, garder les valeurs étranges, détecter les formules, accepter un nombre de pas décimal.

Ensuite, dans l'ordre :

1. Écran de fiche qui montre les champs compris et, dans « Informations héritées d'Excel », tout le reste de la ligne.
2. Recherche sur le nom, la musique, l'interprète, le chorégraphe, le numéro, le répertoire et les notes.
3. Application Tauri portable qui ouvre `data/repertoire.db` à côté de l'exécutable.
4. Export Excel et restauration, après sauvegarde.
5. Regroupement des colonnes d'un même club seulement quand le sens de chaque valeur est confirmé.

## 7. Fonctionnalités restantes

Gestion quotidienne (ajout, modification, corbeille, modification de masse), répertoires consultables, révisions, musiques, chorégraphes, restaurants, vérification des données avec ouverture des fiches concernées, fusion manuelle des propositions, sauvegarde / restauration, export, diagnostic, raccourcis clavier. La synchronisation entre deux PC reste hors V1 ; les identifiants stables sont en place pour plus tard.

## Vérification

```text
npm test
```

Le test miniature couvre la formule, le doublon, `?`, `.`, le lien et le pas `48.1`. Le test du classeur réel exige 0 cellule perdue, la ligne 2546 « Have I Told You » / Elizma Theron, et la conservation des 55 « The Sway (P) PG » et des noms `?`.
