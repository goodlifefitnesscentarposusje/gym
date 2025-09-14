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
    // recikliramo postojeću logiku iz doDelete:
    if(!data.email || !data.code) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false, 
        error: 'Nedostaje email ili kod.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sh = sheet;
    const vals = sh.getDataRange().getValues();

    for (let i = 1; i < vals.length; i++) {
      const r = vals[i];
      const email = r[1], code = r[6]; // email je u koloni B, kod u koloni G
      if (email === data.email && code === data.code) {
        // Spremi podatke prije brisanja za email obavijesti
        const imeprezime = r[0]; // ime i prezime
        const telefon = r[2]; // telefon
        const datum = r[3]; // datum
        const termin = r[4]; // termin
        const napomena = r[5]; // napomena
        
        sh.deleteRow(i + 1); // briši red
        
        // Pošalji email obavijest adminu o otkazivanju
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
              Rezervacija je otkazana: ${now}
            </p>
          </div>
        `;

        MailApp.sendEmail({
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: `Rezervacija otkazana – ${imeprezime} (${datum} ${termin})`,
          htmlBody: adminCancelHtml
        });

        // Pošalji potvrdu korisniku o otkazivanju
        const userCancelHtml = `
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
          </div>
        `;

        MailApp.sendEmail({
          to: email,
          cc: ADMIN_EMAIL,
          subject: "Potvrda otkazivanja rezervacije — GoodLife sauna",
          htmlBody: userCancelHtml
        });
        
        return ContentService.createTextOutput(JSON.stringify({
          ok: true,
          message: "Rezervacija otkazana"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      ok: false, 
      error: 'Rezervacija nije pronađena.'
    })).setMimeType(ContentService.MimeType.JSON);
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = e.parameter;
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = rows.length - 1; i >= 1; i--) { // preskačemo header, idemo unazad
    if (rows[i][1] === data.email && rows[i][6] === data.code) { // email i kod se poklapaju
      sheet.deleteRow(i + 1); // +1 jer sheet indeksi počinju od 1
      
      // obavijest tebi o otkazivanju
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        subject: "Sauna rezervacija otkazana",
        htmlBody: `
          <b>Email:</b> ${data.email}<br>
          <b>Kod:</b> ${data.code}<br>
          <b>Vrijeme otkazivanja:</b> ${Utilities.formatDate(new Date(), "Europe/Zagreb", "yyyy-MM-dd HH:mm:ss")}
        `
      });
      
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        message: "Rezervacija otkazana"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: "Rezervacija nije pronađena"
  })).setMimeType(ContentService.MimeType.JSON);
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