# Matrice Excel → application

Chaque colonne a une destination. Le statut `a_analyser` signifie que la valeur est conservée et que son sens métier n'est pas encore figé. Aucune colonne n'est ignorée.

| Feuille | Colonne | En-tête | Remplies | Distinctes | Statut | Destination |
| --- | --- | --- | ---: | ---: | --- | --- |
| Code ISO | A |  | 249 | 248 | compris | pays.nom |
| Code ISO | B |  | 249 | 248 | compris | pays.iso2 |
| Code ISO | C |  | 249 | 248 | compris | pays.iso3 |
| Pays | A |  | 250 | 249 | compris | pays.nom ou nom_alternatif si le code existe déjà |
| Pays | B |  | 250 | 250 | compris | pays.iso2 |
| Pays | C |  | 250 | 250 | compris | pays.iso3 |
| Chorégraphes | A |  | 2765 | 2111 | compris | choregraphes.nom_court |
| Chorégraphes | B |  | 2781 | 2742 | compris | choregraphes.nom_complet |
| Chorégraphes | C |  | 2773 | 42 | compris | pays.nom (via le chorégraphe) |
| Chorégraphes | D |  | 2715 | 39 | compris | pays.iso2 (code conservé tel quel, y compris UK) |
| Chorégraphes | E |  | 2716 | 39 | compris | pays.iso3 |
| Chorégraphes | F |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Chorégraphes | G |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Chorégraphes | H |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | A | DATE  +/- 1ère x Vue | 6428 | 1434 | compris | dances.date_premiere_vue + date_premiere_vue_original |
| 6.079 au 05-04-2026 | B |  | 5538 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | C |  | 886 | 12 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | D |  | 886 | 544 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | E |  | 878 | 15 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | F | Lien Lonestar | 889 | 806 | compris | liens (type lonestar) si une URL existe ; texte original toujours dans source_cells |
| 6.079 au 05-04-2026 | G |  | 6394 | 3 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | H |  | 1188 | 3 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | I | CopperKnob Lien | 6035 | 3497 | compris | liens (type copperknob) si une URL existe ; texte original dans source_cells |
| 6.079 au 05-04-2026 | J |  | 6410 | 3 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | K |  | 6396 | 74 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | L | Lien YouTube | 6020 | 4499 | compris | liens (type youtube) si une URL existe ; texte original dans source_cells |
| 6.079 au 05-04-2026 | M |  | 6413 | 4 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | N | PDF en FR | 6410 | 9 | compris | dances.pdf_fr (texte original, pas une URL) |
| 6.079 au 05-04-2026 | O | ? | 85 | 8 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | P |  | 6418 | 6 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | Q | P | 1521 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | R | PP | 1523 | 4 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | S | Gr2 | 91 | 4 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | T | Gr1 | 753 | 4 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | U | Gro1 | 48 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | V | Type de danse | 1868 | 13 | compris | types_danse + dances.type_original |
| 6.079 au 05-04-2026 | W | DANSES (Suggérées) | 6428 | 4225 | compris | dances.nom (texte original, y compris ?) |
| 6.079 au 05-04-2026 | X |  | 114 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | Y |  | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | Z | CHANSONS | 6428 | 4164 | compris | musiques.titre + danse_musique ; titre original sur la danse |
| 6.079 au 05-04-2026 | AA | INTERPRÈTES | 6422 | 2197 | compris | musiques.interprete ; texte original sur la danse |
| 6.079 au 05-04-2026 | AB |  | 242 | 10 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | AC | PAS | 5908 | 69 | compris | dances.pas si le texte est un entier, sinon pas_original seul |
| 6.079 au 05-04-2026 | AD | MUR | 5890 | 8 | compris | dances.murs si le texte est un entier, sinon murs_original seul |
| 6.079 au 05-04-2026 | AE | TAG | 1403 | 567 | compris | dances.tag |
| 6.079 au 05-04-2026 | AF | RESTART | 1467 | 495 | compris | dances.restart |
| 6.079 au 05-04-2026 | AG | CHORÉGRAPHES | 5894 | 1758 | compris | dances.choregraphe_original ; lien vers choregraphes seulement si le texte est identique |
| 6.079 au 05-04-2026 | AH | DATE +/- Chorée | 5875 | 392 | compris | dances.date_choregraphie + original |
| 6.079 au 05-04-2026 | AI | NIVEAU | 5899 | 7 | compris | niveaux si la valeur est un niveau connu ; sinon niveau_original seul |
| 6.079 au 05-04-2026 | AJ | Type de danse | 1868 | 13 | doublon_verifie | source_cells uniquement. Le type métier est lu dans la colonne V. |
| 6.079 au 05-04-2026 | AK | GENRE de danse | 425 | 18 | compris | genres + dances.genre_original |
| 6.079 au 05-04-2026 | AL | VALSE | 99 | 2 | compris | dances.valse_original |
| 6.079 au 05-04-2026 | AM | N° | 1430 | 1429 | compris | dances.numero (texte, doublons conservés) |
| 6.079 au 05-04-2026 | AN | à Voir A | 10 | 3 | compris | dances.a_voir_original |
| 6.079 au 05-04-2026 | AO | DernièreRévision      Dates | 170 | 30 | compris | revisions si la cellule est une date ; texte original toujours conservé |
| 6.079 au 05-04-2026 | AP |  | 18 | 3 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | AQ | VIDEO | 143 | 2 | compris | dances.video_original |
| 6.079 au 05-04-2026 | AR | Vu ou Non Vu | 16 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | AS | Fléron Ezia Date 1x | 112 | 42 | a_analyser | repertoires « Fléron Ezia Date 1x » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AT | Fléron Ezia Date Dernière x | 541 | 102 | a_analyser | repertoires « Fléron Ezia Date Dernière x » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AU | Fléron Ezia | 860 | 3 | a_analyser | repertoires « Fléron Ezia » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AV | The American Dream Country Dancers | 4746 | 3 | a_analyser | repertoires « The American Dream Country Dancers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AW | Lonestar | 4526 | 3 | a_analyser | repertoires « Lonestar » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AX | Riverside DATE dernière fois VUE | 233 | 76 | a_analyser | repertoires « Riverside DATE dernière fois VUE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AY | Riverside Country Club | 4130 | 3 | a_analyser | repertoires « Riverside Country Club » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | AZ | Hotton CSA | 10 | 2 | a_analyser | repertoires « Hotton CSA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BA | NEW HERVE date | 83 | 21 | a_analyser | repertoires « NEW HERVE date » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BB | NEW HERVE | 3656 | 3 | a_analyser | repertoires « NEW HERVE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BC | Démo Ezia 01-10-23 | 16 | 15 | a_analyser | repertoires « Démo Ezia 01-10-23 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BD | DISON Vu le | 119 | 24 | a_analyser | repertoires « DISON Vu le » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BE | DISON Fenil | 324 | 3 | a_analyser | repertoires « DISON Fenil » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BF | Simply Dancers  DATE | 348 | 106 | a_analyser | repertoires « Simply Dancers DATE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BG | Simply Dancers | 4135 | 4 | a_analyser | repertoires « Simply Dancers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BH | Amical' Danse | 3821 | 3 | a_analyser | repertoires « Amical' Danse » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BI | Les Rebelle's | 3820 | 3 | a_analyser | repertoires « Les Rebelle's » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BJ | Will Bill | 80 | 74 | a_analyser | repertoires « Will Bill » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BK | Arizona | 3888 | 3 | a_analyser | repertoires « Arizona » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BL | Memphis Country Dancers | 191 | 3 | a_analyser | repertoires « Memphis Country Dancers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BM | Le Saloon | 3653 | 3 | a_analyser | repertoires « Le Saloon » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BN | Rochefort | 3782 | 3 | a_analyser | repertoires « Rochefort » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BO | WHITE WOLF | 3843 | 3 | a_analyser | repertoires « WHITE WOLF » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BP | Black Stallion | 3687 | 3 | a_analyser | repertoires « Black Stallion » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BQ | Les Vîs Bokets | 3762 | 3 | a_analyser | repertoires « Les Vîs Bokets » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BR | White Buffalo | 3950 | 3 | a_analyser | repertoires « White Buffalo » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BS | Addicted Country Dancers DATE | 262 | 121 | a_analyser | repertoires « Addicted Country Dancers DATE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BT | Addicted Country Dancers | 3940 | 3 | a_analyser | repertoires « Addicted Country Dancers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BU | The Addicted Country | 3603 | 3 | a_analyser | repertoires « The Addicted Country » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BV | Daisy Simons | 4197 | 7 | a_analyser | repertoires « Daisy Simons » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BW | JLD | 17 | 2 | a_analyser | repertoires « JLD » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BX | JUMPERKE Line Dancers | 4218 | 3 | a_analyser | repertoires « JUMPERKE Line Dancers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BY | NCD date apprise | 397 | 327 | a_analyser | repertoires « NCD date apprise » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | BZ | NCD | 156 | 3 | a_analyser | repertoires « NCD » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CA | NCD nl | 602 | 2 | a_analyser | repertoires « NCD nl » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CB | 24-04 | 60 | 2 | a_analyser | repertoires « 24-04 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CC | 13-06 | 63 | 2 | a_analyser | repertoires « 13-06 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CD | 11-07 | 66 | 2 | a_analyser | repertoires « 11-07 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CE | 12-09 | 33 | 3 | a_analyser | repertoires « 12-09 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CF |  | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | CG | CW Hampteau 8.9.2025 | 89 | 53 | a_analyser | repertoires « CW Hampteau 8.9.2025 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CH | CW | 109 | 3 | a_analyser | repertoires « CW » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CI | Country Wind | 4574 | 4 | a_analyser | repertoires « Country Wind » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CJ | Lucky Jordan playlist | 194 | 2 | a_analyser | repertoires « Lucky Jordan playlist » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CK | LJ | 164 | 5 | a_analyser | repertoires « LJ » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CL | Lucky Jordan Répertoire | 4462 | 3 | a_analyser | repertoires « Lucky Jordan Répertoire » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CM | LJ | 382 | 2 | a_analyser | repertoires « LJ » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CN | Matt Carson CD | 4337 | 55 | a_analyser | repertoires « Matt Carson CD » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CO | CARSON | 62 | 3 | a_analyser | repertoires « CARSON » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CP | Matt Carson | 175 | 2 | a_analyser | repertoires « Matt Carson » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CQ | Carin Care Playlist | 248 | 2 | a_analyser | repertoires « Carin Care Playlist » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CR | NUM | 34 | 31 | a_analyser | repertoires « NUM » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CS | CCare | 130 | 3 | a_analyser | repertoires « CCare » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CT | Carin Care | 508 | 2 | a_analyser | repertoires « Carin Care » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CU | TexasT | 86 | 4 | a_analyser | repertoires « TexasT » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CV | Texas Twixy | 2599 | 3 | a_analyser | repertoires « Texas Twixy » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CW | CDH | 45 | 3 | a_analyser | repertoires « CDH » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CX | Country Duo Highway | 4485 | 3 | a_analyser | repertoires « Country Duo Highway » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CY | WILMA | 22 | 4 | a_analyser | repertoires « WILMA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | CZ | WILMA | 2342 | 3 | a_analyser | repertoires « WILMA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DA | ELKE | 196 | 4 | a_analyser | repertoires « ELKE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DB | ELKE      The Jillaroo | 783 | 2 | a_analyser | repertoires « ELKE The Jillaroo » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DC | 16.8 | 67 | 40 | a_analyser | repertoires « 16.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DD | REGY | 192 | 4 | a_analyser | repertoires « REGY » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DE | REGY | 710 | 2 | a_analyser | repertoires « REGY » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DF | DTOAK | 110 | 3 | a_analyser | repertoires « DTOAK » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DG | DUO Two Of A Kind | 346 | 2 | a_analyser | repertoires « DUO Two Of A Kind » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DH | DRP N° 2025 | 683 | 414 | a_analyser | repertoires « DRP N° 2025 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DI | DRP | 212 | 3 | a_analyser | repertoires « DRP » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DJ | DUO RICKY PETRA | 3902 | 3 | a_analyser | repertoires « DUO RICKY PETRA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DK | DEX | 108 | 4 | a_analyser | repertoires « DEX » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DL | DEX DYLAN | 317 | 2 | a_analyser | repertoires « DEX DYLAN » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DM | Daddy | 67 | 3 | a_analyser | repertoires « Daddy » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DN | Daddy Redneck | 182 | 2 | a_analyser | repertoires « Daddy Redneck » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DO | C L | 64 | 3 | a_analyser | repertoires « C L » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DP | CONNY LEE  | 241 | 3 | a_analyser | repertoires « CONNY LEE » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DQ | TWCB | 68 | 4 | a_analyser | repertoires « TWCB » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DR | TIN WHEEL COUNTRY BAND 13.11.2019 | 4518 | 3 | a_analyser | repertoires « TIN WHEEL COUNTRY BAND 13.11.2019 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DS | 2.8 | 87 | 43 | a_analyser | repertoires « 2.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DT | M  P 2025 N° | 198 | 133 | a_analyser | repertoires « M P 2025 N° » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DU | MP | 109 | 4 | a_analyser | repertoires « MP » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DV | MISTER P. répertoire | 4514 | 3 | a_analyser | repertoires « MISTER P. répertoire » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DW | KRIS | 55 | 3 | a_analyser | repertoires « KRIS » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DX | Kris Robyan | 4424 | 3 | a_analyser | repertoires « Kris Robyan » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DY | McB | 146 | 3 | a_analyser | repertoires « McB » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | DZ | Mrs Mc Bright | 513 | 2 | a_analyser | repertoires « Mrs Mc Bright » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EA | 16.8 | 63 | 39 | a_analyser | repertoires « 16.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EB | TIM | 8 | 4 | a_analyser | repertoires « TIM » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EC | Tim Nash | 61 | 4 | a_analyser | repertoires « Tim Nash » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | ED | CF | 78 | 3 | a_analyser | repertoires « CF » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EE | COUNTRY FEVER | 4457 | 3 | a_analyser | repertoires « COUNTRY FEVER » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EF | 9.8 | 98 | 52 | a_analyser | repertoires « 9.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EG | BCB | 95 | 3 | a_analyser | repertoires « BCB » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EH | BOB'S  Country Band | 4803 | 3 | a_analyser | repertoires « BOB'S Country Band » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EI | TRB | 111 | 3 | a_analyser | repertoires « TRB » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EJ | TRB Travelin River Band | 4509 | 3 | a_analyser | repertoires « TRB Travelin River Band » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EK |  | 69 | 46 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | EL | LINKA | 35 | 4 | a_analyser | repertoires « LINKA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EM | LINKA Répert | 105 | 2 | a_analyser | repertoires « LINKA Répert » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EN | BBC | 146 | 3 | a_analyser | repertoires « BBC » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EO | BBC | 4613 | 3 | a_analyser | repertoires « BBC » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EP | 30.8 | 73 | 46 | a_analyser | repertoires « 30.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EQ | JS | 45 | 4 | a_analyser | repertoires « JS » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | ER | J&S | 144 | 3 | a_analyser | repertoires « J&S » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | ES | Sun | 23 | 3 | a_analyser | repertoires « Sun » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | ET | Sundie | 4305 | 3 | a_analyser | repertoires « Sundie » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EU | 15.8 | 62 | 43 | a_analyser | repertoires « 15.8 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EV | CCK | 16 | 4 | a_analyser | repertoires « CCK » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EW | The Cockroach  Killers | 4642 | 3 | a_analyser | repertoires « The Cockroach Killers » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EX | MIM | 33 | 3 | a_analyser | repertoires « MIM » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EY | Mimuzik Répertoire 2024 | 4535 | 3 | a_analyser | repertoires « Mimuzik Répertoire 2024 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | EZ | ASU | 37 | 3 | a_analyser | repertoires « ASU » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FA | ALL SHOOK UP | 4459 | 3 | a_analyser | repertoires « ALL SHOOK UP » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FB | Silver | 166 | 4 | a_analyser | repertoires « Silver » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FC | SILVER | 3900 | 3 | a_analyser | repertoires « SILVER » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FD | BACKW | 1 | 1 | a_analyser | repertoires « BACKW » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FE | BACK WEST 18.03.2023 Lux. | 4355 | 3 | a_analyser | repertoires « BACK WEST 18.03.2023 Lux. » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FF | KRYSTEN | 102 | 3 | a_analyser | repertoires « KRYSTEN » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FG | KRYSTEN HEATHER 28.02.26 | 4517 | 3 | a_analyser | repertoires « KRYSTEN HEATHER 28.02.26 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FH | 9.8.26 | 88 | 52 | a_analyser | repertoires « 9.8.26 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FI | MISS.LA | 2 | 2 | a_analyser | repertoires « MISS.LA » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FJ | Miss Lana | 4548 | 3 | a_analyser | repertoires « Miss Lana » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FK | SILVER | 1 | 1 | a_analyser | repertoires « SILVER » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FL | SILVER | 4365 | 4 | a_analyser | repertoires « SILVER » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FM | PATC | 25 | 3 | a_analyser | repertoires « PATC » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FN | PAT CALAHAN | 4386 | 4 | a_analyser | repertoires « PAT CALAHAN » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FO | TOLY | 1 | 1 | a_analyser | repertoires « TOLY » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FP | TOLY | 4747 | 4 | a_analyser | repertoires « TOLY » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FQ | ROUTE66 | 3 | 2 | a_analyser | repertoires « ROUTE66 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FR | Route 66 Marche 30.7.2022 | 4493 | 3 | a_analyser | repertoires « Route 66 Marche 30.7.2022 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FS | LIES | 1 | 1 | a_analyser | repertoires « LIES » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FT | LIES VAN GOETHEM | 4394 | 4 | a_analyser | repertoires « LIES VAN GOETHEM » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FU | Enerj | 56 | 2 | a_analyser | repertoires « Enerj » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FV | Enerj'Ane  | 4462 | 3 | a_analyser | repertoires « Enerj'Ane » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FW | NVR | 7 | 5 | a_analyser | repertoires « NVR » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FX | NVR Western City 21.01.24 | 32 | 25 | a_analyser | repertoires « NVR Western City 21.01.24 » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FY | TM | 92 | 4 | a_analyser | repertoires « TM » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | FZ | Tania & Marcel | 4674 | 4 | a_analyser | repertoires « Tania & Marcel » + danse_repertoire.valeur_originale |
| 6.079 au 05-04-2026 | GA | x | 4314 | 2 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GB |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GC |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GD |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GE |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GF |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GG |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GH |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GI |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GJ |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GK |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GL |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GM |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GN |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GO |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GP |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GQ |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GR |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GS |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GT |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GU |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GV |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GW |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GX |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GY |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | GZ |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HA |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HB |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HC |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HD |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HE |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HF |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HG |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HH |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HI |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HJ |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HK |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HL |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| 6.079 au 05-04-2026 | HM |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Révisions | A |  | 17 | 3 | compris | revisions.date_originale |
| Révisions | B |  | 9 | 9 | a_analyser | source_cells + revisions (colonne brute) |
| Révisions | C |  | 51 | 51 | compris | revisions.libelle_original ; danse liée seulement si le texte est identique à un seul nom |
| Révisions | D |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Révisions | E |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Révision Matt & Lucky | A |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Révision Matt & Lucky | B |  | 54 | 42 | a_analyser | matt_lucky_lignes.col_b |
| Révision Matt & Lucky | C |  | 54 | 41 | compris | matt_lucky_lignes.col_c ; lien danse seulement si correspondance exacte unique |
| Révision Matt & Lucky | D |  | 54 | 46 | compris | matt_lucky_lignes.col_d |
| Révision Matt & Lucky | E |  | 54 | 33 | compris | matt_lucky_lignes.col_e |
| Révision Matt & Lucky | F |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Révision Matt & Lucky | G |  | 54 | 54 | a_analyser | matt_lucky_lignes.col_g |
| Révision Matt & Lucky | H |  | 54 | 42 | a_analyser | matt_lucky_lignes.col_h |
| Numéro | A | N° | 3300 | 3299 | compris | numeros_historiques.valeur |
| Numéro | B | X | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | C | DATE | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | D | Type de danse | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | E |  | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | F | Lien VIDEO (Cliquez…) | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | G | DANSE(Suggérée) | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | H | MUSIQUE | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | I | INTERPRETE | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | J | Pas | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | K | Mur | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | L | TAG | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | M | RESTART | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | N | CHOREGRAPHE | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | O | NIVEAU | 1 | 1 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | P |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | Q |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | R |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | S |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | T |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | U |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | V |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | W |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Numéro | X |  | 0 | 0 | a_analyser | source_cells, affiché plus tard dans « Informations héritées d'Excel » |
| Resto-Aires d'autoroutes | A |  | 28 | 23 | compris | restaurants.evenement |
| Resto-Aires d'autoroutes | B |  | 28 | 24 | compris | restaurants.google_maps_url + hyperlien |
| Resto-Aires d'autoroutes | C |  | 28 | 25 | compris | restaurants.adresse_complete |
| Resto-Aires d'autoroutes | D |  | 28 | 19 | compris | restaurants.code_postal |
| Resto-Aires d'autoroutes | E |  | 28 | 19 | a_analyser | restaurants.ville |
| Resto-Aires d'autoroutes | F |  | 7 | 6 | a_analyser | restaurants.autre_lieu |
| Resto-Aires d'autoroutes | G |  | 16 | 14 | compris | restaurants.telephone |
| Feuil1 | A |  | 2 | 2 | a_analyser | annexes (Feuil1), visible plus tard dans l'administration |
| Feuil3 | A |  | 129 | 129 | a_analyser | annexes (Feuil3). Pas de fusion avec les musiques. |

## Colonnes encore à analyser

- Chorégraphes F — (sans en-tête) — Colonne de la feuille « choregraphes » non décrite à l'avance.
- Chorégraphes G — (sans en-tête) — Colonne de la feuille « choregraphes » non décrite à l'avance.
- Chorégraphes H — (sans en-tête) — Colonne de la feuille « choregraphes » non décrite à l'avance.
- 6.079 au 05-04-2026 B — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 C — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 D — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 E — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 G — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 H — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 J — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 K — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 M — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 O — ? — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 P — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 Q — P — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 R — PP — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 S — Gr2 — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 T — Gr1 — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 U — Gro1 — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 X — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 Y — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 AB — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 AP — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 AR — Vu ou Non Vu — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 AS — Fléron Ezia Date 1x — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AT — Fléron Ezia Date Dernière x — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AU — Fléron Ezia — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AV — The American Dream Country Dancers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AW — Lonestar — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AX — Riverside DATE dernière fois VUE — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AY — Riverside Country Club — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 AZ — Hotton CSA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BA — NEW HERVE date — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BB — NEW HERVE — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BC — Démo Ezia 01-10-23 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BD — DISON Vu le — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BE — DISON Fenil — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BF — Simply Dancers  DATE — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BG — Simply Dancers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BH — Amical' Danse — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BI — Les Rebelle's — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BJ — Will Bill — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BK — Arizona — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BL — Memphis Country Dancers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BM — Le Saloon — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BN — Rochefort — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BO — WHITE WOLF — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BP — Black Stallion — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BQ — Les Vîs Bokets — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BR — White Buffalo — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BS — Addicted Country Dancers DATE — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BT — Addicted Country Dancers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BU — The Addicted Country — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BV — Daisy Simons — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BW — JLD — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BX — JUMPERKE Line Dancers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BY — NCD date apprise — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 BZ — NCD — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CA — NCD nl — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CB — 24-04 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CC — 13-06 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CD — 11-07 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CE — 12-09 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CF — (sans en-tête) — En-tête vide dans la zone des répertoires. Valeurs conservées dans source_cells.
- 6.079 au 05-04-2026 CG — CW Hampteau 8.9.2025 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CH — CW — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CI — Country Wind — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CJ — Lucky Jordan playlist — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CK — LJ — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CL — Lucky Jordan Répertoire — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CM — LJ — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CN — Matt Carson CD — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CO — CARSON — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CP — Matt Carson — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CQ — Carin Care Playlist — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CR — NUM — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CS — CCare — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CT — Carin Care — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CU — TexasT — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CV — Texas Twixy — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CW — CDH — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CX — Country Duo Highway — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CY — WILMA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 CZ — WILMA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DA — ELKE — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DB — ELKE      The Jillaroo — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DC — 16.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DD — REGY — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DE — REGY — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DF — DTOAK — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DG — DUO Two Of A Kind — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DH — DRP N° 2025 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DI — DRP — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DJ — DUO RICKY PETRA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DK — DEX — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DL — DEX DYLAN — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DM — Daddy — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DN — Daddy Redneck — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DO — C L — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DP — CONNY LEE  — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DQ — TWCB — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DR — TIN WHEEL COUNTRY BAND 13.11.2019 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DS — 2.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DT — M  P 2025 N° — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DU — MP — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DV — MISTER P. répertoire — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DW — KRIS — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DX — Kris Robyan — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DY — McB — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 DZ — Mrs Mc Bright — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EA — 16.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EB — TIM — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EC — Tim Nash — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 ED — CF — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EE — COUNTRY FEVER — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EF — 9.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EG — BCB — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EH — BOB'S  Country Band — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EI — TRB — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EJ — TRB Travelin River Band — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EK — (sans en-tête) — En-tête vide dans la zone des répertoires. Valeurs conservées dans source_cells.
- 6.079 au 05-04-2026 EL — LINKA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EM — LINKA Répert — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EN — BBC — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EO — BBC — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EP — 30.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EQ — JS — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 ER — J&S — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 ES — Sun — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 ET — Sundie — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EU — 15.8 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EV — CCK — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EW — The Cockroach  Killers — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EX — MIM — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EY — Mimuzik Répertoire 2024 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 EZ — ASU — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FA — ALL SHOOK UP — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FB — Silver — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FC — SILVER — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FD — BACKW — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FE — BACK WEST 18.03.2023 Lux. — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FF — KRYSTEN — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FG — KRYSTEN HEATHER 28.02.26 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FH — 9.8.26 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FI — MISS.LA — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FJ — Miss Lana — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FK — SILVER — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FL — SILVER — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FM — PATC — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FN — PAT CALAHAN — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FO — TOLY — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FP — TOLY — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FQ — ROUTE66 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FR — Route 66 Marche 30.7.2022 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FS — LIES — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FT — LIES VAN GOETHEM — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FU — Enerj — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FV — Enerj'Ane  — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FW — NVR — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FX — NVR Western City 21.01.24 — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FY — TM — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 FZ — Tania & Marcel — Chaque valeur reste stockée (x, date, nombre, texte, ?, .). Elle n'est pas réduite à un simple « présent ».
- 6.079 au 05-04-2026 GA — x — En-tête « x » et valeur « x » très répétée. Conservé. Pas traité comme un club.
- 6.079 au 05-04-2026 GB — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GC — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GD — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GE — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GF — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GG — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GH — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GI — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GJ — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GK — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GL — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GM — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GN — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GO — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GP — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GQ — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GR — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GS — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GT — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GU — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GV — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GW — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GX — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GY — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 GZ — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HA — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HB — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HC — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HD — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HE — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HF — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HG — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HH — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HI — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HJ — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HK — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HL — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- 6.079 au 05-04-2026 HM — (sans en-tête) — Colonne de la feuille principale sans rôle métier confirmé.
- Révisions B — (sans en-tête) — Colonne peu remplie, sens non établi.
- Révisions D — (sans en-tête) — Colonne de la feuille « revisions » non décrite à l'avance.
- Révisions E — (sans en-tête) — Colonne de la feuille « revisions » non décrite à l'avance.
- Révision Matt & Lucky A — (sans en-tête) — Colonne de la feuille « matt » non décrite à l'avance.
- Révision Matt & Lucky B — (sans en-tête) — Numéro de ligne de la feuille. Sens métier non confirmé.
- Révision Matt & Lucky F — (sans en-tête) — Colonne de la feuille « matt » non décrite à l'avance.
- Révision Matt & Lucky G — (sans en-tête) — 
- Révision Matt & Lucky H — (sans en-tête) — 
- Numéro B — X — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro C — DATE — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro D — Type de danse — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro E — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro F — Lien VIDEO (Cliquez…) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro G — DANSE(Suggérée) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro H — MUSIQUE — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro I — INTERPRETE — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro J — Pas — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro K — Mur — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro L — TAG — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro M — RESTART — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro N — CHOREGRAPHE — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro O — NIVEAU — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro P — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro Q — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro R — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro S — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro T — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro U — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro V — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro W — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Numéro X — (sans en-tête) — Colonne du catalogue Numéro. Conservée pour comparaison, pas de suppression même si elle semble vide.
- Resto-Aires d'autoroutes E — (sans en-tête) — Parfois la ville de l'événement, pas celle du restaurant.
- Resto-Aires d'autoroutes F — (sans en-tête) — 
- Feuil1 A — (sans en-tête) — Utilité non établie. Texte conservé.
- Feuil3 A — (sans en-tête) — La colonne mélange des titres et des artistes. Aucun classement automatique.