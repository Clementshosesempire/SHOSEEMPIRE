/* ============================================================
   CONFIGURATION FIREBASE — Shoes Empire
   ============================================================
   Ce fichier permet de brancher une vraie base de données partagée,
   pour que l'espace admin se synchronise entre tous vos appareils
   (téléphone, ordinateur...).

   TANT QUE CE FICHIER EST VIDE (apiKey: ""), le site continue de
   fonctionner normalement avec un stockage local par appareil,
   exactement comme avant — rien n'est cassé si vous ne touchez à rien.

   Pour l'activer, suivez les étapes du README.md (section
   "Base de données partagée"), puis collez ici les valeurs données
   par Firebase :
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/* Email du compte admin créé dans Firebase Authentication.
   Laissez vide si vous n'utilisez pas encore Firebase. */
window.FIREBASE_ADMIN_EMAIL = "";
