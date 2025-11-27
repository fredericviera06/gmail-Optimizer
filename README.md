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

📖 Guide d'Utilisation
Installation

Créer un projet Apps Script

Allez sur https://script.google.com
Nouveau projet → "Gmail Optimizer"


Copier le code

Créez IntelligentFilter.gs
Collez le code ci-dessus


Activer l'API Gmail

Services → Gmail API (si nécessaire)



Utilisation via Menu
Une fois installé, dans Google Sheets :
📧 Gmail Optimizer
  ├─ 🔍 Filtrage
  │   ├─ 📊 Générer rapport (analyse sans modifier)
  │   ├─ 🧪 Tester filtrage (mode test)
  │   ├─ ✅ Appliquer filtrage (réel)
  │   ├─ 🗑️ Supprimer marqués (test)
  │   └─ ⚠️ Supprimer marqués (réel)
  └─ ⚙️ Configuration
      ├─ 📋 Afficher config
      ├─ ➕ Ajouter domaine important
      └─ ➕ Ajouter mot-clé important
Workflow Recommandé
javascript// 1. ANALYSE (sans risque)
generateFilterReport(100);
// Voir combien d'emails seraient classés

// 2. TEST (sans risque)
analyzeAndFilterInbox({ maxThreads: 100, dryRun: true });
// Voir les classifications dans les logs

// 3. PERSONNALISATION
addImportantDomain('@votre-entreprise.com');
addImportantKeyword('projet urgent');

// 4. APPLICATION (modifie les emails)
analyzeAndFilterInbox({ maxThreads: 500, dryRun: false });
// Labels appliqués, emails archivés

// 5. SUPPRESSION (optionnel)
deleteMarkedEmails({ dryRun: false });
// Supprime les emails marqués

🔧 Gestion des Versions avec Clasp
Configuration Clasp
powershell# Installation
npm install -g @google/clasp

# Connexion
clasp login

# Cloner le projet
clasp clone SCRIPT_ID

# Voir les versions
clasp versions

# Restaurer une version
$env:NODE_OPTIONS="--max-old-space-size=8192"
clasp pull --versionNumber 6

# Pousser les modifications
clasp push
Synchronisation avec GitHub Gist
powershell# Configuration Git
git init
git remote add origin https://gist.github.com/USERNAME/GIST_ID.git

# Workflow de sync
clasp pull                  # Récupérer depuis Apps Script
git add .                   # Ajouter les changements
git commit -m "sync"        # Commit
git push                    # Backup sur Gist

🎯 Comparaison : Gmail Optimizer vs Unattach
FonctionnalitéGmail OptimizerUnattachFiltrage intelligent✅❌Labels automatiques✅❌Suppression PJ✅ (via remplacement)✅ (en place)Date originale préservée❌✅ (IMAP)PJ sur Drive✅❌Gratuit✅❌ ($39/an)Open source✅❌
Pourquoi Unattach préserve les dates ?
Unattach utilise IMAP (protocole bas niveau) qui permet :

✅ Manipulation directe des messages bruts
✅ Upload de messages avec headers originaux
✅ Préservation complète des métadonnées

Gmail Optimizer utilise Gmail API qui :

❌ Ne permet pas de forcer les dates passées
❌ Protection anti-spoofing
✅ Mais gratuit et personnalisable !


💡 Personnalisation du Filtrage
Ajouter vos domaines importants
javascriptFILTER_CONFIG.importance.importantDomains = [
  '@votre-entreprise.com',
  '@client-vip.com',
  '@partenaire.fr'
];
Ajouter vos mots-clés
javascriptFILTER_CONFIG.importance.importantKeywords = [
  'projet X',
  'client Y',
  'budget 2025',
  'signature contrat'
];
Ajuster les délais
javascriptFILTER_CONFIG.deletion.obsoleteDays = 365;        // 1 an au lieu de 6 mois
FILTER_CONFIG.deletion.unreadObsoleteDays = 60;   // 2 mois
```

---

## 📊 Exemple de Rapport d'Analyse
```
============================================================
📊 RAPPORT GMAIL OPTIMIZER
============================================================

📧 Total analysé: 500
✅ Traités: 500

--- Classification ---
⭐ Importants: 125 (25%)
🗑️ À supprimer: 200 (40%)
📧 Newsletters: 75 (15%)
🤖 Automatiques: 50 (10%)
📅 Obsolètes: 30 (6%)
⬇️ Priorité basse: 20 (4%)

💾 Économie potentielle: 375 emails (75%)
============================================================

🚀 Développements Futurs Possibles
1. Gestion des pièces jointes
javascript// Sauvegarder PJ sur Drive
function saveAttachmentsToDrive(thread) {
  var messages = thread.getMessages();
  messages.forEach(function(message) {
    var attachments = message.getAttachments();
    attachments.forEach(function(att) {
      DriveApp.createFile(att);
    });
  });
}
2. Règles automatiques déclenchées
javascript// Trigger quotidien
function createDailyTrigger() {
  ScriptApp.newTrigger('analyzeAndFilterInbox')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
}
3. Interface Web App
javascriptfunction doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Gmail Optimizer Dashboard');
}

🐛 Problèmes Résolus
1. Clasp "heap out of memory"
Solution : Augmenter la mémoire Node.js
powershell$env:NODE_OPTIONS="--max-old-space-size=8192"
2. GitHub Gist authentification
Solution : Utiliser Personal Access Token au lieu du mot de passe

https://github.com/settings/tokens
Permissions : gist uniquement

3. Restauration de versions
Solution : Workflow clasp
powershellclasp clone SCRIPT_ID
clasp pull --versionNumber 6

📚 Ressources

Apps Script Docs : https://developers.google.com/apps-script
Gmail API : https://developers.google.com/gmail/api
Clasp : https://github.com/google/clasp
Gist API : https://docs.github.com/en/rest/gists


✅ Checklist de Déploiement

 Copier IntelligentFilter.gs dans Apps Script
 Personnaliser domaines importants
 Personnaliser mots-clés
 Tester avec generateFilterReport(50)
 Appliquer en mode test dryRun: true
 Vérifier les labels créés
 Appliquer en mode réel dryRun: false
 Configurer clasp pour versioning
 Synchroniser avec GitHub Gist
 Créer trigger automatique (optionnel)
