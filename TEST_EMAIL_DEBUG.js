// Dodajte ovu funkciju u Apps Script za testiranje mailova:

function testEmailDebug(){
  try {
    console.log('Testing email to admin...');
    
    // Test 1: MailApp
    try {
      MailApp.sendEmail({
        to: 'goodlifefitnesscentarposusje@gmail.com',
        subject: 'TEST - MailApp',
        htmlBody: 'Test email s MailApp'
      });
      console.log('MailApp: SUCCESS');
    } catch(e) {
      console.log('MailApp: FAILED -', e.message);
    }
    
    // Test 2: GmailApp
    try {
      GmailApp.sendEmail(
        'goodlifefitnesscentarposusje@gmail.com',
        'TEST - GmailApp',
        '',
        { htmlBody: 'Test email s GmailApp' }
      );
      console.log('GmailApp: SUCCESS');
    } catch(e) {
      console.log('GmailApp: FAILED -', e.message);
    }
    
    // Test 3: Provjeri dozvole
    try {
      const quota = MailApp.getRemainingDailyQuota();
      console.log('Mail quota remaining:', quota);
    } catch(e) {
      console.log('Quota check failed:', e.message);
    }
    
    return {ok: true};
  } catch(err) {
    console.error('Email debug error:', err);
    return {ok: false, error: String(err)};
  }
}
