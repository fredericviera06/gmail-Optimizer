/**
 * IntelligentFilter.gs
 * Système de filtrage intelligent pour Gmail Optimizer
 * Détecte et labellise automatiquement les emails importants vs non importants
 */

// ==================== CONFIGURATION ====================

var FILTER_CONFIG = {
  // Labels à créer
  labels: {
    important: '⭐ Important',
    toDelete: '🗑️ À supprimer',
    newsletter: '📧 Newsletter',
    automated: '🤖 Automatique',
    obsolete: '📅 Obsolète',
    lowPriority: '⬇️ Priorité basse'
  },
  
  // Critères d'importance
  importance: {
    // Domaines importants (à personnaliser)
    importantDomains: [
      '@votre-entreprise.com',
      '@client-important.com',
      // Ajoutez vos domaines importants
    ],
    
    // Mots-clés importants dans le sujet
    importantKeywords: [
      'urgent',
      'important',
      'action requise',
      'deadline',
      'réunion',
      'meeting',
      'contrat',
      'facture',
      'invoice',
      'rappel',
      'reminder'
    ],
    
    // Seuil de conversations (emails avec >X messages = important)
    conversationThreshold: 3
  },
  
  // Critères de suppression
  deletion: {
    // Listes de diffusion / newsletters
    newsletterIndicators: [
      'unsubscribe',
      'se désabonner',
      'newsletter',
      'mailing list',
      'notification',
      'no-reply',
      'noreply',
      'donotreply'
    ],
    
    // Domaines automatiques
    automatedDomains: [
      'noreply',
      'no-reply',
      'notifications',
      'alerts',
      'updates'
    ],
    
    // Catégories Gmail à supprimer
    lowPriorityCategories: [
      'promotions',
      'social',
      'updates'
    ],
    
    // Âge en jours pour considérer obsolète
    obsoleteDays: 180, // 6 mois
    
    // Emails non lus anciens (jours)
    unreadObsoleteDays: 30
  }
};

// ==================== FONCTIONS PRINCIPALES ====================

/**
 * Analyse et filtre tous les emails de la boîte de réception
 */
function analyzeAndFilterInbox(options) {
  Logger.log('▶️ START analyzeAndFilterInbox');
  
  options = options || {};
  var maxThreads = options.maxThreads || 500;
  var dryRun = options.dryRun !== false; // Par défaut, mode test
  
  // Créer les labels nécessaires
  createFilterLabels();
  
  // Statistiques
  var stats = {
    total: 0,
    important: 0,
    toDelete: 0,
    newsletter: 0,
    automated: 0,
    obsolete: 0,
    lowPriority: 0,
    processed: 0
  };
  
  try {
    // Récupérer les threads de la boîte de réception
    var threads = GmailApp.getInboxThreads(0, maxThreads);
    stats.total = threads.length;
    
    Logger.log('📊 Analyse de ' + threads.length + ' conversations');
    
    threads.forEach(function(thread, index) {
      try {
        var classification = classifyThread(thread);
        stats.processed++;
        
        if (dryRun) {
          // Mode test : juste logger
          Logger.log('[' + (index + 1) + '/' + threads.length + '] ' + 
                    thread.getFirstMessageSubject() + ' → ' + classification.type);
        } else {
          // Mode réel : appliquer les labels
          applyClassification(thread, classification);
        }
        
        // Incrémenter les stats
        stats[classification.type]++;
        
        // Pause pour éviter les limites de quota
        if (index % 50 === 0 && index > 0) {
          Logger.log('⏸️ Pause (traité ' + index + ' threads)');
          Utilities.sleep(1000);
        }
        
      } catch (e) {
        Logger.log('⚠️ Erreur sur thread ' + index + ': ' + e.toString());
      }
    });
    
    Logger.log('✅ END analyzeAndFilterInbox');
    Logger.log('📊 Statistiques: ' + JSON.stringify(stats, null, 2));
    
    return stats;
    
  } catch (e) {
    Logger.log('❌ ERREUR: ' + e.toString());
    throw e;
  }
}

/**
 * Classifie un thread selon son importance
 */
function classifyThread(thread) {
  var messages = thread.getMessages();
  var firstMessage = messages[0];
  var lastMessage = messages[messages.length - 1];
  
  var subject = thread.getFirstMessageSubject().toLowerCase();
  var from = firstMessage.getFrom().toLowerCase();
  var body = firstMessage.getPlainBody().toLowerCase();
  var messageCount = thread.getMessageCount();
  var isUnread = thread.isUnread();
  var age = (new Date() - lastMessage.getDate()) / (1000 * 60 * 60 * 24); // jours
  
  var classification = {
    type: 'toDelete',
    reasons: [],
    score: 0
  };
  
  // ========== CRITÈRES D'IMPORTANCE (score positif) ==========
  
  // 1. Domaine important
  var isImportantDomain = FILTER_CONFIG.importance.importantDomains.some(function(domain) {
    return from.includes(domain);
  });
  if (isImportantDomain) {
    classification.score += 10;
    classification.reasons.push('Domaine important');
  }
  
  // 2. Mots-clés importants
  var hasImportantKeyword = FILTER_CONFIG.importance.importantKeywords.some(function(keyword) {
    return subject.includes(keyword.toLowerCase());
  });
  if (hasImportantKeyword) {
    classification.score += 8;
    classification.reasons.push('Mot-clé important');
  }
  
  // 3. Conversation active
  if (messageCount >= FILTER_CONFIG.importance.conversationThreshold) {
    classification.score += 5;
    classification.reasons.push('Conversation active (' + messageCount + ' messages)');
  }
  
  // 4. Étoilé
  if (thread.hasStarredMessages()) {
    classification.score += 15;
    classification.reasons.push('Étoilé');
  }
  
  // 5. Récent et non lu
  if (isUnread && age < 7) {
    classification.score += 3;
    classification.reasons.push('Récent et non lu');
  }
  
  // ========== CRITÈRES DE SUPPRESSION (score négatif) ==========
  
  // 6. Newsletter
  var isNewsletter = FILTER_CONFIG.deletion.newsletterIndicators.some(function(indicator) {
    return body.includes(indicator) || from.includes(indicator);
  });
  if (isNewsletter) {
    classification.score -= 7;
    classification.reasons.push('Newsletter');
    classification.type = 'newsletter';
  }
  
  // 7. Domaine automatique
  var isAutomated = FILTER_CONFIG.deletion.automatedDomains.some(function(domain) {
    return from.includes(domain);
  });
  if (isAutomated) {
    classification.score -= 6;
    classification.reasons.push('Automatique');
    classification.type = 'automated';
  }
  
  // 8. Obsolète
  if (age > FILTER_CONFIG.deletion.obsoleteDays) {
    classification.score -= 8;
    classification.reasons.push('Obsolète (' + Math.round(age) + ' jours)');
    classification.type = 'obsolete';
  }
  
  // 9. Non lu ancien
  if (isUnread && age > FILTER_CONFIG.deletion.unreadObsoleteDays) {
    classification.score -= 5;
    classification.reasons.push('Non lu depuis ' + Math.round(age) + ' jours');
    classification.type = 'obsolete';
  }
  
  // 10. Catégorie faible priorité
  var labels = thread.getLabels();
  var hasLowPriorityCategory = labels.some(function(label) {
    var labelName = label.getName().toLowerCase();
    return FILTER_CONFIG.deletion.lowPriorityCategories.some(function(cat) {
      return labelName.includes(cat);
    });
  });
  if (hasLowPriorityCategory) {
    classification.score -= 4;
    classification.reasons.push('Priorité basse');
    classification.type = 'lowPriority';
  }
  
  // ========== DÉCISION FINALE ==========
  
  if (classification.score >= 5) {
    classification.type = 'important';
  }
  
  return classification;
}

/**
 * Applique la classification à un thread
 */
function applyClassification(thread, classification) {
  var labelName = FILTER_CONFIG.labels[classification.type];
  var label = getOrCreateLabel(labelName);
  
  thread.addLabel(label);
  
  // Si à supprimer, archiver et marquer comme lu
  if (classification.type !== 'important') {
    thread.moveToArchive();
    thread.markRead();
  }
  
  Logger.log('✅ Appliqué: ' + labelName);
}

/**
 * Crée ou récupère un label Gmail
 */
function getOrCreateLabel(labelName) {
  var label = GmailApp.getUserLabelByName(labelName);
  
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  
  return label;
}

/**
 * Crée tous les labels nécessaires
 */
function createFilterLabels() {
  for (var key in FILTER_CONFIG.labels) {
    var labelName = FILTER_CONFIG.labels[key];
    getOrCreateLabel(labelName);
  }
}

/**
 * Supprime tous les emails marqués "À supprimer"
 */
function deleteMarkedEmails(options) {
  options = options || {};
  var dryRun = options.dryRun !== false;
  
  try {
    var label = GmailApp.getUserLabelByName(FILTER_CONFIG.labels.toDelete);
    
    if (!label) {
      return { deleted: 0 };
    }
    
    var threads = label.getThreads();
    
    if (dryRun) {
      Logger.log('🧪 MODE TEST - ' + threads.length + ' emails seraient supprimés');
      return { deleted: 0, wouldDelete: threads.length };
    }
    
    threads.forEach(function(thread) {
      thread.moveToTrash();
    });
    
    return { deleted: threads.length };
    
  } catch (e) {
    Logger.log('❌ ERREUR: ' + e.toString());
    throw e;
  }
}

/**
 * Génère un rapport d'analyse
 */
function generateFilterReport(maxThreads) {
  var stats = analyzeAndFilterInbox({
    maxThreads: maxThreads || 100,
    dryRun: true
  });
  
  var report = '='.repeat(60) + '\n';
  report += '📊 RAPPORT GMAIL OPTIMIZER\n';
  report += '='.repeat(60) + '\n\n';
  
  report += '📧 Total analysé: ' + stats.total + '\n';
  report += '✅ Traités: ' + stats.processed + '\n\n';
  
  report += '--- Classification ---\n';
  report += '⭐ Importants: ' + stats.important + ' (' + 
           Math.round(stats.important / stats.total * 100) + '%)\n';
  report += '🗑️ À supprimer: ' + stats.toDelete + ' (' + 
           Math.round(stats.toDelete / stats.total * 100) + '%)\n';
  report += '📧 Newsletters: ' + stats.newsletter + '\n';
  report += '🤖 Automatiques: ' + stats.automated + '\n';
  report += '📅 Obsolètes: ' + stats.obsolete + '\n';
  report += '⬇️ Priorité basse: ' + stats.lowPriority + '\n\n';
  
  var potential = stats.toDelete + stats.newsletter + stats.automated + 
                 stats.obsolete + stats.lowPriority;
  report += '💾 Économie potentielle: ' + potential + ' emails (' + 
           Math.round(potential / stats.total * 100) + '%)\n';
  
  Logger.log(report);
  return report;
}

/**
 * Configuration - Ajouter un domaine important
 */
function addImportantDomain(domain) {
  if (!domain.startsWith('@')) {
    domain = '@' + domain;
  }
  
  if (FILTER_CONFIG.importance.importantDomains.indexOf(domain) === -1) {
    FILTER_CONFIG.importance.importantDomains.push(domain);
    Logger.log('✅ Domaine ajouté: ' + domain);
    return true;
  }
  
  return false;
}

/**
 * Configuration - Ajouter un mot-clé important
 */
function addImportantKeyword(keyword) {
  keyword = keyword.toLowerCase();
  
  if (FILTER_CONFIG.importance.importantKeywords.indexOf(keyword) === -1) {
    FILTER_CONFIG.importance.importantKeywords.push(keyword);
    Logger.log('✅ Mot-clé ajouté: ' + keyword);
    return true;
  }
  
  return false;
}

// ==================== MENU GOOGLE SHEETS ====================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Gmail Optimizer')
    .addSubMenu(ui.createMenu('🔍 Filtrage')
      .addItem('📊 Générer rapport', 'menuGenerateReport')
      .addItem('🧪 Tester filtrage', 'menuTestFiltering')
      .addItem('✅ Appliquer filtrage', 'menuApplyFiltering')
      .addSeparator()
      .addItem('🗑️ Supprimer marqués (test)', 'menuTestDeletion')
      .addItem('⚠️ Supprimer marqués (réel)', 'menuRealDeletion'))
    .addSubMenu(ui.createMenu('⚙️ Configuration')
      .addItem('📋 Afficher config', 'menuShowConfig')
      .addItem('➕ Ajouter domaine', 'menuAddDomain')
      .addItem('➕ Ajouter mot-clé', 'menuAddKeyword'))
    .addToUi();
}

function menuGenerateReport() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Nombre d\'emails à analyser',
    'Max 500:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var count = parseInt(response.getResponseText()) || 100;
    var report = generateFilterReport(count);
    ui.alert('Rapport généré', report, ui.ButtonSet.OK);
  }
}

function menuTestFiltering() {
  var result = analyzeAndFilterInbox({ maxThreads: 100, dryRun: true });
  SpreadsheetApp.getUi().alert(
    'Test terminé',
    'Analysé: ' + result.processed + ' emails\nVoir logs',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuApplyFiltering() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Confirmation',
    'Appliquer le filtrage ?',
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    var result = analyzeAndFilterInbox({ maxThreads: 500, dryRun: false });
    ui.alert(
      'Filtrage appliqué',
      'Traités: ' + result.processed + '\nImportants: ' + result.important,
      ui.ButtonSet.OK
    );
  }
}

function menuTestDeletion() {
  var result = deleteMarkedEmails({ dryRun: true });
  SpreadsheetApp.getUi().alert(
    'Test suppression',
    'Seraient supprimés: ' + result.wouldDelete,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuRealDeletion() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '⚠️ ATTENTION',
    'VRAIMENT supprimer les emails marqués ?',
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    var result = deleteMarkedEmails({ dryRun: false });
    ui.alert(
      'Suppression effectuée',
      'Emails supprimés: ' + result.deleted,
      ui.ButtonSet.OK
    );
  }
}

function menuShowConfig() {
  Logger.log(JSON.stringify(FILTER_CONFIG, null, 2));
  SpreadsheetApp.getUi().alert(
    'Configuration',
    'Voir les logs (Ctrl+Entrée)',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuAddDomain() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Ajouter domaine important',
    'Ex: company.com ou @company.com',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var domain = response.getResponseText();
    addImportantDomain(domain);
    ui.alert('Domaine ajouté: ' + domain);
  }
}

function menuAddKeyword() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Ajouter mot-clé important',
    'Ex: urgent, projet, client',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() == ui.Button.OK) {
    var keyword = response.getResponseText();
    addImportantKeyword(keyword);
    ui.alert('Mot-clé ajouté: ' + keyword);
  }
}
