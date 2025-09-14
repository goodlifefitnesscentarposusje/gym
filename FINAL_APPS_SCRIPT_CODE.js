const ADMIN_EMAIL = "goodlifefitnesscentar@gmail.com";

function doGet(e) {
  // Vraća zauzete termine za frontend
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const zauzeti = [];
  for (let i = 1; i < data.length; i++) { // preskačemo header
    if (data[i][3] && data[i][4]) { // datum i termin postoje
      zauzeti.push({
        datum: data[i][3],
        termin: data[i][4]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(zauzeti))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const tz = "Europe/Zagreb";
  const now = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");

  // Parsiranje JSON podataka iz body-ja
  const data = JSON.parse(e.postData?.contents || '{}');

  // ako je otkazivanje poslano kao POST
  if (data.action === 'cancel') {
    // 1) validacija
    const emailIn = (data.email || '').trim().toLowerCase();
    const codeIn  = (data.code  || '').trim().toUpperCase();
    if(!emailIn || !codeIn) return J({ok:false, error:'Nedostaje email ili kod.'});

    const sh   = SH();
    const vals = sh.getDataRange().getValues();
    const tz   = Session.getScriptTimeZone();

    for (let i = 1; i < vals.length; i++) {
      const r = vals[i];
      const imeprez = r[1];
      const email   = (r[2] || '').toString().trim().toLowerCase(); // C
      const tel     = r[3] || '';
      const dat     = FMT(r[4]);                                    // E
      const tim     = r[5] || '';                                   // F
      const note    = r[6] || '-';                                  // G
      const status  = (r[7] || '').toString().trim().toLowerCase(); // H
      const codeRow = (r[8] || '').toString().trim().toUpperCase(); // I

      // 2) pronađi red
      if (email === emailIn && codeRow === codeIn && (status === 'potvrđeno' || status.startsWith('potvrđeno'))) {

        // 3) označi kao otkazano
        sh.getRange(i+1, 8).setValue('otkazano'); // H = Status

        // 4) pošalji mailove (korisnik + admin)
        const sheetLink = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sh.getSheetId()}`;
        const lang = codeLang(codeRow);

        // korisnik (CC admin da budeš 100% siguran)
        if (lang === 'en') {
          MailApp.sendEmail({
            to: emailIn,
            cc: ADMIN_EMAIL,
            subject: 'GoodLife – Sauna reservation cancelled',
            htmlBody: `Hello ${imeprez},<br><br>
              Your sauna reservation has been cancelled.<br>
              <b>Date:</b> ${dat}<br>
              <b>Time:</b> ${tim}<br>
              <b>Code:</b> ${codeRow}<br><br>
              If this wasn't you, reply to this email.`
          });
        } else {
          MailApp.sendEmail({
            to: emailIn,
            cc: ADMIN_EMAIL,
            subject: 'GoodLife – Otkazivanje rezervacije saune',
            htmlBody: `Pozdrav ${imeprez},<br><br>
              Vaša rezervacija je otkazana.<br>
              <b>Datum:</b> ${dat}<br>
              <b>Termin:</b> ${tim}<br>
              <b>Kod:</b> ${codeRow}<br><br>
              Ako ovo niste bili vi, odgovorite na ovaj email.`
          });
        }

        // admin
        const adminHtml = `
          <div style="font-family:Arial,sans-serif;font-size:14px">
            <h3 style="margin:0 0 8px">Otkazana rezervacija saune</h3>
            <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
              <tr><td><b>Ime i prezime</b></td><td>${imeprez}</td></tr>
              <tr><td><b>Email</b></td><td>${emailIn}</td></tr>
              <tr><td><b>Telefon</b></td><td>${tel}</td></tr>
              <tr><td><b>Datum</b></td><td>${dat}</td></tr>
              <tr><td><b>Termin</b></td><td>${tim}</td></tr>
              <tr><td><b>Napomena</b></td><td>${note}</td></tr>
              <tr><td><b>Kod</b></td><td>${codeRow}</td></tr>
            </table>
            <p style="margin-top:12px">➜ <a href="${sheetLink}" target="_blank">Otvori Google Sheet</a> (red #${i+1})</p>
          </div>`;
        MailApp.sendEmail({
          to: ADMIN_EMAIL,
          replyTo: emailIn,
          subject: `OTKAZANO – ${imeprez} (${dat} ${tim})`,
          htmlBody: adminHtml
        });

        return J({ok:true});
      }
    }

    // 5) nije pronađeno
    return J({ok:false, error:'Rezervacija nije pronađena (provjeri email i kod).'});
  }

  // Generiraj jedinstveni kod za novu rezervaciju
  const code = generateReservationCode();

  // upis u Sheet
  sheet.appendRow([
    data.imeprezime,   // Ime i prezime
    data.email,        // Email
    data.telefon,      // Telefon
    data.datum,        // Datum
    data.termin,       // Termin
    data.napomena,     // Napomena
    code,              // Kod rezervacije
    now                // Vrijeme unosa
  ]);

  // nakon appendRow(...) dodaj:
  const sh = sheet;
  const row = sh.getLastRow();
  const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
  const sheetLink = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sh.getSheetId()}`;

  // sve detalje u jednom mailu adminu
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
      <p style="margin-top:12px">
        ➜ <a href="${sheetLink}" target="_blank">Otvori Google Sheet</a> (red #${row})
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    replyTo: data.email,            // da admin može direktno odgovoriti korisniku
    subject: `Nova rezervacija – ${data.imeprezime} (${data.datum} ${data.termin})`,
    htmlBody: adminHtml
  });

  // auto potvrda klijentu (s adminom u CC)
  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      cc: ADMIN_EMAIL, // admin dobije kopiju
      subject: "Potvrda rezervacije — GoodLife sauna",
      htmlBody: `
        Pozdrav ${data.imeprezime},<br><br>
        Vaša rezervacija je zaprimljena za <b>${data.datum}</b> u <b>${data.termin}</b>.<br>
        <b>Kod rezervacije:</b> ${code}<br><br>
        Za otkazivanje koristite ovaj kod na našoj web stranici.<br><br>
        Hvala!<br>
        GoodLife Posušje
      `
    });
  }

  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    code: code
  })).setMimeType(ContentService.MimeType.JSON);
}

function doDelete(e) {
  const data = JSON.parse(e.postData?.contents || '{}');
  // 1) validacija
  const emailIn = (data.email || '').trim().toLowerCase();
  const codeIn  = (data.code  || '').trim().toUpperCase();
  if(!emailIn || !codeIn) return J({ok:false, error:'Nedostaje email ili kod.'});

  const sh   = SH();
  const vals = sh.getDataRange().getValues();
  const tz   = Session.getScriptTimeZone();

  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    const imeprez = r[1];
    const email   = (r[2] || '').toString().trim().toLowerCase(); // C
    const tel     = r[3] || '';
    const dat     = FMT(r[4]);                                    // E
    const tim     = r[5] || '';                                   // F
    const note    = r[6] || '-';                                  // G
    const status  = (r[7] || '').toString().trim().toLowerCase(); // H
    const codeRow = (r[8] || '').toString().trim().toUpperCase(); // I

    // 2) pronađi red
    if (email === emailIn && codeRow === codeIn && (status === 'potvrđeno' || status.startsWith('potvrđeno'))) {

      // 3) označi kao otkazano
      sh.getRange(i+1, 8).setValue('otkazano'); // H = Status

      // 4) pošalji mailove (korisnik + admin)
      const sheetLink = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sh.getSheetId()}`;
      const lang = codeLang(codeRow);

      // korisnik (CC admin)
      if (lang === 'en') {
        MailApp.sendEmail({
          to: emailIn,
          cc: ADMIN_EMAIL,
          subject: 'GoodLife – Sauna reservation cancelled',
          htmlBody: `Hello ${imeprez},<br><br>
            Your sauna reservation has been cancelled.<br>
            <b>Date:</b> ${dat}<br>
            <b>Time:</b> ${tim}<br>
            <b>Code:</b> ${codeRow}<br><br>
            If this wasn't you, reply to this email.`
        });
      } else {
        MailApp.sendEmail({
          to: emailIn,
          cc: ADMIN_EMAIL,
          subject: 'GoodLife – Otkazivanje rezervacije saune',
          htmlBody: `Pozdrav ${imeprez},<br><br>
            Vaša rezervacija je otkazana.<br>
            <b>Datum:</b> ${dat}<br>
            <b>Termin:</b> ${tim}<br>
            <b>Kod:</b> ${codeRow}<br><br>
            Ako ovo niste bili vi, odgovorite na ovaj email.`
        });
      }

      // admin
      const adminHtml = `
        <div style="font-family:Arial,sans-serif;font-size:14px">
          <h3 style="margin:0 0 8px">Otkazana rezervacija saune</h3>
          <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse">
            <tr><td><b>Ime i prezime</b></td><td>${imeprez}</td></tr>
            <tr><td><b>Email</b></td><td>${emailIn}</td></tr>
            <tr><td><b>Telefon</b></td><td>${tel}</td></tr>
            <tr><td><b>Datum</b></td><td>${dat}</td></tr>
            <tr><td><b>Termin</b></td><td>${tim}</td></tr>
            <tr><td><b>Napomena</b></td><td>${note}</td></tr>
            <tr><td><b>Kod</b></td><td>${codeRow}</td></tr>
          </table>
          <p style="margin-top:12px">➜ <a href="${sheetLink}" target="_blank">Otvori Google Sheet</a> (red #${i+1})</p>
        </div>`;
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        replyTo: emailIn,
        subject: `OTKAZANO – ${imeprez} (${dat} ${tim})`,
        htmlBody: adminHtml
      });

      return J({ok:true});
    }
  }

  // 5) nije pronađeno
  return J({ok:false, error:'Rezervacija nije pronađena (provjeri email i kod).'});
}

function generateReservationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'GL-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-HR';
  return result;
}