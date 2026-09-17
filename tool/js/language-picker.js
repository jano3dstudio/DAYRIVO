'use strict';
function syncLanguagePicker() {
  const current=I18N.languages.find(language=>language.id===I18N.language);
  $('languageLabel').textContent=current.name;
  for(const option of $('languageMenu').children)option.setAttribute('aria-checked',String(option.dataset.language===I18N.language));
}
function initializeLanguagePicker() {
  const button=$('languageButton'),menu=$('languageMenu'),wrapper=button.closest('.language-picker');
  const close=(restoreFocus=false)=>{menu.hidden=true;button.setAttribute('aria-expanded','false');if(restoreFocus)button.focus({preventScroll:true});};
  const open=()=>{closeMenu();syncLanguagePicker();menu.hidden=false;button.setAttribute('aria-expanded','true');menu.querySelector('[aria-checked=true]')?.focus({preventScroll:true});};
  $('languageSelect').replaceChildren();
  for(const language of I18N.languages){
    $('languageSelect').add(new Option(language.name,language.id));
    const option=document.createElement('button');option.type='button';option.tabIndex=-1;option.dataset.language=language.id;option.lang=language.id;
    option.setAttribute('role','menuitemradio');
    const label=document.createElement('span');label.textContent=language.name;
    const check=document.createElement('span');check.className='language-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
    option.append(label,check);
    option.onclick=()=>{if(language.id!==I18N.language){$('languageSelect').value=language.id;$('languageSelect').dispatchEvent(new Event('change',{bubbles:true}));}close(true);};
    menu.append(option);
  }
  button.onclick=()=>menu.hidden?open():close(true);
  button.onkeydown=event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open();}};
  menu.onkeydown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
    if(event.key==='Tab'){close(true);return;}
    const options=[...menu.children],index=options.indexOf(document.activeElement);
    let next;
    if(event.key==='ArrowDown')next=(index+1)%options.length;
    if(event.key==='ArrowUp')next=(index-1+options.length)%options.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=options.length-1;
    if(next!==undefined){event.preventDefault();options[next].focus();}
  };
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!wrapper.contains(event.target))close();});
  document.addEventListener('focusin',event=>{if(!menu.hidden&&!wrapper.contains(event.target))close();});
  window.addEventListener('resize',()=>close());
}
