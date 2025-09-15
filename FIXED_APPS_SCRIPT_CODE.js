/* === KONFIG === */
const SHEET_ID = '1dBG_PjKMJ00mpM3ybN1ofABz09_Gb-Na1z9b9GJeVJ8'; // <-- VAŠ SHEET ID
const SHEET_NAME = 'GoodLife Sauna Rezervacije'; // <-- točan naziv taba
const ADMIN_EMAIL = 'goodlifefitnesscentarposusje@gmail.com'; // <-- VAŠ EMAIL
/* ============== */

function SH(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('Tab "'+SHEET_NAME+'" ne postoji.');
  sh.getRange('D:D').setNumberFormat('@'); // Telefon kao tekst
  return sh;
}

function J(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendEmailSafe_(opts){
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

/* health / dijagnostika */
function doGet(){ 
  return J({ok:true}); 
}

function doPost(e){
  try{
    const data = JSON.parse(e.postData && e.postData.contents || '{}');
    const action = (data.action||'').trim();

    if(action==='test_email'){
      const rA = sendEmailSafe_({to: ADMIN_EMAIL, subject:'TEST admin', htmlBody:'test admin'});
      const rU = sendEmailSafe_({to: (data.to||ADMIN_EMAIL), subject:'TEST user', htmlBody:'test user'});
      return J({ok:true, mailedAdmin:rA.ok, mailedUser:rU.ok, errAdmin:rA.error||'', errUser:rU.error||''});
    }

    if(action==='reserve'){
      const sh = SH();
      const row = sh.getLastRow()+1;

      const imeprez = (data.imeprezime||'').trim();
      const email   = (data.email||'').trim().toLowerCase();
      const tel     = String(data.telefon||'').trim();
      const dStr    = (data.datum||'').trim();    // yyyy-mm-dd
      const tStr    = (data.termin||'').trim();   // 09:00 ...
      const nap     = (data.napomena||'').trim();
      const lang    = (data.lang==='en'?'en':'hr');
      const code    = 'GL-' + Math.random().toString(36).slice(2,7).toUpperCase() + (lang==='en'?'-EN':'-HR');

      if(!imeprez || !email || !tel || !dStr || !tStr) return J({ok:false, error:'Nedostaju polja.'});

      // upis (A..I)
      sh.appendRow([new Date(), imeprez, email, tel, dStr, tStr, nap, 'Potvrđeno', code]);

      // mailovi (i ako padnu, NE ruši response)
      const subjUser = (lang==='en'?'GoodLife – Sauna reservation confirmation':'GoodLife – potvrda rezervacije saune');
      const bodyUser = (lang==='en'
        ? `Hello ${imeprez},<br>Your reservation has been received.<br><b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}<br><b>Phone:</b> ${tel}<br><b>Cancel code:</b> ${code}`
        : `Pozdrav ${imeprez},<br>Vaša rezervacija je zaprimljena.<br><b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}<br><b>Telefon:</b> ${tel}<br><b>Kod za otkazivanje:</b> ${code}`);

      const rUser = sendEmailSafe_({to: email, cc: ADMIN_EMAIL, subject: subjUser, htmlBody: bodyUser});

      const subjAdm = (lang==='en'?`NEW – ${imeprez} (${dStr} ${tStr})`:`NOVA – ${imeprez} (${dStr} ${tStr})`);
      const bodyAdm = (lang==='en'
        ? `New sauna reservation:<br><b>Name:</b> ${imeprez}<br><b>Email:</b> ${email}<br><b>Phone:</b> ${tel}<br><b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}<br><b>Note:</b> ${nap}<br><b>Code:</b> ${code}`
        : `Nova rezervacija saune:<br><b>Ime i prezime:</b> ${imeprez}<br><b>Email:</b> ${email}<br><b>Telefon:</b> ${tel}<br><b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}<br><b>Napomena:</b> ${nap}<br><b>Kod:</b> ${code}`);

      const rAdm = sendEmailSafe_({to: ADMIN_EMAIL, replyTo: email, subject: subjAdm, htmlBody: bodyAdm});

      return J({ok:true, mailedUser:rUser.ok, mailedAdmin:rAdm.ok, errUser:rUser.error||'', errAdmin:rAdm.error||''});
    }

    if(action==='cancel'){
      const emailIn = (data.email||'').trim().toLowerCase();
      const codeIn  = (data.code ||'').trim().toUpperCase();
      if(!emailIn || !codeIn) return J({ok:false, error:'Nedostaje email/kod.'});

      const sh = SH(), vals = sh.getDataRange().getValues();
      for(let i=1;i<vals.length;i++){
        const r=vals[i];
        const ime=(r[1]||'').toString().trim();
        const email=(r[2]||'').toString().trim().toLowerCase();
        const tel=(r[3]||'').toString().trim();
        const dStr=(r[4]||'').toString().trim();
        const tStr=(r[5]||'').toString().trim();
        const status=(r[7]||'').toString().trim();
        const code=(r[8]||'').toString().trim().toUpperCase();

        if(email===emailIn && code===codeIn && status==='Potvrđeno'){
          sh.getRange(i+1,8).setValue('Otkazano');

          const lang = code.endsWith('-EN')?'en':'hr';
          const subjUser = (lang==='en'?'GoodLife – Sauna reservation cancelled':'GoodLife – otkazivanje rezervacije saune');
          const bodyUser = (lang==='en'
            ? `Hello ${ime},<br>Your reservation has been <b>cancelled</b>.<br><b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}`
            : `Pozdrav ${ime},<br>Vaša rezervacija je <b>otkazana</b>.<br><b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}`);

          const rUser = sendEmailSafe_({to: emailIn, cc: ADMIN_EMAIL, subject: subjUser, htmlBody: bodyUser});

          const subjAdm = (lang==='en'?`CANCELLED – ${ime} (${dStr} ${tStr})`:`OTKAZANO – ${ime} (${dStr} ${tStr})`);
          const bodyAdm = (lang==='en'
            ? `User ${ime} (${emailIn}, ${tel}) cancelled reservation.<br><b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}`
            : `Korisnik ${ime} (${emailIn}, ${tel}) je otkazao rezervaciju.<br><b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}`);

          const rAdm = sendEmailSafe_({to: ADMIN_EMAIL, replyTo: emailIn, subject: subjAdm, htmlBody: bodyAdm});

          return J({ok:true, mailedUser:rUser.ok, mailedAdmin:rAdm.ok, errUser:rUser.error||'', errAdmin:rAdm.error||''});
        }
      }
      return J({ok:false, error:'Rezervacija nije pronađena.'});
    }

    return J({ok:false, error:'Nepoznata akcija.'});
  }catch(err){
    Logger.log('doPost error → ' + err);
    return J({ok:false, error:String(err)});
  }
}

/************** GET: zauzeti slotovi (za zatamnjenje) **************/
function doGet(e){
  const vals = SH().getDataRange().getValues();
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status = (r[7]||'').toString().toLowerCase(); // H = Status
    if(status.startsWith('potvrđeno')){ // uključuje "potvrđeno (podsjetnik)"
      out.push({ datum: FMT(r[4]), termin: r[5] }); // E=Datum, F=Termin
    }
  }
  return J(out);
}

function FMT(d){
  return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/************** PODSJETNIK ~2h prije (trigger) **************/
function sendReminders(){
  const sh = SH();
  const vals = sh.getDataRange().getValues();
  const now = new Date();
  
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status=(r[7]||'').toString().toLowerCase();
    if(status!=='potvrđeno') continue;
    
    const d = new Date(r[4]); // E=Datum
    const [hh,mm] = (r[5]||'00:00').split(':').map(Number);// F=Termin
    d.setHours(hh, mm||0, 0, 0);
    const diffMin = (d - now)/(1000*60); // minute do termina
    
    if(diffMin > 110 && diffMin < 130){ // ~2h prije (±20 min)
      const email=r[2], imeprez=r[1], code=r[8];
      const dStr = FMT(d), tStr=r[5]||'';
      const lang = codeLang(code);
      
      if(lang==='en'){
        MailApp.sendEmail({
          to: email,
          subject: 'GoodLife – Sauna reservation reminder',
          htmlBody: `Hello ${imeprez},<br><br>
            Reminder: your sauna reservation is today.<br>
            <b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}<br><br>
            See you at GoodLife!`
        });
      } else {
        MailApp.sendEmail({
          to: email,
          subject: 'GoodLife – Podsjetnik na rezervaciju saune',
          htmlBody: `Pozdrav ${imeprez},<br><br>
            Podsjećamo Vas na današnju rezervaciju saune:<br>
            <b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}<br><br>
            Vidimo se u GoodLife!`
        });
      }
      sh.getRange(i+1, 8).setValue('potvrđeno (podsjetnik)'); // H=Status
    }
  }
}

function codeLang(code){
  return (code||'').split('-').pop().toLowerCase()==='en' ? 'en' : 'hr';
}
