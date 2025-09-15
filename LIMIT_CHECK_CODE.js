// Dodajte ovu funkciju u Apps Script za provjeru limita:

function checkEmailQuota(){
  try {
    const quota = MailApp.getRemainingDailyQuota();
    console.log('Remaining email quota:', quota);
    
    if(quota <= 0) {
      console.log('⚠️ EMAIL QUOTA EXCEEDED - No emails will be sent today');
      return false;
    } else if(quota <= 10) {
      console.log('⚠️ EMAIL QUOTA LOW - Only', quota, 'emails remaining');
      return true;
    } else {
      console.log('✅ EMAIL QUOTA OK -', quota, 'emails remaining');
      return true;
    }
  } catch(e) {
    console.log('Could not check quota:', e.message);
    return true; // Assume OK if we can't check
  }
}

// I modificirajte sendEmailSafe_ funkciju:
function sendEmailSafe_(opts){
  // Provjeri quota prije slanja
  if(!checkEmailQuota()) {
    return {ok:false, error:'Daily email quota exceeded'};
  }
  
  try { 
    MailApp.sendEmail(opts); 
    return {ok:true}; 
  }
  catch(e1){
    try {
      GmailApp.sendEmail(opts.to, opts.subject, '', {
        htmlBody: opts.htmlBody, 
        cc: (opts.cc||''), 
        replyTo: (opts.replyTo||'')
      });
      return {ok:true};
    } catch(e2){
      const msg = (e2 && e2.message) ? e2.message : String(e1);
      Logger.log('Mail fail → ' + msg);
      return {ok:false, error: msg};
    }
  }
}
