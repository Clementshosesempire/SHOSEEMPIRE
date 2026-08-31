# Shoes Empire — Site & App

Site de vente de sneakers avec panier, fidélité, notifications, paiement
(WhatsApp / MTN MoMo / Moov Money / Celtiis Cash) et panneau admin intégré.
Installable comme app mobile (PWA).

## 1. Avant de mettre en ligne — à personnaliser

Ouvre `app.js` et modifie tout en haut du fichier :

```js
const ADMIN_PASSWORD = 'empire2026';        // ton mot de passe admin
const WHATSAPP_NUMBER = '22900000000';      // ton numéro WhatsApp (indicatif + numéro, sans le +)
const MOMO_NUMBER = '96 00 00 00';          // ton numéro MTN MoMo
const MOOV_NUMBER = '95 00 00 00';          // ton numéro Moov Money
const CELTIIS_NUMBER = '90 00 00 00';       // ton numéro Celtiis Cash
```

Ouvre aussi `index.html` et remplace le lien WhatsApp du pied de page
(`https://wa.me/22900000000`) et l'e-mail de contact par les tiens.

Les produits de départ sont des exemples. Une fois le site en ligne,
connecte-toi à l'espace admin (lien tout en bas de la page, ou
`tonsite.com/#admin`) pour les remplacer par tes vraies sneakers, photos
comprises (voir point 4).

## 2. Mise en ligne sur GitHub Pages (gratuit)

1. Crée un dépôt GitHub (ex : `shoes-empire`).
2. Mets-y ces 5 fichiers à la racine : `index.html`, `app.js`,
   `manifest.json`, `sw.js`, `icon.svg`.
3. Dans le dépôt : **Settings → Pages → Source : Deploy from a branch**,
   choisis la branche `main` et le dossier `/ (root)`, puis **Save**.
4. Après 1–2 minutes, ton site est en ligne à une adresse du type
   `https://tonpseudo.github.io/shoes-empire/`.

## 3. Installer comme application

Une fois en ligne (GitHub Pages fournit le HTTPS nécessaire), tes clients
peuvent :
- Sur Android/Chrome : ouvrir le site → une bannière "Installer l'app"
  apparaît automatiquement (ou menu ⋮ → "Installer l'application").
- Sur iPhone/Safari : ouvrir le site → bouton Partager → "Sur l'écran
  d'accueil".

## 4. Ajouter tes vraies photos de produits

Le site utilise actuellement une illustration générique (silhouette de
sneaker) à la place des photos, pour rester léger et fonctionner sans
connexion à un service externe. Pour utiliser tes vraies photos :

1. Héberge tes images (dans le même dépôt GitHub, dossier `images/`, ou
   via un service comme Cloudinary/Imgur).
2. Dans `app.js`, remplace les appels à `shoeSVG()` par une balise
   `<img src="images/ton-produit.jpg">` — dis-moi si tu veux que je fasse
   cette adaptation une fois tes photos prêtes, je peux m'en charger.

## 5. Comment fonctionne le panneau admin

- Accès : lien discret "Espace admin" en bas de page, ou aller directement
  sur `tonsite.com/#admin`.
- Tu peux : ajouter/modifier/supprimer un produit, gérer les codes promo,
  ajouter des avis clients, et voir des statistiques réelles (visites,
  ajouts au panier, commandes) mesurées sur l'appareil utilisé.
- **Important** : les données (produits, promos, avis) sont stockées dans
  le navigateur de la personne qui les modifie (localStorage). Si tu gères
  le site depuis ton téléphone ET ton ordinateur, les modifications ne se
  synchronisent pas automatiquement entre les deux. Pour une vraie base de
  données partagée (recommandé si tu geres le catalogue depuis plusieurs
  appareils), dis-le moi : on peut brancher une base de données gratuite
  (ex : Firebase) à cette même interface.
- Le mot de passe admin est visible dans le code source (`app.js`) — cela
  suffit à décourager un client curieux, mais ce n'est pas une sécurité de
  niveau bancaire. Ne l'utilise pas pour protéger des données sensibles.

## 6. Paiements mobiles

Le site ne débite pas automatiquement MTN MoMo / Moov Money / Celtiis Cash
(cela demanderait un compte marchand agréé auprès de chaque opérateur).
À la place, le client voit ton numéro à créditer puis confirme sa commande,
qui t'arrive automatiquement sur WhatsApp avec tous les détails (produits,
montant, mode de paiement choisi) pour que tu valides la réception du
paiement. C'est l'approche la plus simple et la plus fiable sans contrat
marchand.

## 7. Notifications & fidélité — comment ça marche

- **Fidélité** : chaque commande confirmée crédite des points (1 pt =
  1 FCFA dépensé), affichés sur la page et utilisables plus tard pour des
  réductions (paliers Bronze / Argent / Or, éditables dans `index.html`,
  section `#fidelite`).
- **Offre de bienvenue** : un code promo s'affiche automatiquement à la
  première visite d'un client (à condition qu'un code `BIENVENUE10` existe
  dans les codes promo admin).
- **Rareté honnête** : le badge "Plus que X en stock" utilise le vrai
  stock que tu renseignes en admin — pas un chiffre inventé.
- **Avis clients** : à ajouter toi-même en admin au fur et à mesure des
  retours réels reçus par WhatsApp.

## 8. Fichiers du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Structure et contenu du site |
| `app.js` | Toute la logique (catalogue, panier, admin, fidélité...) |
| `manifest.json` | Rend le site installable comme app |
| `sw.js` | Permet le fonctionnement hors-ligne basique |
| `icon.svg` | Icône de l'app |
