# CLINISYS — Module Rapprochement bancaire (réplique fonctionnelle)

HTML/CSS/JavaScript autonome, sans serveur ni dépendance. Ouvrir `index.html` dans un navigateur.
Le design (couleurs, thème, typographie, composants de `styles.css`) est conservé : les ajouts de style sont uniquement à la fin du fichier.

## Parcours (d'après la vidéo)
1. Connexion → choix de la société et de l'exercice → écran d'accueil du module.
2. Barre de menus : **Fichier** (Gestion des comptes bancaires, Paramétrage des motifs de rapprochement avec écart, Changer d'exercice, Quitter) · **Injection des extraits bancaires** · **Rapprochement** (Rapprochement, Ecritures rapprochées, Mouvements bancaires lettrés, Marquage des frais bancaires) · **Editions** (Etat des mouvements bancaires, Etat de rapprochement).
3. Chaque fenêtre s'ouvre dans un onglet fermable (×) ; le bouton « + » ouvre la liste des fenêtres.
4. **Gestion des comptes bancaires** : Modèle extrait, Solde de départ, Instance comptable, Instance bancaire, Fermer.
5. **Injection des extraits bancaires** : recherche (N° injection / utilisateur), filtre compte + exercice, Actualiser / Réinitialiser, Ajouter (import CSV : `exemple-extrait-bancaire.csv`), Imprimer, Etats rapprochés / non rapprochés, Annuler injection.
6. **Rapprochement** : compte + « Jusqu'au » (message « Date invalide » si absent), Tous / Décaissement / Encaissement, recherche, parties comptable et bancaire, Ajouter / Modifier / Supprimer (côté bancaire), Rapprocher, Assistant décaissement / encaissement, **Rapprochement automatique**, Lettrer, Valider avec écart (motif), Imprimer état de rapprochement.

## Rapprochement automatique
Boutons « Automatique » et « Rapprochement automatique » (écran Rapprochement) ; il faut d'abord choisir le compte et la date « Jusqu'au ».
- **1 ↔ 1** : même montant et même sens, écart de dates ≤ tolérance (5 jours par défaut). Fiabilité *Forte* si une référence concorde (numéros de 3 chiffres et plus trouvés dans la référence ou le libellé), *Moyenne* sinon. Option « Exiger une référence concordante ».
- **Regroupements** (option) : 1 opération bancaire ↔ 2 ou 3 écritures de même somme, et inversement. Proposés « À vérifier » et décochés par défaut.
- Les propositions s'affichent dans une fenêtre de contrôle : l'utilisateur décoche ce qu'il refuse, puis « Valider la sélection » crée les rapprochements (annulables dans *Ecritures rapprochées*). Les écarts (frais, etc.) restent à traiter avec « Valider avec écart ».

Raccourci : `Ctrl K` pour rechercher une fonction. `Échap` ferme les fenêtres.
