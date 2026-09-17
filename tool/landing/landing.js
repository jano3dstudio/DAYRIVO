(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const nodes = [...document.querySelectorAll('[data-t]')];
  const en = Object.fromEntries(nodes.map(node => [node.dataset.t, node.textContent]));
  const de = {
    skip: 'Zum Inhalt', navWhy: 'Warum DAYRIVO', navHow: 'Dein Rhythmus', navFaq: 'Gut zu wissen',
    open: 'Planer öffnen', eyebrow: 'Ein bisschen Struktur. Viel mehr Leben.',
    heroFirst: 'Leben zuerst.', heroSecond: 'Arbeit im Flow.',
    heroText: 'Du bist mehr als deine Aufgabenliste. Schaffe Platz für konzentrierte Arbeit, frische Luft und alles, was deine Woche ausmacht.',
    cta: 'Finde deinen Rhythmus', film: 'Film ansehen', localNote: 'Kein Konto. Deine Pläne bleiben in deinem Browser.',
    previewTitle: 'Eine Woche mit Platz für dich.', previewNote: 'Die echte App. Eine Beispielwoche.', tryLook: 'Dein Stil. Probiere einen Look',
    stripOne: 'Ziehen. Ablegen. Weitermachen.', stripTwo: 'Ein Plan, der flexibel bleibt.', stripThree: 'Kleine Erfolge. Echter Fortschritt.', stripFour: 'Von Grund auf lokal.',
    whyEye: 'FÜR MENSCHEN MIT VIELEN ROLLEN', whyTitle: 'Ein erfülltes Leben.', whySecond: 'Mehr als ein voller Kalender.',
    whyText: 'Kundenarbeit. Kinder zur Schule. Die Idee, die dich nicht loslässt. Hier bekommt alles seinen Platz.',
    demoFocus: 'Konzentriert arbeiten', demoAir: 'Ein bisschen frische Luft', demoLife: 'Zeit für deine Menschen',
    benefitOne: 'Auch das Leben bekommt Zeit.', benefitOneText: 'Arbeit und persönliche Zeit in einer Ansicht, klar nach Kategorien getrennt. Deine Prioritäten geben die Reihenfolge vor.',
    tue: 'DI', thu: 'DO', demoIdea: 'Etwas Gutes schaffen.', moveCaption: 'Dieselbe Idee. Ein besserer Moment.',
    benefitTwo: 'Plan ändern. Im Flow bleiben.', benefitTwoText: 'Verschiebe einen Eintrag auf einen anderen Tag, verlängere einen Zeitblock oder nutze eine Vorlage. Änderungen brauchen keinen Neustart.',
    demoFinish: 'Die letzten kleinen Details.', winHint: 'Los, setz den Haken.', interactive: 'Ein kleiner Erfolg. Einfach fürs Gefühl.',
    benefitThree: 'Sehen, was du geschafft hast.', benefitThreeText: 'Halte morgens deinen Plan fest. Hake im Laufe des Tages ab. Vergleiche deinen Fortschritt mit dem Plan, mit dem du wirklich gestartet bist.',
    rhythmEye: 'WENIGER EINRICHTEN. MEHR LOSLEGEN.', rhythmTitle: 'Deine Woche.', rhythmSecond: 'Nach deinem Takt.',
    rhythmText: 'Manche Wochen brauchen Fokus. Andere brauchen Luft. Speichere die Routinen, die für dich funktionieren, und gib jeder Woche ihre eigene Form.',
    rhythmLink: 'Gestalte eine Woche, die passt', routineTitle: 'Starte mit deinem Rhythmus.',
    routineText: 'Fokus, Balance, Projekt-Endspurt oder Urlaub. Wähle einen Ausgangspunkt und passe ihn an dich an.',
    timeTitle: 'Wissen, wo deine Zeit bleibt.', timeText: 'Trage tatsächliche Arbeitszeit manuell ein. Planung, erledigte Aufgaben und Honorare bleiben klar getrennt.',
    lookTitle: 'Ein Arbeitsplatz, der zu dir passt.', lookText: 'Deine Farben, Kategorien, Icons und gespeicherten Looks. Eine ruhige Oberfläche mit Persönlichkeit.',
    filmEye: '22 SEKUNDEN. EINE ANDERE ART VON WOCHE.', filmFirst: 'Weniger jonglieren.', filmSecond: 'Mehr leben.', filmLanguage: 'Englisch · 00:22',
    faqEye: 'EIN PAAR DINGE VORWEG.', faqTitle: 'Gut zu wissen.', faqIntro: 'Einfache Werkzeuge verdienen klare Antworten.',
    q1: 'Brauche ich ein Konto?', a1: 'Nein. Der aktuelle Planer läuft in deinem Browser, ohne Konto und ohne App-Server. Öffne ihn und wähle eine Vorlage für den Start.',
    q2: 'Wo werden meine Pläne gespeichert?', a2: 'In diesem Browser, auf diesem Gerät. Es gibt keine automatische Cloud-Synchronisation. Erstelle mit Backup eine separate Kopie und nutze bei Bedarf Wiederherstellen. Das Löschen von Browserdaten kann deine Pläne entfernen.',
    q3: 'Ist das nur für Arbeit gedacht?', a3: 'Deine ganze Woche gehört hierher: Arbeit, Familie, Sport, Pausen und eigene Projekte. Kategorien trennen die Bereiche in deiner Übersicht.',
    q4: 'Wird meine Arbeitszeit automatisch erfasst?', a4: 'Nein. Du trägst tatsächliche Arbeitszeit manuell ein. Ein Haken macht aus geplanter Dauer keine erfasste Arbeitszeit. Die Clockodo-Anbindung ist geplant, aber noch nicht verbunden.',
    q5: 'Kann ich den Planer am Handy nutzen?', a5: 'Die Ansicht passt sich kleineren Bildschirmen an und zeigt einen Tag nach dem anderen. Der Rechner bleibt der Hauptarbeitsplatz. Handy und Computer speichern getrennt, solange du kein Backup überträgst.',
    finalEye: 'MACH EIN BISSCHEN PLATZ FÜR DICH.', finalFirst: 'Dein Tag.', finalSecond: 'Dein Rhythmus.',
    finalNote: 'Vorlage wählen. Anpassen. Einen Tag nach dem anderen.', footer: 'Lokal gedacht. Leben zuerst.',
    videoError: 'Der Film konnte nicht geladen werden. Bitte prüfe, ob die Videodatei zusammen mit dieser Seite vorhanden ist.'
  };
  let language = 'en';
  let complete = false;
  function winLabels() {
    $('winStatus').textContent = complete ? (language === 'de' ? 'Geschafft. Fühlt sich gut an.' : 'Done. That feels good.') : (language === 'de' ? de.winHint : en.winHint);
    $('winButton').setAttribute('aria-label', language === 'de' ? (complete ? 'Beispielaufgabe wieder öffnen' : 'Beispielaufgabe erledigen') : (complete ? 'Reopen demo task' : 'Mark demo task complete'));
  }
  function translate(next) {
    language = next;
    document.documentElement.lang = next;
    nodes.forEach(node => { node.textContent = (next === 'de' ? de : en)[node.dataset.t] || en[node.dataset.t]; });
    $('language').innerHTML = next === 'de' ? 'DE <span>↔</span> EN' : 'EN <span>↔</span> DE';
    $('language').setAttribute('aria-label', next === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln');
    $('closeFilm').setAttribute('aria-label', next === 'de' ? 'Film schließen' : 'Close film');
    document.querySelectorAll('[data-film]').forEach(button => button.setAttribute('aria-label', next === 'de' ? '22 Sekunden langen Film auf Englisch abspielen' : 'Play the 22-second film in English'));
    document.title = next === 'de' ? 'DAYRIVO — Dein Tag. Dein Rhythmus.' : 'DAYRIVO — Your day. Your rhythm.';
    winLabels();
    try { localStorage.setItem('dayrivoLandingLanguage', next); } catch {}
  }
  try { language = localStorage.getItem('dayrivoLandingLanguage') === 'de' ? 'de' : 'en'; } catch {}
  translate(language);
  $('language').addEventListener('click', () => translate(language === 'en' ? 'de' : 'en'));

  const names = {rainbow:'Rainbow', arcade:'Neon Arcade', glacier:'Glacier'};
  document.querySelectorAll('[data-look]').forEach(button => button.addEventListener('click', () => {
    const look = button.dataset.look;
    $('weekPreview').src = 'assets/week-' + look + '.jpg';
    $('mobilePreview').srcset = 'assets/week-' + look + '-mobile.jpg';
    $('lookName').textContent = names[look];
    document.querySelectorAll('[data-look]').forEach(other => {
      other.classList.toggle('selected', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
  }));
  $('winButton').addEventListener('click', () => {
    complete = !complete;
    $('winButton').setAttribute('aria-pressed', String(complete));
    winLabels();
    $('confetti').replaceChildren();
    if (!complete || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#3cff91','#ffb28e','#bbaaed','#96d4df','#e9e575'];
    for (let i=0;i<24;i++) {
      const piece = document.createElement('i'), angle = i/24 * Math.PI*2, distance = 38+Math.random()*80;
      piece.className = 'confetti-piece';
      piece.style.cssText = '--x:'+Math.cos(angle)*distance+'px;--y:'+Math.sin(angle)*distance+'px;--spin:'+(i*53)+'deg;background:'+colors[i%colors.length];
      $('confetti').append(piece);
    }
    setTimeout(() => $('confetti').replaceChildren(), 850);
  });
  const dialog = $('filmDialog'), video = $('filmVideo');
  let filmTrigger;
  document.querySelectorAll('[data-film]').forEach(button => button.addEventListener('click', () => {
    filmTrigger = button;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const play = video.play();
    if (play) play.catch(() => { /* Native controls remain available. */ });
  }));
  function closeFilm() { if (dialog.open) dialog.close(); }
  $('closeFilm').addEventListener('click', closeFilm);
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)) closeFilm();
  });
  dialog.addEventListener('close', () => { video.pause(); document.body.style.overflow=''; filmTrigger?.focus(); });
  video.addEventListener('error', () => { $('videoError').hidden=false; });
  video.querySelector('source').addEventListener('error', () => { $('videoError').hidden=false; });
})();
