/* Read-only comparisons against immutable day captures. */
(function(root){
 'use strict';
 const P=typeof module!=='undefined'&&module.exports?require('./dayform-model.js'):root.Planner;
 function dayDeviation(week,day){
  const snapshot=week.daySnapshots?.[day];if(!snapshot)return null;
  const current=new Map(week.items.map(item=>[item.id,item]));
  const ids=new Set(snapshot.items.map(item=>item.id));
  const changes=[];
  for(const before of snapshot.items){
   const after=current.get(before.id);
   if(!after)changes.push({kind:'removed',before});
   else if(['day','start','end','title','cat'].some(key=>before[key]!==after[key]))changes.push({kind:'changed',before,after});
  }
  for(const after of week.items.filter(item=>item.day===day&&!ids.has(item.id)))changes.push({kind:'added',after});
  const planned=snapshot.items.reduce((sum,item)=>sum+P.duration(item),0);
  const currentMinutes=week.items.filter(item=>item.day===day).reduce((sum,item)=>sum+P.duration(item),0);
  return {changes,planned,current:currentMinutes,delta:currentMinutes-planned};
 }
 function summaryGroups(items,catalog){
  const groups=[{id:'family',label:'Familie'},{id:'private',label:'Privat & Alltag'},{id:'sport',label:'Sport'},{id:'break',label:'Pausen / Puffer'},{id:'work',label:'Arbeit'},{id:'other',label:'Sonstiges'}];
  const groupFor=item=>{
   const group=P.timeGroup(item.cat,catalog);
   return group==='private'&&['Familie','Schule'].includes(item.cat)?'family':group;
  };
  return groups.map(group=>({...group,minutes:items.filter(item=>groupFor(item)===group.id).reduce((sum,item)=>sum+P.duration(item),0)})).filter(group=>group.minutes);
 }
 Object.assign(P,{dayDeviation,summaryGroups});
 if(typeof module!=='undefined'&&module.exports)module.exports=P;
})(globalThis);
