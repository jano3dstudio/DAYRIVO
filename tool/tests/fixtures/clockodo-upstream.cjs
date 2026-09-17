// Explicitly loaded by the Windows launcher test only. Never calls the network.
global.fetch=async()=>({ok:true,json:async()=>({data:[{id:7,name:'Dummy client',active:true}],paging:{current_page:1,count_pages:1,count_items:1}})});
