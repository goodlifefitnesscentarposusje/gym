/**************  KONFIG  **************/
const SHEET_ID   = '1dBG_PjKMJ00mpM3ybN1ofABz09_Gb-Na1z9b9GJeVJ8';         // <-- dio između /d/ i /edit
const SHEET_NAME = 'GoodLife Sauna Rezervacije';         // <-- točno ime taba u Sheetu
const ADMIN_EMAIL = 'goodlifefitnesscentar@gmail.com';

const ALLOWED_TIMES = new Set([
  '09:00','10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00','21:00'
]);

/**************  POMOĆNE  **************/
function SH(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) throw new Error(`Sheet "${SHEET_NAME}" nije pronađen.`);
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
  let r=''; for(let i=0;i<5;i++) r+=chars[Math.floor(Math.random()*chars.length)];
  return `GL-${r}-${(lang||'hr').toUpperCase()}`;
}
function codeLang(code){
  return (code||'').split('-').pop().toLowerCase()==='en' ? 'en' : 'hr';
}

// Helper funkcija za otkazivanje + slanje mailova (koriste i doPost i doDelete)
function handleCancelAndNotify(emailInRaw, codeInRaw){
  console.log('=== handleCancelAndNotify called ===');
  console.log('Email:', emailInRaw, 'Code:', codeInRaw);
  
  const emailIn = (emailInRaw || '').trim().toLowerCase();
  const codeIn  = (codeInRaw  || '').trim().toUpperCase();
  if(!emailIn || !codeIn) return {ok:false, error:'Nedostaje email ili kod.'};

  const sh   = SH();
  const vals = sh.getDataRange().getValues();
  console.log(`Checking ${vals.length-1} rows for cancellation...`);

  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    const imeprez = (r[1] || '').toString().trim();
    const email   = (r[2] || '').toString().trim().toLowerCase();
    const tel     = (r[3] || '').toString().trim();
    const dat     = FMT(r[4]);
    const tim     = (r[5] || '').toString().trim();
    const note    = (r[6] || '-').toString().trim();
    const status  = (r[7] || '').toString().trim().toLowerCase();
    const codeRow = (r[8] || '').toString().trim().toUpperCase();

    console.log(`Row ${i}: email=${email}, code=${codeRow}, status=${status}`);

    // prihvati i "potvrđeno (podsjetnik)"
    if (email === emailIn && codeRow === codeIn && (status === 'potvrđeno' || status.startsWith('potvrđeno'))) {
      console.log('=== FOUND MATCHING RESERVATION ===');
      
      // označi kao otkazano
      sh.getRange(i+1, 8).setValue('otkazano'); // H = Status
      console.log('Status updated to otkazano');

      const lang = codeLang(codeRow);

      // korisnik (CC admin da si 100% siguran)
      try {
        if (lang === 'en') {
          MailApp.sendEmail({
            to: emailIn, cc: ADMIN_EMAIL,
            subject: 'GoodLife – Sauna reservation cancelled',
            htmlBody: `Hello ${imeprez},<br><br>
              Your sauna reservation has been cancelled.<br>
              <b>Date:</b> ${dat}<br><b>Time:</b> ${tim}<br>
              <b>Code:</b> ${codeRow}`
          });
          console.log('User email sent to:', emailIn, '(CC to admin)');
        } else {
          MailApp.sendEmail({
            to: emailIn, cc: ADMIN_EMAIL,
            subject: 'GoodLife – Otkazivanje rezervacije saune',
            htmlBody: `Pozdrav ${imeprez},<br><br>
              Vaša rezervacija je otkazana.<br>
              <b>Datum:</b> ${dat}<br><b>Termin:</b> ${tim}<br>
              <b>Kod:</b> ${codeRow}`
          });
          console.log('User email sent to:', emailIn, '(CC to admin)');
        }

        // admin (jasna poruka tko je otkazao)
        const subjAdmin = (lang==='en'
          ? `CANCELLED – ${imeprez} (${dat} ${tim})`
          : `OTKAZANO – ${imeprez} (${dat} ${tim})`);
        const bodyAdmin = (lang==='en'
          ? `User <b>${imeprez}</b> (${emailIn}, ${tel}) has cancelled sauna reservation.<br><br><b>Date:</b> ${dat}<br><b>Time:</b> ${tim}<br><b>Note:</b> ${note}`
          : `Korisnik <b>${imeprez}</b> (${emailIn}, ${tel}) je otkazao rezervaciju saune.<br><br><b>Datum:</b> ${dat}<br><b>Termin:</b> ${tim}<br><b>Napomena:</b> ${note}`);
        MailApp.sendEmail({ to: ADMIN_EMAIL, replyTo: emailIn, subject: subjAdmin, htmlBody: bodyAdmin });
        console.log('Admin email sent to:', ADMIN_EMAIL);
        
        console.log('=== EMAILS SENT SUCCESSFULLY ===');
        return {ok:true};
        
      } catch (error) {
        console.error('MailApp error:', error);
        return {ok:false, error:'Greška pri slanju emaila: ' + error.message};
      }
    }
  }
  
  console.log('=== NO MATCHING RESERVATION FOUND ===');
  return {ok:false, error:'Rezervacija nije pronađena (provjeri email i kod).'};
}

/**************  POST: rezervacija ILI otkazivanje  **************/
/* Body:
   - Rezervacija:
     { imeprezime, email, telefon, datum:'YYYY-MM-DD', termin:'HH:MM', napomena?, lang:'hr'|'en' }
   - Otkazivanje (bez CORS preflighta):
     { action:'cancel', email, code }
*/
function doPost(e){
  console.log('=== doPost called ===');
  console.log('e.postData:', e.postData);
  
  const data = JSON.parse(e.postData?.contents || '{}');
  console.log('Parsed data:', data);

  /* ----- OTKAZIVANJE ----- */
  if (data.action === 'cancel') {
    console.log('=== CANCELLATION REQUEST (POST) ===');
    const out = handleCancelAndNotify(data.email, data.code);
    return J(out);
  }

  /* ----- KREIRANJE REZERVACIJE ----- */
  if(!data.imeprezime || !data.email || !data.telefon || !data.datum || !data.termin){
    return J({ok:false, error:'Nedostaju obavezna polja.'});
  }
  if(!ALLOWED_TIMES.has(data.termin)) return J({ok:false, error:'Nevažeći termin.'});

  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(data.datum); d.setHours(0,0,0,0);
  const diffDays = Math.round((d - today)/(1000*60*60*24));
  if(diffDays<0 || diffDays>7) return J({ok:false, error:'Datum mora biti unutar 7 dana.'});

  const code = makeCode(data.lang);
  const sh = SH();
  sh.appendRow([
    new Date(),            // A Timestamp
    data.imeprezime,       // B Ime i prezime
    data.email,            // C Email
    data.telefon,          // D Telefon
    new Date(data.datum),  // E Datum
    data.termin,           // F Termin
    data.napomena||'',     // G Napomena
    'potvrđeno',           // H Status
    code                   // I Kod
  ]);

  // link na tab i red
  const row = sh.getLastRow();
  const sheetLink = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sh.getSheetId()}`;

  // korisnički mail (admin u CC)
  const lang = (data.lang==='en') ? 'en' : 'hr';
  if(lang==='en'){
    MailApp.sendEmail({
      to: data.email,
      cc: ADMIN_EMAIL,
      subject: 'GoodLife – Sauna reservation confirmation',
      htmlBody: `Hello ${data.imeprezime},<br><br>
      Your sauna reservation has been received:<br>
      <b>Date:</b> ${data.datum}<br>
      <b>Time:</b> ${data.termin}<br>
      <b>Phone:</b> ${data.telefon}<br>
      <b>Cancel code:</b> ${code}<br><br>
      See you at GoodLife!`
    });
  } else {
  MailApp.sendEmail({
      to: data.email,
      cc: ADMIN_EMAIL,
      subject: 'GoodLife – potvrda rezervacije saune',
      htmlBody: `Pozdrav ${data.imeprezime},<br><br>
      Vaša rezervacija je zaprimljena:<br>
      <b>Datum:</b> ${data.datum}<br>
      <b>Termin:</b> ${data.termin}<br>
      <b>Telefon:</b> ${data.telefon}<br>
      <b>Kod za otkazivanje:</b> ${code}<br><br>
      Vidimo se u GoodLife!`
    });
  }

  // detaljni admin mail
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
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: `Nova rezervacija – ${data.imeprezime} (${data.datum} ${data.termin})`,
    htmlBody: adminHtml
  });

  return J({ok:true, code});
}

/**************  GET: zauzeti slotovi (za zatamnjenje)  **************/
function doGet(e){
  const vals = SH().getDataRange().getValues();
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status = (r[7]||'').toString().toLowerCase(); // H = Status
    if(status.startsWith('potvrđeno')){                  // uključuje "potvrđeno (podsjetnik)"
      out.push({ datum: FMT(r[4]), termin: r[5] });      // E=Datum, F=Termin
    }
  }
  return J(out);
}

/**************  DELETE (legacy): otkazivanje  **************/
/* Ako frontend baš šalje DELETE (ne preporučujem zbog CORS-a), i dalje podržano. */
function doDelete(e){
  console.log('=== doDelete called ===');
  console.log('e.postData:', e.postData);
  
  const data = JSON.parse(e.postData?.contents || '{}');
  console.log('=== CANCELLATION REQUEST (DELETE) ===');
  
  const out = handleCancelAndNotify(data.email, data.code);
  return J(out);
}

/**************  PODSJETNIK ~2h prije (trigger)  **************/
/* Triggers → Add Trigger → sendReminders → Time-driven → Every hour */
function sendReminders(){
  const sh = SH();
  const vals = sh.getDataRange().getValues();
  const now = new Date();

  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status=(r[7]||'').toString().toLowerCase();
    if(status!=='potvrđeno') continue;

    const d = new Date(r[4]);                              // E=Datum
    const [hh,mm] = (r[5]||'00:00').split(':').map(Number);// F=Termin
    d.setHours(hh, mm||0, 0, 0);

    const diffMin = (d - now)/(1000*60); // minute do termina
    if(diffMin > 110 && diffMin < 130){  // ~2h prije (±20 min)
      const email=r[2], imeprez=r[1], code=r[8];
      const dStr = FMT(d), tStr=r[5]||'';
      const lang = codeLang(code);

      if(lang==='en'){
        MailApp.sendEmail({
          to: email,
          subject: 'GoodLife – Sauna reservation reminder',
          htmlBody: `Hello ${imeprez},<br><br>
          Reminder: your sauna reservation is today.<br>
          <b>Date:</b> ${dStr}<br><b>Time:</b> ${tStr}<br><br>See you at GoodLife!`
        });
      } else {
        MailApp.sendEmail({
          to: email,
          subject: 'GoodLife – Podsjetnik na rezervaciju saune',
          htmlBody: `Pozdrav ${imeprez},<br><br>
          Podsjećamo Vas na današnju rezervaciju saune:<br>
          <b>Datum:</b> ${dStr}<br><b>Termin:</b> ${tStr}<br><br>Vidimo se u GoodLife!`
        });
      }
      sh.getRange(i+1, 8).setValue('potvrđeno (podsjetnik)'); // H=Status
    }
  }
}