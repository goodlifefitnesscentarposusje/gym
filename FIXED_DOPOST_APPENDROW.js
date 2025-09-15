// U doPost funkciji, zamijenite ovaj dio:
sh.appendRow([
  new Date(), // A Timestamp
  data.imeprezime, // B Ime i prezime
  data.email, // C Email
  data.telefon, // D Telefon
  data.datum, // E Datum kao STRING (ne new Date!)
  data.termin, // F Termin kao STRING
  data.napomena||'', // G Napomena
  'potvrđeno', // H Status
  code // I Kod
]);
