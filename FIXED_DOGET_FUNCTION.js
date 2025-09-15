/************** GET: zauzeti slotovi (za zatamnjenje) **************/
function doGet(e){
  const vals = SH().getDataRange().getValues();
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const status = (r[7]||'').toString().toLowerCase(); // H = Status
    if(status.startsWith('potvrđeno')){ // uključuje "potvrđeno (podsjetnik)"
      // FIX: termin je u koloni F (index 5), ali se čuva kao string "16:00"
      const datum = FMT(r[4]); // E=Datum
      const termin = (r[5]||'').toString().trim(); // F=Termin kao string
      
      // Debug log
      console.log(`Row ${i}: datum=${datum}, termin=${termin}, status=${status}`);
      
      out.push({ datum: datum, termin: termin });
    }
  }
  console.log('doGet returning:', out);
  return J(out);
}
