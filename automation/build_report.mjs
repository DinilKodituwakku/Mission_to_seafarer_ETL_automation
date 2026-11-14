import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const bundledNode = path.join(process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node');
const resolveBundled = createRequire(path.join(bundledNode, 'package.json'));
const {Workbook, SpreadsheetFile} = await import(pathToFileURL(resolveBundled.resolve('@oai/artifact-tool')).href);
const input = JSON.parse(await fs.readFile('automation/michael_report_data.tmp.json','utf8'));
const out = 'outputs/seafarer_report';
const wb=Workbook.create();
const views = [['Daily','Day'], ['Month to date','Month to date'], ['Quarter to date','Quarter to date']];
for (const [sheetName, period] of views) {
 const ws=wb.worksheets.add(sheetName); ws.showGridLines=false;
 const total=input.totals.find(r=>r[0]===period && r[2]===input.latest);
 if (!total) throw new Error(`No ${period} data for ${input.latest}`);
 const shipRows=input.ships.filter(r=>r[0]===period && r[2]===input.latest).sort((a,b)=>a[3].localeCompare(b[3]));
 const berthRows=input.berths.filter(r=>r[0]===period && r[2]===input.latest).sort((a,b)=>a[3].localeCompare(b[3]));
 ws.getRange('A1:F1').merge(); ws.getRange('A1').values=[[`Seafarer visits | ${sheetName}`]];
 ws.getRange('A1:F1').format={fill:'#163451',font:{name:'Aptos',size:16,bold:true,color:'#FFFFFF'}};
 ws.getRange('A1').format.rowHeight=30;
 ws.getRange('A2:F2').merge(); ws.getRange('A2').values=[[`Period: ${total[1]} to ${total[2]} (latest collected day)`]];
 ws.getRange('A3:F3').merge(); ws.getRange('A3').values=[['Partial records: missing snapshots or unmatched sign-ins can undercount visits.']];
 ws.getRange('A3:F3').format.fill='#FFF3CC';
 ws.getRange('A4:F4').merge(); ws.getRange('A4').values=[[total[7]]];
 ws.getRange('A5:F5').merge(); ws.getRange('A5').values=[['Crew estimated at 22 per ship. Blank means sign-in coverage is unknown.']];
 ws.getRange('A6:F6').merge(); ws.getRange('A6').values=[['For earlier dates, open the Totals history, Ship history or Berth history tab.']];
 ws.getRange('A7:F7').merge(); ws.getRange('A7').values=[['People are counted once per ship per period. A ship may appear at more than one berth.']];
 ws.getRange('A2:F7').format.font={name:'Aptos',size:10,color:'#334155'};
 ws.getRange('A8:D8').values=[['Total ships recorded','Total crew who visited','Estimated total crew','% of estimated crew']];
 ws.getRange('A9:D9').values=[[total[3],total[4],total[5],total[6]]];
 ws.getRange('D9').setNumberFormat('0.0%');
 ws.getRange('A8:D8').format={fill:'#24587A',font:{name:'Aptos',bold:true,color:'#FFFFFF'}};
 ws.getRange('A9:D9').format={fill:'#EDF4F7',font:{name:'Aptos',size:12,bold:true,color:'#163451'}};
 ws.getRange('A11:F11').merge(); ws.getRange('A11').values=[['Crew visits by ship']];
 ws.getRange('A11:F11').format={fill:'#163451',font:{name:'Aptos',bold:true,color:'#FFFFFF'}};
 ws.getRange('A12:E12').values=[['Ship name','Berths recorded','Crew who visited','Estimated ship crew','% of ship crew']];
 if (shipRows.length) {
   ws.getRange(`A13:E${12+shipRows.length}`).values=shipRows.map(r=>[r[3],r[4],r[5],r[6],r[7]]);
   ws.getRange(`E13:E${12+shipRows.length}`).setNumberFormat('0.0%');
   ws.tables.add(`A12:E${12+shipRows.length}`,true,`CurrentShips${sheetName.replaceAll(' ','')}`);
 }
 const berthTitle=15+shipRows.length, berthHead=berthTitle+1, berthStart=berthHead+1;
 ws.getRange(`A${berthTitle}:F${berthTitle}`).merge(); ws.getRange(`A${berthTitle}`).values=[['Crew visits by berth']];
 ws.getRange(`A${berthTitle}:F${berthTitle}`).format={fill:'#163451',font:{name:'Aptos',bold:true,color:'#FFFFFF'}};
 ws.getRange(`A${berthHead}:E${berthHead}`).values=[['Berth','Ships recorded at berth','Crew who visited','Estimated berth crew','% of berth crew']];
 if (berthRows.length) {
   ws.getRange(`A${berthStart}:E${berthHead+berthRows.length}`).values=berthRows.map(r=>[r[3],r[4],r[5],r[6],r[7]]);
   ws.getRange(`E${berthStart}:E${berthHead+berthRows.length}`).setNumberFormat('0.0%');
   ws.tables.add(`A${berthHead}:E${berthHead+berthRows.length}`,true,`CurrentBerths${sheetName.replaceAll(' ','')}`);
 }
 ws.getRange('A:A').format.columnWidth=30; ws.getRange('B:B').format.columnWidth=26;
 ws.getRange('C:E').format.columnWidth=24; ws.getRange('F:F').format.columnWidth=18;
 ws.freezePanes.freezeRows(6);
}
const defs=[
 ['Totals history','Totals',input.totals,['From','Up to','Total ships recorded','Crew who visited','Estimated total crew','% of estimated crew','Coverage','Status']],
 ['Ship history','Ship',input.ships,['From','Up to','Ship name','Berths recorded','Crew who visited','Estimated ship crew','% of ship crew','Coverage','Status']],
 ['Berth history','Berth',input.berths,['From','Up to','Berth','Ships recorded at berth','Crew who visited','Estimated berth crew','% of berth crew','Coverage','Status']]
];
for (const [name,key,records,headers] of defs){
 const ws=wb.worksheets.add(name); ws.showGridLines=false;
 const endcol=String.fromCharCode(64+headers.length);
 ws.getRange(`A1:${endcol}1`).merge(); ws.getRange('A1').values=[[`${name}: daily, monthly and quarterly`]];
 ws.getRange(`A1:${endcol}1`).format={fill:'#163451',font:{name:'Aptos',size:16,bold:true,color:'#FFFFFF'}}; ws.getRange('A1').format.rowHeight=30;
 ws.getRange(`A2:${endcol}2`).merge(); ws.getRange('A2').values=[['Three separate tables below: Daily, Monthly and Quarterly. Filter each table by its dates.']];
 ws.getRange(`A3:${endcol}3`).merge(); ws.getRange('A3').values=[['Partial records: missing snapshots and unmatched sign-ins can undercount visits.']];
 ws.getRange(`A3:${endcol}3`).format.fill='#FFF3CC';
 ws.getRange(`A4:${endcol}4`).merge(); ws.getRange('A4').values=[['Crew estimate: 22 per ship. Names counted once per ship in each selected period.']];
 ws.getRange(`A5:${endcol}5`).merge(); ws.getRange('A5').values=[['A ship can appear at more than one berth. Do not add berth totals together.']];
 ws.getRange(`A6:${endcol}6`).merge(); ws.getRange('A6').values=[['Blank counts mean sign-in coverage is unknown. Monthly and quarterly figures end on the date shown.']];
 ws.getRange(`A2:${endcol}6`).format.font={name:'Aptos',size:10,color:'#334155'};
 ws.getRange('A:B').format.columnWidth=15;
 if(key==='Totals'){ws.getRange('C:F').format.columnWidth=24;ws.getRange('G:G').format.columnWidth=52;ws.getRange('H:H').format.columnWidth=24;}
 else if(key==='Ship'){ws.getRange('C:C').format.columnWidth=29;ws.getRange('D:D').format.columnWidth=25;ws.getRange('E:G').format.columnWidth=24;ws.getRange('H:H').format.columnWidth=52;ws.getRange('I:I').format.columnWidth=24;}
 else {ws.getRange('C:C').format.columnWidth=16;ws.getRange('D:G').format.columnWidth=26;ws.getRange('H:H').format.columnWidth=52;ws.getRange('I:I').format.columnWidth=24;}
 let pos=8;
 for (const [label,kind,suffix] of [['Daily','Day','Day'],['Monthly','Month history','Month'],['Quarterly','Quarter history','Quarter']]) {
  const items=records.filter(r=>r[0]===kind).sort((a,b)=>b[2].localeCompare(a[2]) || String(a[3]??'').localeCompare(String(b[3]??'')));
  ws.getRange(`A${pos}:${endcol}${pos}`).merge(); ws.getRange(`A${pos}`).values=[[`${label} ${key.toLowerCase()} figures`]];
  ws.getRange(`A${pos}:${endcol}${pos}`).format={fill:'#163451',font:{name:'Aptos',bold:true,color:'#FFFFFF'}};
  const header=pos+1, last=header+items.length;
  ws.getRange(`A${header}:${endcol}${header}`).values=[headers];
  if(items.length){
   ws.getRange(`A${header+1}:${endcol}${last}`).values=items.map(r=>r.slice(1));
   const table=ws.tables.add(`A${header}:${endcol}${last}`,true,`History${key}${suffix}`); table.showFilterButton=true;
   const percentCol=key==='Totals'?'F':'G'; ws.getRange(`${percentCol}${header+1}:${percentCol}${last}`).setNumberFormat('0.0%');
  }
  ws.getRange(`A${header}:${endcol}${header}`).format={fill:'#24587A',font:{name:'Aptos',bold:true,color:'#FFFFFF'},rowHeight:26};
  pos=last+3;
 }
 ws.freezePanes.freezeRows(6);
}
wb.recalculate();
if(process.env.REPORT_PREVIEW === '1') for(const [name] of [...views,...defs]){const png=await wb.render({sheetName:name,range:name==='Daily'||name.includes('to date')?'A1:F20':'A1:J16',scale:1,format:'png'});await fs.writeFile(`${out}/${name}.png`,new Uint8Array(await png.arrayBuffer()));}
const target=path.join(out,'Seafarer visits report.xlsx');
const temporary=path.join(out,`.seafarer-report-${process.pid}.xlsx`);
try { const f=await SpreadsheetFile.exportXlsx(wb); await f.save(temporary); await fs.rename(temporary,target); }
finally { await fs.rm(temporary,{force:true}); await fs.rm(`${temporary}.inspect.ndjson`,{force:true}); }
console.log('Exported workbook:',input.totals.length,input.ships.length,input.berths.length);
