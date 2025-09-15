// U doPost funkciji, u dijelu za rezervacije, zamijenite:
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

// I u doGet funkciji, dodajte formatiranje termina:
function doGet(e){
  const vals = SH().getDataRange().getValues();
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status = (r[7]||'').toString().toLowerCase(); // H = Status
    if(status.startsWith('potvrđeno')){ // uključuje "potvrđeno (podsjetnik)"
      const datum = FMT(r[4]); // E=Datum
      let termin = r[5]; // F=Termin
      
      // FIX: Ako je termin Date objekt, formatiraj ga kao string
      if(termin instanceof Date){
        const hours = termin.getHours().toString().padStart(2, '0');
        const minutes = termin.getMinutes().toString().padStart(2, '0');
        termin = `${hours}:${minutes}`;
      } else {
        termin = termin.toString().trim();
      }
      
      console.log(`Row ${i}: datum=${datum}, termin=${termin}, status=${status}`);
      out.push({ datum: datum, termin: termin });
    }
  }
  console.log('doGet returning:', out);
  return J(out);
}
