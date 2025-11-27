# gmail-Optimizer

📧 GMAIL OPTIMIZER - Résumé Complet du Projet🎯 Objectif du ProjetDévelopper un système de gestion intelligent pour Gmail permettant de :

✅ Détecter et gérer les doublons de pièces jointes
✅ Filtrer automatiquement les emails importants vs non importants
✅ Économiser de l'espace Gmail
✅ Automatiser le nettoyage des emails obsolètes
📁 Architecture du ProjetLe projet se compose de plusieurs fichiers Google Apps Script :Gmail Optimizer/
├── Code.gs                    # Fonctions principales + Add-on
├── IntelligentFilter.gs       # Système de filtrage intelligent ⭐
├── LabelManager.gs            # Gestion des labels
├── BatchAnalysis.gs           # Analyse en masse
├── DriveManager.gs            # Sauvegarde sur Drive
├── IntelligentCleanup.gs      # Nettoyage automatique
├── AutoRules.gs               # Règles automatiques
└── GmailFilters.gs            # Création de filtres Gmail🔑 Fonctionnalités Principales1. Filtrage Intelligent des Emails ⭐Le cœur du projet : IntelligentFilter.gsClassification automatique en 6 catégories :

⭐ Important : emails critiques à conserver
🗑️ À supprimer : emails obsolètes/inutiles
📧 Newsletter : listes de diffusion
🤖 Automatique : notifications automatiques
📅 Obsolète : emails anciens (>6 mois)
⬇️ Priorité basse : promotions, social, updates
Critères de détection :javascript// Emails IMPORTANTS détectés par :
- Domaines importants (personnalisables)
- Mots-clés critiques (urgent, réunion, contrat, etc.)
- Conversations actives (3+ messages)
- Emails étoilés
- Récents et non lus

// Emails À SUPPRIMER détectés par :
- Indicateurs newsletter (unsubscribe, mailing list)
- Domaines automatiques (noreply, notifications)
- Âge > 180 jours
- Non lus depuis 30+ jours
- Catégories Gmail faibles (promotions, social)
