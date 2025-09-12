// ISpravljeni Google Apps Script kod za testnu formu
// Zamijenite postojeći kod u Apps Script editoru s ovim kodom

// Konfiguracija
const CONFIG = {
  SHEET_ID: 'YOUR_SHEET_ID_HERE', // Zamijenite s vašim Sheet ID-om
  REZERVACIJE_SHEET_NAME: 'Rezervacije',
  
  // Trener email adrese
  TRAINER_EMAILS: {
    'Tina': 'tina@goodlife.com', // Zamijenite s pravim email adresama
    'Marko': 'marko@goodlife.com',
    'Ivan': 'ivan@goodlife.com'
  },
  
  ADMIN_EMAIL: 'admin@goodlife.com' // Zamijenite s admin email adresom
};

// Glavna funkcija za POST zahtjeve
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Dodaj rezervaciju
    const result = addReservation(data);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Dodaj rezervaciju u Google Sheets
function addReservation(data) {
  try {
    const sheet = getSheet(CONFIG.REZERVACIJE_SHEET_NAME);
    
    const row = [
      new Date().toISOString(), // Datum rezervacije
      data.ime,
      data.prezime,
      data.email,
      data.telefon,
      data.datum,
      data.termin,
      data.trener || 'Bez trenera',
      data.napomena || '',
      'Aktivno'
    ];
    
    sheet.appendRow(row);
    
    // Pošalji e-mail potvrdu
    sendConfirmationEmail(data);
    
    // Pošalji e-mail treneru ako je odabran
    if (data.trener && data.trener !== '') {
      sendTrainerNotification(data);
    }
    
    return {
      ok: true,
      message: 'Rezervacija je uspješno spremljena'
    };
    
  } catch (error) {
    return {
      ok: false,
      error: error.toString()
    };
  }
}

// Pomoćne funkcije
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Postavi header redove
    sheet.getRange(1, 1, 1, 10).setValues([[
      'Datum rezervacije', 'Ime', 'Prezime', 'Email', 'Telefon', 
      'Datum', 'Termin', 'Trener', 'Napomena', 'Status'
    ]]);
    
    // Formatiraj header red
    const headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setBackground('#ff7a00');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
  }
  
  return sheet;
}

function sendConfirmationEmail(data) {
  const subject = 'Potvrda rezervacije - GoodLife';
  const body = `
Poštovani/a ${data.ime} ${data.prezime},

Vaša rezervacija je uspješno poslana!

Detalji rezervacije:
- Datum: ${data.datum}
- Termin: ${data.termin}
- Trener: ${data.trener || 'Bez trenera'}
- Email: ${data.email}
- Telefon: ${data.telefon}

${data.napomena ? 'Napomena: ' + data.napomena : ''}

Hvala vam što ste odabrali GoodLife!

Lijep pozdrav,
GoodLife tim
  `;
  
  GmailApp.sendEmail(data.email, subject, body);
}

function sendTrainerNotification(data) {
  const trainerEmail = CONFIG.TRAINER_EMAILS[data.trener];
  if (!trainerEmail) return;
  
  const subject = `Nova rezervacija - ${data.trener}`;
  const body = `
Poštovani/a ${data.trener},

Imate novu rezervaciju:

Detalji:
- Ime i prezime: ${data.ime} ${data.prezime}
- Email: ${data.email}
- Telefon: ${data.telefon}
- Datum: ${data.datum}
- Termin: ${data.termin}
- Napomena: ${data.napomena || 'Nema dodatne napomene'}

Molimo kontaktirajte klijenta što prije.

Lijep pozdrav,
GoodLife sustav
  `;
  
  GmailApp.sendEmail(trainerEmail, subject, body);
}

// Test funkcija za provjeru
function testFunction() {
  const testData = {
    ime: 'Test',
    prezime: 'Korisnik',
    email: 'test@example.com',
    telefon: '123456789',
    datum: '2024-01-15',
    termin: '10:00',
    trener: 'Tina',
    napomena: 'Test rezervacija'
  };
  
  const result = addReservation(testData);
  console.log(result);
  return result;
}
