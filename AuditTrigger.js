function auditTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    Logger.log(
      'ID: ' + t.getUniqueId() +
      ' | Function: ' + t.getHandlerFunction() +
      ' | Type: ' + t.getEventType() +
      ' | Source: ' + t.getTriggerSource()
    );
  });
  Logger.log('Total triggers: ' + triggers.length);
}
