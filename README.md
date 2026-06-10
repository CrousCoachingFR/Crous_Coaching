# Crous_Coaching — Site coaching musculation

Site éditorial + plateforme client pour un coach musculation. Direction artistique
type magazine de strength sport : Fraunces (display), Bebas Neue (stats), Manrope
(corps), palette obsidienne / crème / rouge sang, grain papier en overlay.

## Fonctionnalités

- **Partie commerciale** publique : landing premium, page offres + formulaire de
  candidature (sauvegardé dans Firestore ou localStorage en démo).
- **Authentification Firebase** avec rôles (`client` / `admin`).
- **Espace athlète** privé — 4 sections : Aperçu, Entraînement, Nutrition, Protocole,
  Notes. Chaque athlète n'accède qu'à son propre profil.
- **Console admin** — liste de tous les athlètes, accès à leur profil pour édition
  (training / nutrition / protocole / notes), gestion des candidatures, création
  de nouveaux athlètes.

## Structure

```
crous-coaching/
├── index.html              ← Landing (doctrine)
├── coaching.html           ← Offres + formulaire candidature
├── login.html              ← Connexion / inscription
├── dashboard.html          ← Espace athlète (rôle: client)
├── admin.html              ← Console admin (rôle: admin)
├── firestore.rules         ← Règles de sécurité Firestore
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── firebase-config.js   ← À RENSEIGNER
│       ├── auth.js
│       └── profile.js
```

## Mode démo (sans Firebase)

Le site est immédiatement utilisable sans Firebase configuré : les données
sont stockées dans `localStorage`. Identifiants prêts à l'emploi :

- **Admin** — `admin@crous.fr` / `admin123`
- **Athlète** — `theo@example.com` / `athlete123`

Parfait pour faire une démo client. Aucune donnée n'est persistée côté serveur.

## Setup Firebase (production)

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com/)
2. **Créer un projet** (ex. `crous-coaching`).
3. Ajouter une **application Web** (icône `</>`) → copier la config.
4. Remplir `assets/js/firebase-config.js` :
   ```js
   export const firebaseConfig = {
     apiKey: "…",
     authDomain: "…",
     projectId: "…",
     // …
   };
   ```
5. Dans **Authentication** → activer `Email/Mot de passe`.
6. Dans **Firestore Database** → créer la base en mode `production`.
7. Déployer les règles : copier `firestore.rules` dans la console Firebase
   (onglet *Règles*) puis publier.

### Création du premier compte admin

Firebase crée tous les nouveaux comptes avec le rôle `client` par défaut.

Pour vous nommer **administrateur** :

1. Inscrivez-vous via `login.html` (onglet *Créer un compte*).
2. Allez dans Firestore → collection `users` → votre document.
3. Modifiez le champ `role` de `client` en `admin`.
4. Rechargez `login.html` — vous serez redirigé vers `admin.html`.

Ensuite, depuis la console admin, vous pouvez créer les comptes de vos athlètes
via le bouton *+ Créer un athlète*.

## Déploiement GitHub Pages

Le site est 100% statique → push sur un repo GitHub, puis :

```
Settings → Pages → Source: main / root → Save
```

Avec Firebase configuré, pensez à ajouter votre domaine GitHub Pages aux
**domaines autorisés** dans Firebase Auth.

## Modèle de données Firestore

```
users/{uid}
  ├ email: string
  ├ displayName: string
  ├ role: "client" | "admin"
  ├ metrics: string (ex. "28 ans · 82 kg · 178 cm")
  └ createdAt: timestamp

profiles/{uid}
  ├ training: [{ id, day, name, work, createdAt }]
  ├ diet:     [{ id, day, name, work, createdAt }]
  ├ protocol: [{ id, day, name, work, createdAt }]
  ├ notes:    string
  └ updatedAt: timestamp

inquiries/{auto}
  ├ fullName, email, metrics, program, experience, goals, notes
  ├ status: "pending" | "accepted" | "rejected"
  └ createdAt: timestamp
```

## Notes

- Section **Protocole** : strictement de l'information saisie par l'athlète pour
  son propre suivi (et celui de son coach). Aucune substance n'est promue,
  fournie ou vendue par le site.
- L'admin doit être en mesure de voir tous les profils — ce contrôle est imposé
  côté Firestore par les *security rules*, pas seulement côté client.

---

Édité pour **StudWeb** · Vol. I — N°01 / 2026
