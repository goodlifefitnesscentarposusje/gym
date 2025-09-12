// Google Apps Script kod za GoodLife rezervacije
// Zamijenite postojeći kod u Apps Script editoru s ovim kodom

// Konfiguracija
const CONFIG = {
  SHEET_ID: '1ehATHu-yhSmEtHIGf9-8PLlumcBTbeYMdOYBfHyj_M8', // Vaš Sheet ID
  SAUNA_SHEET_NAME: 'Sauna Rezervacije',
  TRAINER_SHEET_NAME: 'Trener Rezervacije',
  
  // Trener email adrese
  TRAINER_EMAILS: {
    'Tina': 'tinna.maras@gmail.com',
    'Davor': 'davorcolic60@gmail.com',
    'Ivan': 'kivan92@gmail.com',
    'Toni': 'toni@goodlife.com' // Za sada prazno
  },
  
  ADMIN_EMAIL: 'admin@goodlife.com' // Zamijenite s admin email adresom
};

// Glavna funkcija za POST zahtjeve
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'sauna_booking':
        return handleSaunaBooking(data);
      case 'trainer_booking':
        return handleTrainerBooking(data);
      case 'get_bookings':
        return getBookings(data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Nepoznata akcija'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Rukovanje sauna rezervacijama
function handleSaunaBooking(data) {
  try {
    const sheet = getSheet(CONFIG.SAUNA_SHEET_NAME);
    
    // Provjeri da li je termin već zauzet
    const existingBooking = checkExistingSaunaBooking(sheet, data.datum, data.vrijeme);
    if (existingBooking) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Termin je već zauzet'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Dodaj rezervaciju
    const row = [
      data.datum,
      data.vrijeme,
      data.ime,
      data.email,
      data.poruka || '',
      'Aktivno',
      new Date().toISOString()
    ];
    
    sheet.appendRow(row);
    
    // Pošalji e-mail potvrdu
    sendSaunaConfirmationEmail(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Rezervacija je uspješno poslana'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Rukovanje trener rezervacijama
function handleTrainerBooking(data) {
  try {
    const sheet = getSheet(CONFIG.TRAINER_SHEET_NAME);
    
    const row = [
      new Date().toISOString(),
      data.ime,
      data.email,
      data.program,
      data.trener,
      data.poruka || '',
      'Novo'
    ];
    
    sheet.appendRow(row);
    
    // Pošalji e-mail treneru
    sendTrainerNotificationEmail(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Rezervacija je uspješno poslana'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Dohvaćanje postojećih rezervacija
function getBookings(data) {
  try {
    const sheet = getSheet(CONFIG.SAUNA_SHEET_NAME);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Preskoči header red
    const bookings = values.slice(1).map(row => ({
      datum: row[0],
      vrijeme: row[1],
      ime: row[2],
      email: row[3],
      poruka: row[4],
      status: row[5],
      datumRezervacije: row[6]
    })).filter(booking => booking.status === 'Aktivno');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      bookings: bookings
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Pomoćne funkcije
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Postavi header redove
    if (sheetName === CONFIG.SAUNA_SHEET_NAME) {
      sheet.getRange(1, 1, 1, 7).setValues([[
        'Datum', 'Vrijeme', 'Ime i prezime', 'Email', 'Poruka', 'Status', 'Datum rezervacije'
      ]]);
    } else if (sheetName === CONFIG.TRAINER_SHEET_NAME) {
      sheet.getRange(1, 1, 1, 7).setValues([[
        'Datum rezervacije', 'Ime i prezime', 'Email', 'Program', 'Trener', 'Poruka', 'Status'
      ]]);
    }
  }
  
  return sheet;
}

function checkExistingSaunaBooking(sheet, datum, vrijeme) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0] === datum && row[1] === vrijeme && row[5] === 'Aktivno') {
      return true;
    }
  }
  return false;
}

function sendSaunaConfirmationEmail(data) {
  const subject = 'Potvrda sauna rezervacije - GoodLife';
  const body = `
Poštovani/a ${data.ime},

Vaša sauna rezervacija je uspješno poslana!

Detalji rezervacije:
- Datum: ${data.datum}
- Vrijeme: ${data.vrijeme}
- Email: ${data.email}

${data.poruka ? 'Napomena: ' + data.poruka : ''}

Hvala vam što ste odabrali GoodLife!

Lijep pozdrav,
GoodLife tim
  `;
  
  GmailApp.sendEmail(data.email, subject, body);
}

function sendTrainerNotificationEmail(data) {
  const trainerEmail = CONFIG.TRAINER_EMAILS[data.trener];
  if (!trainerEmail) return;
  
  const subject = `Nova rezervacija/upit - ${data.trener}`;
  const body = `
Poštovani/a ${data.trener},

Imate novu rezervaciju/upit:

Detalji:
- Ime i prezime: ${data.ime}
- Email: ${data.email}
- Program: ${data.program}
- Poruka: ${data.poruka || 'Nema dodatne poruke'}

Molimo odgovorite klijentu što prije.

Lijep pozdrav,
GoodLife sustav
  `;
  
  GmailApp.sendEmail(trainerEmail, subject, body);
}
