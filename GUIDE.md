# Guide de passation – site Meublation

Ce guide est pour les nouveaux membres qui reprennent le site. Il est écrit pour des personnes sans compétences techniques.

## 1. Comment le site fonctionne

- Les fichiers du site sont dans ce dépôt GitHub.
- **GitHub Pages** les met en ligne. C'est gratuit.
- Les formulaires sont des **Google Forms**, reliés à un Google Sheet.
- La date des Open Days, les textes et les liens de réservation viennent d'un **Google Sheet** que le site lit tout seul.
- Le nom de domaine `meublation.com` est géré chez le registrar du domaine (à noter ici : voir section 6).

## 2. Modifier le site

### Option A : demander à Claude (recommandé)

1. Ouvrir le projet Claude de l'association.
2. Décrire le changement voulu (texte, image, nouvelle section, etc.).
3. Claude prépare la modification sur une **branche de brouillon** (nom conseillé : `brouillon`).
4. Claude montre le résultat. **Rien n'est en ligne à ce stade.**
5. Après un « oui » clair dans le chat, Claude publie la modification.

### Option B : modifier un fichier directement sur GitHub

1. Ouvrir le fichier dans le dépôt, puis cliquer sur le crayon.
2. Modifier, puis cliquer sur « Commit changes ».
3. Si vous êtes sur la branche `main`, la modification part en ligne.

## 3. Ce qui est en ligne, ce qui ne l'est pas

- La branche **`main`** est la version publiée. Tout ce qui y arrive est mis en ligne.
- La branche **`brouillon`** sert à préparer les changements. Rien n'y est visible sur le site.
- Pour publier un brouillon : ouvrir une « pull request » de `brouillon` vers `main`, puis cliquer sur « Merge ».

## 4. Changer les Open Days sans toucher au code

Tout se passe dans le Google Sheet des Open Days. Il suffit de modifier les cases :

| Case | Contenu |
|---|---|
| B1 | Date des prochains Open Days |
| B2 / C2 | Texte affiché (anglais / français) |
| B3 | Lien du créneau de dépôt |
| B4 | Lien du créneau de récupération |

Si une case de lien est vide, le bouton ouvre un e-mail vers l'association.

Le site lit une version publiée du Sheet au format CSV. Ne pas supprimer cette publication (Fichier → Partager → Publier sur le Web).

Lien CSV : *(à compléter : coller ici le lien une fois le site codé)*

## 5. Formulaires

- Les formulaires Store et Sell sont des Google Forms intégrés dans les pages.
- Ils sont reliés au Google Sheet de l'association (onglets `STO_import` et `SEL_IMPORT`).
- Les formulaires sont en anglais uniquement.

## 6. Nom de domaine et DNS

À compléter à la mise en ligne :

- Registrar (où le domaine est acheté) : *(à compléter)*
- Date de renouvellement : *(à compléter)*
- Compte qui gère le DNS : *(à compléter)*

Enregistrements DNS attendus pour GitHub Pages (source : documentation GitHub) :

- Quatre enregistrements `A` pour `@` : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Un `CNAME` pour `www` vers `<compte-github>.github.io`
- Ne pas supprimer l'enregistrement `TXT` de vérification Google ni les enregistrements `MX` (e-mails)

## 7. Mise en place initiale (une seule fois)

1. Créer le compte GitHub de l'association (ou une organisation gratuite).
2. Créer un dépôt **public** nommé `meublation-site`.
3. Envoyer les fichiers de ce dossier dans le dépôt (Add file → Upload files).
4. Dans Settings → Pages : choisir la branche `main` et le dossier racine `/`.
5. Vérifier le site sur `https://<compte>.github.io/meublation-site/`.
6. Plus tard : ajouter `meublation.com` dans Settings → Pages (Custom domain), puis configurer le DNS (section 6). La propagation peut prendre jusqu'à 24 h. Ensuite, cocher « Enforce HTTPS ».
7. Résilier WordPress en dernier, après avoir vérifié que le domaine n'est plus lié à l'ancien hébergeur.

## 8. Passation chaque année

- Ajouter les nouveaux membres comme collaborateurs du dépôt (Settings → Collaborators), ou leur donner accès à l'organisation.
- Mettre à jour les sections 6 et 4 de ce guide si quelque chose change.
- Retirer l'accès des anciens membres.

## 9. Règles de sécurité

- Le dépôt est public : jamais de mot de passe, de clé ou de données personnelles dedans.
- Ne pas mettre d'adresse e-mail personnelle dans le code. Utiliser l'adresse de l'association.
