// Run this to trigger MailApp OAuth consent + verify SMS gateway
// Sends to LT ONLY — JT will not receive anything
function testAlertSMS_LTOnly() {
  var ALERT_LT_SMS = '8168636893@txt.att.net';
  MailApp.sendEmail(ALERT_LT_SMS, 'TBM Test', 'Alert gateway working — ' + new Date().toLocaleTimeString());
  Logger.log('Test SMS sent to LT only');
}