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
        sh.deleteRow(i + 1); // briši red
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

  // obavijest tebi
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "Nova sauna rezervacija",
    htmlBody: `
      <b>Ime i Prezime:</b> ${data.imeprezime}<br>
      <b>Email:</b> ${data.email}<br>
      <b>Telefon:</b> ${data.telefon}<br>
      <b>Datum:</b> ${data.datum}<br>
      <b>Termin:</b> ${data.termin}<br>
      <b>Napomena:</b> ${data.napomena}<br>
      <b>Kod rezervacije:</b> ${code}<br>
      <b>Vrijeme unosa:</b> ${now}
    `
  });

  // auto potvrda klijentu
  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
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