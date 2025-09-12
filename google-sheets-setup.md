# Google Sheets Backend Setup za GoodLife Rezervacije

## Korak 1: Kreiranje Google Sheets

1. **Idite na [Google Sheets](https://sheets.google.com)**
2. **Kreirajte novi Sheet s nazivom "GoodLife Rezervacije"**
3. **Kreirajte sljedeće tabove:**

### Tab 1: "Sauna Rezervacije"
Kolone:
- A: Datum (format: YYYY-MM-DD)
- B: Vrijeme (format: HH:MM)
- C: Ime i prezime
- D: Email
- E: Poruka
- F: Status (Aktivno/Otkazano)
- G: Datum rezervacije (timestamp)

### Tab 2: "Trener Rezervacije"
Kolone:
- A: Datum rezervacije (timestamp)
- B: Ime i prezime
- C: Email
- D: Program
- E: Trener
- F: Poruka
- G: Status (Novo/Pročitano/Odgovoreno)

## Korak 2: Google Apps Script Setup

1. **U Google Sheets, idite na Extensions > Apps Script**
2. **Zamijenite postojeći kod s kodom iz `apps-script-code.js`**
3. **Spremite projekt**
4. **Deployirajte kao Web App:**
   - Deploy > New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. **Kopirajte Web App URL**

## Korak 3: Konfiguracija

1. **U `config.js` postavite:**
   - Google Sheets ID (iz URL-a)
   - Web App URL
   - Trener email adrese

## Korak 4: Testiranje

1. **Testirajte sauna rezervacije**
2. **Testirajte trener rezervacije**
3. **Provjerite e-mail potvrde**
