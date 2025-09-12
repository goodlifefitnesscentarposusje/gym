# 🔧 Rješavanje problema s Google Apps Script

## ❌ Problem:
Greška "Script function not found: doGet" ukazuje na to da Apps Script kod nije pravilno postavljen.

## ✅ Rješenje:

### 1. Otvorite Google Apps Script
1. Idite na [script.google.com](https://script.google.com)
2. Otvorite vaš postojeći projekt
3. Ili kreirajte novi projekt

### 2. Zamijenite kod
1. **Obrišite sav postojeći kod**
2. **Zalijepite kod iz `fixed-apps-script-code.js`**
3. **Zamijenite `YOUR_SHEET_ID_HERE` s vašim Sheet ID-om**

### 3. Konfiguracija
U kodu zamijenite:
```javascript
SHEET_ID: 'YOUR_SHEET_ID_HERE', // Vaš Sheet ID
TRAINER_EMAILS: {
  'Tina': 'tina@goodlife.com',    // Prave email adrese
  'Marko': 'marko@goodlife.com',
  'Ivan': 'ivan@goodlife.com'
},
ADMIN_EMAIL: 'admin@goodlife.com' // Vaš admin email
```

### 4. Deployirajte ponovno
1. **Spremite projekt** (Ctrl+S)
2. **Deploy > New deployment**
3. **Type: Web app**
4. **Execute as: Me**
5. **Who has access: Anyone**
6. **Kopirajte novi Web App URL**

### 5. Testiranje
1. Otvorite vašu web stranicu
2. Idite do testne forme (dolje na stranici)
3. Ispunite formu:
   - Ime: Test
   - Prezime: Korisnik
   - Email: vaš@email.com
   - Telefon: 123456789
   - Datum: odaberite budući datum
   - Termin: odaberite bilo koji
   - Trener: odaberite bilo kojeg
   - Napomena: Test rezervacija
4. Kliknite "Rezerviraj"

### 6. Provjera rezultata
1. **U Google Sheets** - trebao bi se pojaviti novi red u tabu "Rezervacije"
2. **U emailu** - trebali biste dobiti potvrdu
3. **Trener** - trebao bi dobiti obavještenje (ako je odabran)

## 📋 Struktura Google Sheets:

**Tab "Rezervacije" će imati kolone:**
- Datum rezervacije
- Ime
- Prezime
- Email
- Telefon
- Datum
- Termin
- Trener
- Napomena
- Status

## 🚨 Česti problemi:

### Problem: "Script function not found: doGet"
**Rješenje:** Koristite `doPost` funkciju, ne `doGet`

### Problem: "Permission denied"
**Rješenje:** 
1. Omogućite Gmail API u Apps Script
2. Pokrenite `testFunction()` jednom za dozvolu

### Problem: "Sheet not found"
**Rješenje:** 
1. Provjerite Sheet ID
2. Kreirajte tab "Rezervacije" ako ne postoji

### Problem: "Email not sent"
**Rješenje:**
1. Provjerite email adrese u konfiguraciji
2. Omogućite Gmail API
3. Pokrenite `testFunction()` za dozvolu

## 🎯 Očekivani rezultat:

Nakon uspješne implementacije:
- ✅ Testna forma šalje podatke na Google Sheets
- ✅ Korisnik dobiva email potvrdu
- ✅ Trener dobiva obavještenje (ako je odabran)
- ✅ Podaci se spremaju u Google Sheets
- ✅ Sustav je spreman za produkciju
