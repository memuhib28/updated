import {type Data,dates,status} from './core';
export function reportData(data:Data,from:string,to:string,tz:string){
 const days=dates(from,to).map(date=>({date,...status(data,date,tz)}));
 const bins=[0,0,0,0];let medicationDays=0;
 for(const d of days){const pain=d.daily?.checkIn?.peakPain??(d.attacks.length?Math.max(...d.attacks.map(a=>a.pain)):null);if(pain!==null)bins[pain===0?0:pain<=3?1:pain<=6?2:3]++;
 if(d.daily?.checkIn?.medicine==='yes'||d.attacks.some(a=>a.medication||a.taken))medicationDays++;
 }
 const context=new Map<string,number>();for(const d of days)for(const c of d.daily?.checkIn?.context??[])context.set(c,(context.get(c)??0)+1);
 return {days,bins,rated:bins.reduce((a,b)=>a+b,0),medicationDays,context:[...context.entries()],recorded:days.filter(d=>d.kind!=='unrecorded').length,headache:days.filter(d=>d.kind==='headache').length,free:days.filter(d=>d.kind==='free').length,unknown:days.filter(d=>d.kind==='unsure').length,missing:days.filter(d=>d.kind==='unrecorded').length};
}
