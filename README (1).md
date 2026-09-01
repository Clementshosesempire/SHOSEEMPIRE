# Shoes Empire — Site & App

Site + application (PWA) de vente de sneakers à Cotonou : catalogue, panier,
paiement (WhatsApp / MTN MoMo / Moov Money / Celtiis Cash), nouveautés en
avant-première (Commander ou Réserver), programme de fidélité Empire Club,
notifications, liste d'envies, mini-quiz de recommandation, et espace admin
intégré.

## 🚀 Mettre en ligne en 3 minutes

### Option A — GitHub Pages (recommandé, gratuit, avec ce dépôt)

1. Crée un nouveau dépôt sur GitHub (ex. `shoes-empire`) et mets-y tous les
   fichiers de ce dossier (glisser-déposer sur github.com, ou `git push`).
2. Va dans **Settings → Pages** de ton dépôt.
3. Sous **Build and deployment**, choisis **Source : GitHub Actions**.
4. C'est tout — le fichier `.github/workflows/deploy.yml` déjà inclus dans
   ce projet déploie automatiquement le site à chaque mise à jour. Après
   1-2 minutes, ton site est en ligne à une adresse du type
   `https://tonpseudo.github.io/shoes-empire/`.
5. Pour toute future modification : remplace les fichiers dans le dépôt
   (ou fais un `git push`), le site se met à jour tout seul.

### Option B — Netlify (glisser-déposer, sans compte GitHub)

1. Va sur https://app.netlify.com/drop
2. Glisse tout ce dossier
3. Ton site est en ligne immédiatement, avec HTTPS automatique (nécessaire
   pour que l'app soit installable).

### Option C — Vercel

1. Va sur https://vercel.com/new
2. Importe ce dossier ou connecte ton dépôt GitHub
3. Laisse les réglages par défaut (site statique) et déploie.

## 🛠 Avant la mise en ligne — à personnaliser

Ouvre `app.js`, tout en haut du fichier, section `DEFAULT_SETTINGS` (utilisée
uniquement si vous n'avez pas encore connecté Firebase — voir plus bas) :

```js
const DEFAULT_SETTINGS = {
  adminPassword:"empire2026",   // ton mot de passe admin en mode local (à changer !)
  wa:"22942924984",             // ton numéro WhatsApp, indicatif inclus, sans le +
  momo:"96 00 00 00",           // ton numéro MTN MoMo
  moov:"95 00 00 00",           // ton numéro Moov Money
  celtiis:"90 00 00 00",        // ton numéro Celtiis Cash
};
```

Une fois en ligne, tout le reste (produits, prix, stocks, offres, cadeau de
bienvenue, mot de passe) se modifie directement depuis l'espace admin du
site — pas besoin de retoucher le code à chaque fois.

## 📱 Installer comme application

Une fois en ligne en HTTPS (GitHub Pages, Netlify et Vercel le fournissent
automatiquement) :
- **Android / Chrome** : une bannière "Installer" apparaît automatiquement.
- **iPhone / Safari** : bouton Partager → "Sur l'écran d'accueil".

## 🔐 Espace admin

Accessible via le lien discret en bas de page, ou directement à
`tonsite.com/#admin`.

- **Produits** : ajouter, supprimer, marquer "Nouveauté".
- **Marketing** : texte et date de fin de l'offre en cours (compte à rebours
  réel), message du cadeau de bienvenue.
- **Avis** : ajouter les retours clients reçus sur WhatsApp.
- **Réglages** : numéros de paiement, mot de passe admin.
- **Statistiques** : visites, ajouts au panier, commandes — mesurées sur
  l'appareil utilisé.

⚠️ Les données modifiées en admin sont stockées dans le navigateur de
l'appareil utilisé (localStorage). Si vous gérez le site depuis plusieurs
appareils, les changements ne se synchronisent pas automatiquement entre
eux — dites-le-moi si vous voulez une base de données partagée (ex.
Firebase, gratuit).

## 🧠 Choix de conception — mécaniques de vente honnêtes

Ce site s'appuie sur des principes de persuasion éprouvés (réciprocité,
preuve sociale, rareté, appartenance, engagement progressif), mais
uniquement sur des bases réelles :
- Le stock affiché ("Plus que X en stock") est le vrai stock renseigné en
  admin — jamais un chiffre inventé.
- Le compte à rebours de l'offre est basé sur une vraie date de fin que
  vous choisissez — il ne se réinitialise pas artificiellement.
- Les notifications ne montrent que de vrais évènements (bienvenue,
  confirmation de commande, retour en stock d'un article de votre liste) —
  aucune fausse activité client n'est fabriquée.
- Les avis affichés sont ceux que vous ajoutez vous-même à partir de
  retours clients réels.

## 🗄️ Base de données partagée (pour gérer l'admin depuis plusieurs appareils)

Par défaut, les données que vous modifiez en admin (produits, avis, offres,
réglages) sont stockées **dans le navigateur de l'appareil utilisé**. Si
vous gérez le site uniquement depuis un seul téléphone ou ordinateur,
vous n'avez rien à faire de plus.

Si vous voulez gérer le site **depuis plusieurs appareils** (ex. téléphone
ET ordinateur) avec les mêmes données partout et en temps réel, connectez
une base de données Firebase — gratuite pour ce volume d'utilisation.

### Étapes (15 minutes, une seule fois)

1. **Créer le projet** : allez sur https://console.firebase.google.com,
   cliquez sur "Ajouter un projet", donnez-lui un nom (ex.
   `shoes-empire`), continuez avec les options par défaut.

2. **Activer Firestore** (la base de données) : dans le menu de gauche,
   allez dans **Build → Firestore Database → Créer une base de données**.
   Choisissez "Mode production", puis la région la plus proche (ex.
   `eur3` ou `europe-west`).

3. **Activer l'authentification admin** : menu **Build → Authentication →
   Get started**. Activez le fournisseur **Email/Password**. Puis onglet
   **Users → Add user** : créez votre compte admin (votre email +
   un mot de passe solide). C'est ce compte qui vous servira à vous
   connecter à l'espace admin du site.

4. **Récupérer la configuration** : dans les paramètres du projet
   (icône ⚙️ → **Paramètres du projet**), section "Vos applications",
   cliquez sur l'icône `</>` (Web), donnez un nom, puis copiez l'objet
   `firebaseConfig` qui s'affiche.

5. **Coller la configuration** : ouvrez le fichier `firebase-config.js`
   de ce projet et remplacez les valeurs vides par celles copiées :

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "shoes-empire-xxxx.firebaseapp.com",
     projectId: "shoes-empire-xxxx",
     storageBucket: "shoes-empire-xxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   window.FIREBASE_ADMIN_EMAIL = "votre-email@exemple.com";
   ```

6. **Sécuriser la base** : dans Firestore, onglet **Règles**, remplacez
   le contenu par :

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{id} { allow read: if true; allow write: if request.auth != null; }
       match /reviews/{id}  { allow read: if true; allow write: if request.auth != null; }
       match /config/settings  { allow read: if true; allow write: if request.auth != null; }
       match /config/marketing { allow read: if true; allow write: if request.auth != null; }
       match /config/stats     { allow read: if true; allow write: if true; }
     }
   }
   ```

   Cela veut dire : tout le monde peut *lire* le catalogue (nécessaire
   pour que le site s'affiche), mais seul un compte connecté (vous, via
   l'espace admin) peut le *modifier*. Le compteur de statistiques reste
   ouvert en écriture pour compter les visites de chaque visiteur — c'est
   sans risque, ce ne sont que des chiffres.

7. **Redéployez** le site (ou mettez simplement à jour `firebase-config.js`
   si le site est déjà en ligne). Rouvrez `#admin` : vous verrez un champ
   email en plus du mot de passe, et un badge **🟢 Synchronisé** en haut.
   Connectez-vous avec l'email et le mot de passe créés à l'étape 3.

À partir de là, tout produit, avis ou réglage modifié depuis un appareil
apparaît instantanément sur tous les autres.

⚠️ Le plan gratuit de Firebase ("Spark") couvre largement les besoins
d'une boutique comme celle-ci (des dizaines de milliers de lectures par
jour gratuites). Pas de carte bancaire requise pour ce plan.



| Fichier | Rôle |
|---|---|
| `index.html` | Structure et contenu du site |
| `app.js` | Toute la logique (catalogue, panier, admin, fidélité, notifications, quiz, synchronisation...) |
| `firebase-config.js` | Le seul fichier à modifier pour activer la base de données partagée (voir section ci-dessus) |
| `manifest.json` | Rend le site installable comme app (PWA) |
| `sw.js` | Fonctionnement hors-ligne basique |
| `icon.svg` | Icône de l'app |
| `images/` | Photos produits |
| `.github/workflows/deploy.yml` | Déploiement automatique sur GitHub Pages |
| `.nojekyll` | Empêche GitHub de traiter le site comme un projet Jekyll |
