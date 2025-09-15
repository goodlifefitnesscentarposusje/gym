/************** KONFIG **************/
const SHEET_ID = '19gXggvYTq2-6W_Uu03S-K6jeAZZD0WHo9KBru99lwsE';
const SHEET_NAME = 'GoodLife Sauna Rezervacije';
const ADMIN_EMAIL = 'goodlifefitnesscentarposusje@gmail.com';
const ALLOWED_TIMES = new Set([
  '09:00','10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00','21:00'
]);

/************** POMOĆNE **************/
function SH(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) throw new Error(`Sheet "${SHEET_NAME}" nije pronađen.`);
  sh.getRange('D:D').setNumberFormat('@'); // Telefon kao tekst
  return sh;
}

function J(x){
  return ContentService.createTextOutput(JSON.stringify(x))
         .setMimeType(ContentService.MimeType.JSON);
}

function FMT(d){
  return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function makeCode(lang){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r='';
  for(let i=0;i<5;i++) r+=chars[Math.floor(Math.random()*chars.length)];
  return `GL-${r}-${(lang||'hr').toUpperCase()}`;
}

function codeLang(code){
  return (code||'').split('-').pop().toLowerCase()==='en' ? 'en' : 'hr';
}

// ROBUSNA EMAIL FUNKCIJA - ne ruši se ako mail padne
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

/************** POST: rezervacija ILI otkazivanje **************/
function doPost(e){
  try{
    const data = JSON.parse(e.postData?.contents || '{}');
    console.log('doPost called with data:', data);

    /* ----- OTKAZIVANJE ----- */
    if (data.action === 'cancel') {
      console.log('Processing cancellation request...');
      if(!data.email || !data.code) return J({ok:false, error:'Nedostaje email ili kod.'});
      
      const sh = SH(), vals = sh.getDataRange().getValues();
      console.log(`Checking ${vals.length-1} rows for cancellation...`);
      
      for (let i = 1; i < vals.length; i++) {
        const r=vals[i];
        const email=r[2], code=r[8], status=(r[7]||'').toString().toLowerCase();
        console.log(`Row ${i}: email=${email}, code=${code}, status=${status}`);
        
        if (email===data.email && code===data.code && status.startsWith('potvrđeno')){
          console.log('Found matching reservation for cancellation');
          
          // Spremi podatke prije mijenjanja statusa za email obavijesti
          const imeprezime = r[1]; // B = Ime i prezime
          const telefon = r[3]; // D = Telefon
          const datum = FMT(r[4]); // E = Datum
          const termin = r[5]; // F = Termin
          const napomena = r[6]; // G = Napomena
          const lang = codeLang(code);
          console.log('Reservation details:', {imeprezime, email, telefon, datum, termin, napomena, lang});

          // Mijenjaj status na 'otkazano'
          sh.getRange(i+1, 8).setValue('Otkazano'); // H = Status
          console.log('Status updated to otkazano');

          // Pošalji email obavijest adminu o otkazivanju - ROBUSNO
          const adminCancelHtml = `
            <div style="font-family:Arial,sans-serif;font-size:14px">
              <h3 style="margin:0 0 8px; color:#e74c3c;">Rezervacija saune otkazana</h3>
              <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
                <tr><td><b>Ime i prezime</b></td><td>${imeprezime}</td></tr>
                <tr><td><b>Email</b></td><td>${email}</td></tr>
                <tr><td><b>Telefon</b></td><td>${telefon}</td></tr>
                <tr><td><b>Datum</b></td><td>${datum}</td></tr>
                <tr><td><b>Termin</b></td><td>${termin}</td></tr>
                <tr><td><b>Napomena</b></td><td>${napomena || '-'}</td></tr>
                <tr><td><b>Status</b></td><td style="color:#e74c3c;">OTKAZANO</td></tr>
                <tr><td><b>Kod</b></td><td>${code}</td></tr>
              </table>
              <p style="margin-top:12px; color:#666;">
                Rezervacija je otkazana: ${new Date().toLocaleString('hr-HR')}
              </p>
            </div>`;
          
          const rAdm = sendEmailSafe_({
            to: ADMIN_EMAIL,
            replyTo: email,
            subject: `Rezervacija otkazana – ${imeprezime} (${datum} ${termin})`,
            htmlBody: adminCancelHtml
          });
          console.log('Admin email result:', rAdm);

          // Pošalji potvrdu korisniku o otkazivanju - ROBUSNO
          let userHtml, userSubject;
          if(lang === 'en'){
            userSubject = 'GoodLife – Reservation cancelled';
            userHtml = `
              <div style="font-family:Arial,sans-serif;font-size:14px">
                <h3 style="margin:0 0 8px">Reservation cancelled</h3>
                <p>Hello ${imeprezime},</p>
                <p>Your sauna reservation has been successfully cancelled:</p>
                <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
                  <tr><td><b>Date</b></td><td>${datum}</td></tr>
                  <tr><td><b>Time</b></td><td>${termin}</td></tr>
                  <tr><td><b>Phone</b></td><td>${telefon}</td></tr>
                </table>
                <p style="margin-top:12px;">
                  Thank you for letting us know about the cancellation.<br>
                  For new reservations, you can use our website.
                </p>
                <p>GoodLife Posušje</p>
              </div>`;
          } else {
            userSubject = 'GoodLife – Rezervacija otkazana';
            userHtml = `
              <div style="font-family:Arial,sans-serif;font-size:14px">
                <h3 style="margin:0 0 8px">Rezervacija otkazana</h3>
                <p>Pozdrav ${imeprezime},</p>
                <p>Vaša rezervacija saune je uspješno otkazana:</p>
                <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
                  <tr><td><b>Datum</b></td><td>${datum}</td></tr>
                  <tr><td><b>Termin</b></td><td>${termin}</td></tr>
                  <tr><td><b>Telefon</b></td><td>${telefon}</td></tr>
                </table>
                <p style="margin-top:12px;">
                  Hvala vam što ste nas obavijestili o otkazivanju.<br>
                  Za nove rezervacije možete koristiti našu web stranicu.
                </p>
                <p>GoodLife Posušje</p>
              </div>`;
          }
          
          const rUser = sendEmailSafe_({
            to: email,
            cc: ADMIN_EMAIL,
            subject: userSubject,
            htmlBody: userHtml
          });
          console.log('User email result:', rUser);

          return J({
            ok:true, 
            message: 'Rezervacija otkazana i emailovi poslani',
            mailedUser: rUser.ok,
            mailedAdmin: rAdm.ok,
            errUser: rUser.error || '',
            errAdmin: rAdm.error || ''
          });
        }
      }
      console.log('No matching reservation found for cancellation');
      return J({ok:false, error:'Rezervacija nije pronađena.'});
    }

    /* ----- KREIRANJE REZERVACIJE ----- */
    if(!data.imeprezime || !data.email || !data.telefon || !data.datum || !data.termin){
      return J({ok:false, error:'Nedostaju obavezna polja.'});
    }

    if(!ALLOWED_TIMES.has(data.termin)) return J({ok:false, error:'Nevažeći termin.'});

    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(data.datum);
    d.setHours(0,0,0,0);
    const diffDays = Math.round((d - today)/(1000*60*60*24));
    if(diffDays<0 || diffDays>6) return J({ok:false, error:'Datum mora biti unutar 7 dana.'});

    const code = makeCode(data.lang);
    const sh = SH();
    
    // FIX: Čuvaj datum i termin kao STRING, ne kao Date objekte
    sh.appendRow([
      new Date(), // A Timestamp
      data.imeprezime, // B Ime i prezime
      data.email, // C Email
      data.telefon, // D Telefon
      data.datum, // E Datum kao STRING (ne new Date!)
      data.termin, // F Termin kao STRING
      data.napomena||'', // G Napomena
      'Potvrđeno', // H Status
      code // I Kod
    ]);

    // link na tab i red
    const row = sh.getLastRow();
    const sheetLink = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sh.getSheetId()}`;

    // korisnički mail (admin u CC) - ROBUSNO
    const lang = (data.lang==='en') ? 'en' : 'hr';
    let userSubject, userBody;
    
    if(lang==='en'){
      userSubject = 'GoodLife – Sauna reservation confirmation';
      userBody = `Hello ${data.imeprezime},<br><br>
        Your sauna reservation has been received:<br>
        <b>Date:</b> ${data.datum}<br>
        <b>Time:</b> ${data.termin}<br>
        <b>Phone:</b> ${data.telefon}<br>
        <b>Cancel code:</b> ${code}<br><br>
        See you at GoodLife!`;
    } else {
      userSubject = 'GoodLife – potvrda rezervacije saune';
      userBody = `Pozdrav ${data.imeprezime},<br><br>
        Vaša rezervacija je zaprimljena:<br>
        <b>Datum:</b> ${data.datum}<br>
        <b>Termin:</b> ${data.termin}<br>
        <b>Telefon:</b> ${data.telefon}<br>
        <b>Kod za otkazivanje:</b> ${code}<br><br>
        Vidimo se u GoodLife!`;
    }

    const rUser = sendEmailSafe_({
      to: data.email,
      cc: ADMIN_EMAIL,
      subject: userSubject,
      htmlBody: userBody
    });

    // detaljni admin mail - ROBUSNO
    const adminHtml = `
      <div style="font-family:Arial,sans-serif;font-size:14px">
        <h3 style="margin:0 0 8px">Nova rezervacija saune</h3>
        <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
          <tr><td><b>Ime i prezime</b></td><td>${data.imeprezime}</td></tr>
          <tr><td><b>Email</b></td><td>${data.email}</td></tr>
          <tr><td><b>Telefon</b></td><td>${data.telefon}</td></tr>
          <tr><td><b>Datum</b></td><td>${data.datum}</td></tr>
          <tr><td><b>Termin</b></td><td>${data.termin}</td></tr>
          <tr><td><b>Napomena</b></td><td>${data.napomena || '-'}</td></tr>
          <tr><td><b>Status</b></td><td>potvrđeno</td></tr>
          <tr><td><b>Kod (otkazivanje)</b></td><td>${code}</td></tr>
        </table>
        <p style="margin-top:12px">➜ <a href="${sheetLink}" target="_blank">Otvori Google Sheet</a> (red #${row})</p>
      </div>`;

    const rAdm = sendEmailSafe_({
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `Nova rezervacija – ${data.imeprezime} (${data.datum} ${data.termin})`,
      htmlBody: adminHtml
    });

    return J({
      ok:true, 
      code,
      mailedUser: rUser.ok,
      mailedAdmin: rAdm.ok,
      errUser: rUser.error || '',
      errAdmin: rAdm.error || ''
    });

  } catch(err){
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
      // FIX: termin je u koloni F (index 5), ali se čuva kao string "16:00"
      const datum = FMT(r[4]); // E=Datum
      const termin = (r[5]||'').toString().trim(); // F=Termin kao string
      
      // Debug log
      console.log(`Row ${i}: datum=${datum}, termin=${termin}, status=${status}`);
      
      out.push({ datum: datum, termin: termin });
    }
  }
  console.log('doGet returning:', out);
  return J(out);
}

/************** DELETE (legacy): otkazivanje **************/
function doDelete(e){
  const data = JSON.parse(e.postData?.contents || '{}');
  console.log('doDelete called with data:', data);
  if(!data.email || !data.code) return J({ok:false, error:'Nedostaje email ili kod.'});
  
  const sh = SH(), vals = sh.getDataRange().getValues();
  console.log(`Checking ${vals.length-1} rows for cancellation (DELETE)...`);
  
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const email=r[2], code=r[8], status=(r[7]||'').toString().toLowerCase();
    console.log(`Row ${i}: email=${email}, code=${code}, status=${status}`);
    
    if(email===data.email && code===data.code && status.startsWith('potvrđeno')){
      console.log('Found matching reservation for cancellation (DELETE)');
      
      // Spremi podatke prije mijenjanja statusa za email obavijesti
      const imeprezime = r[1]; // B = Ime i prezime
      const telefon = r[3]; // D = Telefon
      const datum = FMT(r[4]); // E = Datum
      const termin = r[5]; // F = Termin
      const napomena = r[6]; // G = Napomena
      const lang = codeLang(code);
      console.log('Reservation details (DELETE):', {imeprezime, email, telefon, datum, termin, napomena, lang});

      // Mijenjaj status na 'otkazano'
      sh.getRange(i+1, 8).setValue('Otkazano'); // H
      console.log('Status updated to otkazano (DELETE)');

      // Pošalji email obavijest adminu o otkazivanju - ROBUSNO
      const adminCancelHtml = `
        <div style="font-family:Arial,sans-serif;font-size:14px">
          <h3 style="margin:0 0 8px; color:#e74c3c;">Rezervacija saune otkazana</h3>
          <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
            <tr><td><b>Ime i prezime</b></td><td>${imeprezime}</td></tr>
            <tr><td><b>Email</b></td><td>${email}</td></tr>
            <tr><td><b>Telefon</b></td><td>${telefon}</td></tr>
            <tr><td><b>Datum</b></td><td>${datum}</td></tr>
            <tr><td><b>Termin</b></td><td>${termin}</td></tr>
            <tr><td><b>Napomena</b></td><td>${napomena || '-'}</td></tr>
            <tr><td><b>Status</b></td><td style="color:#e74c3c;">OTKAZANO</td></tr>
            <tr><td><b>Kod</b></td><td>${code}</td></tr>
          </table>
          <p style="margin-top:12px; color:#666;">
            Rezervacija je otkazana: ${new Date().toLocaleString('hr-HR')}
          </p>
        </div>`;
      
      const rAdm = sendEmailSafe_({
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `Rezervacija otkazana – ${imeprezime} (${datum} ${termin})`,
        htmlBody: adminCancelHtml
      });

      // Pošalji potvrdu korisniku o otkazivanju - ROBUSNO
      let userHtml, userSubject;
      if(lang === 'en'){
        userSubject = 'GoodLife – Reservation cancelled';
        userHtml = `
          <div style="font-family:Arial,sans-serif;font-size:14px">
            <h3 style="margin:0 0 8px">Reservation cancelled</h3>
            <p>Hello ${imeprezime},</p>
            <p>Your sauna reservation has been successfully cancelled:</p>
            <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
              <tr><td><b>Date</b></td><td>${datum}</td></tr>
              <tr><td><b>Time</b></td><td>${termin}</td></tr>
              <tr><td><b>Phone</b></td><td>${telefon}</td></tr>
            </table>
            <p style="margin-top:12px;">
              Thank you for letting us know about the cancellation.<br>
              For new reservations, you can use our website.
            </p>
            <p>GoodLife Posušje</p>
          </div>`;
      } else {
        userSubject = 'GoodLife – Rezervacija otkazana';
        userHtml = `
          <div style="font-family:Arial,sans-serif;font-size:14px">
            <h3 style="margin:0 0 8px">Rezervacija otkazana</h3>
            <p>Pozdrav ${imeprezime},</p>
            <p>Vaša rezervacija saune je uspješno otkazana:</p>
            <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
              <tr><td><b>Datum</b></td><td>${datum}</td></tr>
              <tr><td><b>Termin</b></td><td>${termin}</td></tr>
              <tr><td><b>Telefon</b></td><td>${telefon}</td></tr>
            </table>
            <p style="margin-top:12px;">
              Hvala vam što ste nas obavijestili o otkazivanju.<br>
              Za nove rezervacije možete koristiti našu web stranicu.
            </p>
            <p>GoodLife Posušje</p>
          </div>`;
      }
      
      const rUser = sendEmailSafe_({
        to: email,
        cc: ADMIN_EMAIL,
        subject: userSubject,
        htmlBody: userHtml
      });

      return J({
        ok:true, 
        message: 'Rezervacija otkazana i emailovi poslani (DELETE)',
        mailedUser: rUser.ok,
        mailedAdmin: rAdm.ok,
        errUser: rUser.error || '',
        errAdmin: rAdm.error || ''
      });
    }
  }
  console.log('No matching reservation found for cancellation (DELETE)');
  return J({ok:false, error:'Rezervacija nije pronađena.'});
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
      sh.getRange(i+1, 8).setValue('Potvrđeno (podsjetnik)'); // H=Status
    }
  }
}
