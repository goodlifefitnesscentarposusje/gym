// Dodajte ovu funkciju u Apps Script za popravak postojećih podataka:

function fixExistingData(){
  try {
    const sh = SH();
    const vals = sh.getDataRange().getValues();
    
    console.log('Fixing existing data...');
    
    for(let i = 1; i < vals.length; i++) {
      const r = vals[i];
      const termin = r[5]; // F = Termin
      const telefon = r[3]; // D = Telefon
      
      let needsUpdate = false;
      
      // Fix termin ako je Date objekt
      if(termin instanceof Date) {
        const hours = termin.getHours().toString().padStart(2, '0');
        const minutes = termin.getMinutes().toString().padStart(2, '0');
        const terminStr = `${hours}:${minutes}`;
        
        console.log(`Row ${i}: Fixing termin from Date to "${terminStr}"`);
        sh.getRange(i+1, 6).setValue(terminStr); // F = Termin
        needsUpdate = true;
      }
      
      // Fix telefon ako je #ERROR!
      if(telefon === '#ERROR!' || telefon === '' || telefon === null) {
        console.log(`Row ${i}: Fixing telefon from "${telefon}" to "N/A"`);
        sh.getRange(i+1, 4).setValue('N/A'); // D = Telefon
        needsUpdate = true;
      }
      
      if(needsUpdate) {
        console.log(`Row ${i}: Updated successfully`);
      }
    }
    
    console.log('Data fixing completed');
    return {ok: true};
  } catch(err) {
    console.error('Error fixing data:', err);
    return {ok: false, error: String(err)};
  }
}

// I modificirajte doPost funkciju da uvijek čuva termine kao stringove:
// U dijelu za rezervacije, zamijenite:
sh.appendRow([
  new Date(), // A Timestamp
  data.imeprezime, // B Ime i prezime
  data.email, // C Email
  data.telefon, // D Telefon
  data.datum, // E Datum kao STRING
  data.termin, // F Termin kao STRING (NE new Date!)
  data.napomena||'', // G Napomena
  'Potvrđeno', // H Status
  code // I Kod
]);
