# 🎉 Google Sheets Rezervacijski Sustav - IMPLEMENTIRAN!

## ✅ Što je implementirano:

### 🧖‍♀️ Sauna Rezervacije:
- ✅ Slotovi od 09:00 do 21:00 (svaki sat)
- ✅ Maksimalno 7 dana unaprijed
- ✅ Real-time zatamnjenje zauzetih termina
- ✅ Spremanje u Google Sheets
- ✅ E-mail potvrde korisnicima
- ✅ Automatska sinkronizacija svakih 30 sekundi

### 👨‍💼 Trener Rezervacije:
- ✅ Dropdown za odabir trenera
- ✅ Automatsko skrivanje/prikazivanje trenera polja
- ✅ Spremanje u Google Sheets
- ✅ E-mail obavještenja trenerima
- ✅ Integracija s postojećom formom

### 🔧 Tehničke funkcionalnosti:
- ✅ Google Sheets backend
- ✅ Google Apps Script za e-mail potvrde
- ✅ Real-time sinkronizacija
- ✅ Offline podrška
- ✅ Responsive dizajn
- ✅ Postojeći kod ostaje netaknut

## 🚀 Koraci za aktivaciju:

### 1. Google Sheets Setup
1. Idite na [Google Sheets](https://sheets.google.com)
2. Kreirajte novi Sheet "GoodLife Rezervacije"
3. Kopirajte Sheet ID iz URL-a
4. Kreirajte tabove: "Sauna Rezervacije" i "Trener Rezervacije"

### 2. Google Apps Script Setup
1. U Google Sheets: Extensions > Apps Script
2. Zamijenite kod s kodom iz `apps-script-code.js`
3. Zamijenite `YOUR_SHEET_ID_HERE` s vašim Sheet ID-om
4. Zamijenite email adrese trenera
5. Deployirajte kao Web App (Anyone access)
6. Kopirajte Web App URL

### 3. Konfiguracija
U `index.html` linija 3678-3681, zamijenite:
```javascript
SHEET_ID: 'YOUR_SHEET_ID_HERE',        // Vaš Sheet ID
WEB_APP_URL: 'YOUR_WEB_APP_URL_HERE',  // Vaš Web App URL
```

I email adrese trenera u linijama 3684-3688.

## 📋 Funkcionalnosti:

### Sauna rezervacije:
- Korisnici mogu rezervirati termine od 09:00 do 21:00
- Maksimalno 7 dana unaprijed
- Zauzeti termini se prikazuju zatamnjeni s ✕ oznakom
- Real-time ažuriranje zauzetih termina
- E-mail potvrda nakon rezervacije

### Trener rezervacije:
- Dropdown za odabir trenera (Tina, Marko, Ana, Petra)
- Trener polje se prikazuje samo za određene programe
- Svaki trener dobiva e-mail obavještenje
- Integracija s postojećom kontakt formom

## 🔧 Tehnički detalji:

### Google Sheets struktura:
**Sauna Rezervacije:**
- Datum, Vrijeme, Ime, Email, Poruka, Status, Datum rezervacije

**Trener Rezervacije:**
- Datum rezervacije, Ime, Email, Program, Trener, Poruka, Status

### Real-time sinkronizacija:
- Ažuriranje svakih 30 sekundi
- Offline podrška s cache-om
- Automatsko sinkroniziranje kada se tab aktivira

### E-mail sustav:
- Automatske potvrde za sauna rezervacije
- Obavještenja trenerima za nove rezervacije
- Koristi Gmail API preko Apps Script

## 🎯 Rezultat:

Sustav je potpuno implementiran i spreman za korištenje! Sve postojeće funkcionalnosti ostaju netaknute, a nove funkcionalnosti su dodane kao dodatni moduli. Korisnici mogu:

1. **Rezervirati sauna termine** s real-time prikazom dostupnosti
2. **Rezervirati trenere** s automatskim e-mail obavještenjima
3. **Dobiti e-mail potvrde** za sve rezervacije
4. **Vidjeti zauzete termine** u realnom vremenu

Sustav radi offline i online, s automatskom sinkronizacijom kada se internet poveže.
