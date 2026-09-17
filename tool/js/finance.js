/* Separate plan preview and recorded work. Completed fees never fall back to plan duration. */
'use strict';
function moneyLabel(cents) { return new Intl.NumberFormat(I18N.locale,{style:'currency',currency:'EUR'}).format(cents/100); }
function updateFeePreview() {
  const start = $('itemStart').value, end = $('itemEnd').value;
  let rate = null;
  try { rate = P.parseRate($('itemHourlyRate').value); } catch (_) { /* Save shows validation. */ }
  $('itemFeePreview').textContent = rate !== null && P.validTime(start) && P.validTime(end) && P.minutes(end)>P.minutes(start)
    ? moneyLabel(Math.round((P.minutes(end)-P.minutes(start))*rate/60)) : '—';
  let actual = null; try { actual = P.parseActualTime($('itemActualTime').value); } catch (_) {}
  $('itemActualFeePreview').textContent = rate !== null && actual !== null ? moneyLabel(Math.round(actual*rate/60)) : '—';
}
function financeSummary(items,period) {
  const values = P.recordedWorkMetrics(items,data.masterData);
  const missingTime = values.missingTimeCount ? tr`Abgehakte Jobs ohne erfasste Arbeitszeit: ${values.missingTimeCount}. Noch nicht eingerechnet.` : '';
  const missingRate = values.missingRateCount ? tr`Erfasste Jobs ohne Stundensatz: ${values.missingRateCount} (${P.durationLabel(values.missingRateMinutes)}), ohne Honorarbewertung.` : '';
  return `<section class="finance-summary" aria-label="${t('Honorarübersicht')}"><div class="finance-heading"><h3>${t('Honorarübersicht')}</h3><span>${t(period)}</span></div><div class="finance-values"><div><span>${t('Honorar · erfasst')}</span><strong data-finance="done">${moneyLabel(values.earnedCents)}</strong></div><div><span>${t('Erfasste Arbeitszeit')}</span><strong data-finance="actual-time">${P.durationLabel(values.minutes)}</strong></div><div><span>${t('Davon mit Stundensatz')}</span><strong data-finance="rated-time">${P.durationLabel(values.valuedMinutes)}</strong></div></div>${missingTime ? `<p class="finance-missing-time finance-unrated">${missingTime}</p>` : ''}${missingRate ? `<p class="finance-missing-rate finance-unrated">${missingRate}</p>` : ''}<p class="finance-note">${t('Nur abgehakte Jobs · manuell erfasste Arbeitszeit × Stundensatz. Erledigt bedeutet nicht bezahlt.')}</p></section>`;
}
