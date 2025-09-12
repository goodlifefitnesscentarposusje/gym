# Instrukcije za implementaciju Google Sheets rezervacijskog sustava

## Korak 1: Postavljanje Google Sheets

1. **Idite na [Google Sheets](https://sheets.google.com)**
2. **Kreirajte novi Sheet s nazivom "GoodLife Rezervacije"**
3. **Kopirajte Sheet ID iz URL-a** (dio između `/d/` i `/edit`)
4. **Kreirajte dva taba:**
   - "Sauna Rezervacije"
   - "Trener Rezervacije"

## Korak 2: Postavljanje Google Apps Script

1. **U Google Sheets, idite na Extensions > Apps Script**
2. **Zamijenite postojeći kod s kodom iz `apps-script-code.js`**
3. **U `apps-script-code.js` zamijenite:**
   - `YOUR_SHEET_ID_HERE` s vašim Sheet ID-om
   - Email adrese trenera s pravim adresama
   - Admin email adresu
4. **Spremite projekt**
5. **Deployirajte kao Web App:**
   - Deploy > New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
6. **Kopirajte Web App URL**

## Korak 3: Konfiguracija JavaScript datoteka

1. **U `google-sheets-api.js` zamijenite:**
   - `YOUR_SHEET_ID_HERE` s vašim Sheet ID-om
   - `YOUR_WEB_APP_URL_HERE` s vašim Web App URL-om
   - Email adrese trenera s pravim adresama

## Korak 4: Integracija u postojeći HTML

1. **Otvorite `index.html`**
2. **Na kraju datoteke, prije zatvaranja `</body>` taga, dodajte:**

```html
<!-- Google Sheets Backend Integration -->
<script src="google-sheets-api.js"></script>
<script src="sauna-google-sheets.js"></script>
<script src="trainer-booking-system.js"></script>

<!-- Dodajte CSS i JavaScript iz integration-code.html -->
```

3. **Kopirajte CSS i JavaScript kod iz `integration-code.html`**

## Korak 5: Testiranje

1. **Otvorite web stranicu**
2. **Testirajte sauna rezervacije:**
   - Odaberite datum
   - Odaberite termin
   - Ispunite formu
   - Provjerite da li se rezervacija pojavila u Google Sheets
3. **Testirajte trener rezervacije:**
   - Odaberite program
   - Odaberite trenera
   - Ispunite formu
   - Provjerite da li je trener dobio email

## Korak 6: Provjera funkcionalnosti

### Sauna rezervacije:
- ✅ Slotovi od 09:00 do 21:00
- ✅ Maksimalno 7 dana unaprijed
- ✅ Zatamnjenje zauzetih termina
- ✅ Spremanje u Google Sheets
- ✅ Real-time sinkronizacija
- ✅ Email potvrde

### Trener rezervacije:
- ✅ Odabir trenera iz dropdown-a
- ✅ Spremanje u Google Sheets
- ✅ Email obavještenja trenerima
- ✅ Integracija s postojećom formom

## Napomene:

1. **Postojeći kod ostaje netaknut** - sve nove funkcionalnosti su dodane kao dodatni moduli
2. **Real-time sinkronizacija** - zauzeti termini se ažuriraju svakih 30 sekundi
3. **Offline podrška** - sustav radi i kada nema interneta (koristi cache)
4. **Responsive dizajn** - sve funkcionalnosti rade na mobilnim uređajima

## Rješavanje problema:

### Ako rezervacije ne rade:
1. Provjerite da li je Web App URL ispravan
2. Provjerite da li je Sheet ID ispravan
3. Provjerite konzolu preglednika za greške

### Ako email potvrde ne rade:
1. Provjerite da li su email adrese ispravne u Apps Script kodu
2. Provjerite da li je Gmail API omogućen u Apps Script projektu

### Ako se zauzeti termini ne prikazuju:
1. Provjerite da li se podaci spremaju u Google Sheets
2. Provjerite da li je Web App URL dostupan
3. Provjerite konzolu preglednika za greške
