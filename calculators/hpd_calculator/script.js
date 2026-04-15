/**
 * Noise Safety Advisor — Industrial Audit Suite
 * Globally Integrated: OSHA (USA) | CSA (Canada) | HSE (UK)
 * Update: 2026-04-14
 */

let state = {
    activeTab: 'quick',
    activeLimit: 85,
    region: 'usa',
    sourceMode: 'auto',
    leq: 0,
    lex8: 0,
    peak: 0,
    tasks: [],
    hpd: { type: 'earplugs', nrr: 29, protected: 0 },
    checklist: {}
};

const CHECKLIST_DATA = [
    { cat: 'Exposure Assessment', items: ['Initial noise map completed', 'Daily TWA/Dosimetry records active', 'Critical noise zones mapped (>85dB)', 'Equipment noise verified individually'] },
    { cat: 'Engineering Controls', items: ['Noise enclosures maintained', 'Vibration isolation installed', 'Silencers/Mufflers operational', 'Quieter equipment substitution prioritized'] },
    { cat: 'HPD & Protection', items: ['HPDs provided at no cost', 'NRR/SNR verified for environment', 'HPD fit-testing records active', 'Device removal time minimized (<1m/hr)'] },
    { cat: 'Conservation Admin', items: ['Annual audiometric testing active', 'Noise safety training documented', 'Warning signage clearly visible', 'Advisor review completed annually'] }
];

const UI = {
    lexVal: document.getElementById('lex-val'),
    doseVal: document.getElementById('dose-val'),
    totalTimeVal: document.getElementById('total-time-val'),
    gaugeFill: document.getElementById('gauge-fill'),
    allowedTime: document.getElementById('allowed-time'),
    tasksContainer: document.getElementById('tasks-container'),
    checklistContainer: document.getElementById('checklist-container'),
    checklistProgress: document.getElementById('checklist-progress'),
    selectorRec: document.getElementById('selector-rec'),
    selectorImg: document.getElementById('selector-img'),
    hpdAutoVal: document.getElementById('hpd-auto-val'),
    hpdLogic: document.getElementById('hpd-logic-breakdown'),
    adeqBadge: document.getElementById('adequacy-status-badge'),
    adeqMarker: document.getElementById('adequacy-marker'),
    reportDate: document.getElementById('report-date'),
    reportDose: document.getElementById('report-dose-summary'),
    reportHpd: document.getElementById('report-hpd-summary'),
    reportActivityLog: document.getElementById('report-activity-log'),
    reportChecklist: document.getElementById('report-checklist-stats'),
    qLexLabel: document.getElementById('q-lex-label')
};

/** TAB SWITCHING **/
function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.onclick.toString().includes(tabId)));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
    if (tabId === 'report') updateReport();
    calculate();
}

/** COMPLIANCE ENGINE **/
function calculate() {
    let energy = 0, totalHrs = 0;
    if (state.activeTab === 'quick') {
        const db = parseFloat(document.getElementById('quick-db').value) || 0;
        const h = parseFloat(document.getElementById('quick-h').value) || 0, m = parseFloat(document.getElementById('quick-m').value) || 0;
        totalHrs = h + (m/60);
        energy = totalHrs * Math.pow(10, 0.1 * db);
        UI.qLexLabel.innerText = (totalHrs > 0 ? (10 * Math.log10(energy/8)).toFixed(1) : "0.0");
    } else {
        state.tasks.forEach(t => {
            const d = t.h + (t.m/60);
            if (d > 0) { energy += d * Math.pow(10, 0.1 * t.db); totalHrs += d; }
        });
    }

    state.lex8 = totalHrs > 0 ? 10 * Math.log10(energy / 8) : 0;
    state.leq = totalHrs > 0 ? 10 * Math.log10(energy / totalHrs) : 0;
    state.peak = parseFloat(document.getElementById('peak-noise').value) || 0;

    // Auto-switch for low Noise Safety Advisor baseline
    if (state.activeTab === 'hpd' && state.sourceMode === 'auto' && state.lex8 < 60) setSourceMode('manual');

    syncHPD();
    updateDashboard(totalHrs);
}

function syncHPD() {
    const raw_nrr = parseFloat(document.getElementById('nrr-1').value) || 0;
    const type = document.querySelector('input[name="p-type"]:checked').value;
    const isManual = state.sourceMode === 'manual';
    const source = isManual ? parseFloat(document.getElementById('hpd-source-db').value) || 0 : (state.leq || state.lex8);
    const weight = isManual ? document.querySelector('input[name="hpd-weighting"]:checked').value : 'A';

    if(!isManual) UI.hpdAutoVal.innerText = source.toFixed(1);

    let prot = 0, steps = [];
    steps.push({ l: 'Audit Source', v: `${source.toFixed(1)} ${weight}` });

    if (state.region === 'usa') {
        let nrr = (weight === 'A' ? raw_nrr - 7 : raw_nrr);
        if (weight === 'A') steps.push({ l: 'A-Weight Corr (-7)', v: nrr });
        const derate = document.getElementById('osh-der-50').classList.contains('active');
        if (derate) { nrr /= 2; steps.push({ l: 'OSHA 50% Derate', v: nrr.toFixed(1) }); }
        if (type === 'dual') { nrr += 5; steps.push({ l: 'Dual Boost (+5)', v: nrr.toFixed(1) }); }
        prot = nrr;
    } else if (state.region === 'canada') {
        let fac = (type === 'earplugs' ? 0.5 : type === 'earmuffs' ? 0.7 : 0.65);
        let nrr = (type === 'dual' ? raw_nrr + 5 : raw_nrr);
        if (type === 'dual') steps.push({ l: 'CSA Dual Boost (+5)', v: nrr });
        prot = (nrr * fac);
        steps.push({ l: `CSA Achievement (${fac*100}%)`, v: prot.toFixed(1) });
        if (weight === 'A') { prot -= 3; steps.push({ l: 'dBA Correction (-3)', v: prot.toFixed(1) }); }
        const r_time = parseFloat(document.getElementById('removal-time').value) || 0;
        if (r_time > 0) { prot *= (1 - (r_time/60)); steps.push({ l: `Time Off (${r_time}m)`, v: prot.toFixed(1) }); }
    } else {
        // UK SNR
        prot = (raw_nrr - 4);
        steps.push({ l: 'HSE Guard Factor (-4)', v: prot });
        if (type === 'dual') { prot += 5; steps.push({ l: 'Dual Protection (+5)', v: prot }); }
    }

    state.hpd.protected = source - prot;
    steps.push({ l: 'PROTECTION AT EAR', v: `${state.hpd.protected.toFixed(1)} dBA`, final: true });
    UI.hpdLogic.innerHTML = steps.map(s => `<div class="logic-step ${s.final?'final':''}"><label>${s.l}</label><span>${s.v}</span></div>`).join('');

    const status = (state.hpd.protected < 70 ? 'over' : state.hpd.protected > 85 ? 'insufficient' : state.hpd.protected >= 75 && state.hpd.protected <= 80.5 ? 'ideal' : 'acceptable');
    UI.adeqBadge.className = `status-badge ${status}`;
    UI.adeqBadge.innerText = (status==='over'?'Over-Protected' : status==='insufficient'?'Non-Compliant' : status==='ideal'?'Ideal' : 'Acceptable');
    UI.adeqMarker.style.left = `${Math.max(0, Math.min(100, ((state.hpd.protected - 65) / 25) * 100))}%`;
    UI.selectorRec.innerHTML = `<strong>Advisor Conclusion:</strong> ${state.hpd.protected > 85 ? "Level is unsafe. Immediate upgrade required." : "Safe exposure verified for current environment."}`;
    UI.selectorImg.src = (type==='earplugs'?'hpd_safe_plug.png' : type==='earmuffs'?'hpd_premium_muff.png' : 'hpd_dual_kit.png');
}

function updateDashboard(totalHrs) {
    const dose = totalHrs > 0 ? (Math.pow(10, (state.lex8 - state.activeLimit) / 10)) * 100 : 0;
    UI.lexVal.innerText = state.lex8.toFixed(1);
    UI.doseVal.innerText = dose.toFixed(0) + '%';
    const h = Math.floor(totalHrs), m = Math.round((totalHrs-h)*60);
    UI.totalTimeVal.innerText = `${h}h ${m.toString().padStart(2,'0')}m`;
    UI.gaugeFill.style.strokeDashoffset = 283 - (283 * Math.min(1, dose/100));

    let allow = "Infinite";
    if (state.leq > 50) {
        const t = 8 / Math.pow(10, (state.leq-state.activeLimit)/10);
        const ah = Math.floor(t), am = Math.round((t-ah)*60);
        allow = t < 0.01 ? "DANGER" : `${ah}h ${am}m`;
    }
    UI.allowedTime.innerText = allow;

    const danger = (state.peak >= 140 || state.lex8 >= state.activeLimit + 5 ? 'ruby' : state.lex8 >= state.activeLimit ? 'gold' : 'emerald');
    document.documentElement.style.setProperty('--curr-theme', `var(--accent-${danger})`);
    renderMainChecklist();
}

/** CHECKLIST PERSISTENCE **/
function initChecklist() {
    state.checklist = JSON.parse(localStorage.getItem('noise_safety_audit_checklist')) || {};
    UI.checklistContainer.innerHTML = CHECKLIST_DATA.map(c => `
        <div class="checklist-category-card">
            <h5>${c.cat}</h5>
            ${c.items.map(i => {
                const id = i.replace(/\s+/g, '_').toLowerCase();
                return `<label class="check-item"><input type="checkbox" id="${id}" ${state.checklist[id]?'checked':''} onchange="toggleCheck('${id}')"><span>${i}</span></label>`;
            }).join('')}
        </div>
    `).join('');
    updateChecklistProgress();
}

function toggleCheck(id) {
    state.checklist[id] = document.getElementById(id).checked;
    localStorage.setItem('noise_safety_audit_checklist', JSON.stringify(state.checklist));
    updateChecklistProgress();
}

function updateChecklistProgress() {
    const total = CHECKLIST_DATA.reduce((a,c) => a + c.items.length, 0);
    const checked = Object.values(state.checklist).filter(v => v).length;
    const pc = Math.round((checked / total) * 100);
    UI.checklistProgress.innerText = `${pc}% Complete`;
}

/** REPORTING **/
function updateReport() {
    UI.reportDate.innerText = `Advisor Audit Timestamp: ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`;
    
    // Header summary
    UI.reportDose.innerHTML = `
        <p><strong>L<sub>ex,8</sub> Exposure:</strong> ${state.lex8.toFixed(1)} dBA</p>
        <p><strong>Workday Dose:</strong> ${(Math.pow(10, (state.lex8-state.activeLimit)/10)*100).toFixed(1)}%</p>
        <p><strong>Compliance Standard:</strong> ${state.region.toUpperCase()}</p>
    `;

    // HPD specs
    const ratingType = state.region === 'uk' ? 'SNR' : 'NRR';
    const nrrVal = parseFloat(document.getElementById('nrr-1').value) || 0;
    UI.reportHpd.innerHTML = `
        <p><strong>Device:</strong> ${document.querySelector('input[name="p-type"]:checked').value.toUpperCase()}</p>
        <p><strong>Labeled Protection:</strong> ${nrrVal} dB (${ratingType})</p>
        <p><strong>Effective At-Ear:</strong> <span style="font-weight:900; color:#000;">${state.hpd.protected.toFixed(1)} dBA</span></p>
    `;

    // Activity Log Table
    let tableHtml = `
        <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:0.75rem;">
            <thead>
                <tr style="background:#f0f0f0; text-align:left;">
                    <th style="padding:5px; border:1px solid #ddd;">Activity</th>
                    <th style="padding:5px; border:1px solid #ddd;">Level</th>
                    <th style="padding:5px; border:1px solid #ddd;">Duration</th>
                    <th style="padding:5px; border:1px solid #ddd;">Dose %</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (state.tasks.length === 0) {
        tableHtml += `<tr><td colspan="4" style="padding:10px; text-align:center; color:#888;">No specific activities logged.</td></tr>`;
    } else {
        state.tasks.forEach(t => {
            const dur = (t.h + t.m/60);
            const taskDose = dur > 0 ? (dur / 8) * Math.pow(10, (t.db - state.activeLimit)/10) * 100 : 0;
            tableHtml += `
                <tr>
                    <td style="padding:5px; border:1px solid #ddd;">${t.name || 'Unnamed Session'}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${t.db} dB</td>
                    <td style="padding:5px; border:1px solid #ddd;">${t.h}h ${t.m}m</td>
                    <td style="padding:5px; border:1px solid #ddd;">${taskDose.toFixed(1)}%</td>
                </tr>
            `;
        });
    }

    tableHtml += `</tbody></table>`;
    UI.reportActivityLog.innerHTML = tableHtml;

    const total = CHECKLIST_DATA.reduce((a,c) => a + c.items.length, 0);
    const checked = Object.values(state.checklist).filter(v => v).length;
    UI.reportChecklist.innerHTML = `<p><strong>Audit Verification:</strong> ${checked} of ${total} compliance items verified (${Math.round((checked/total)*100)}%).</p>`;
}

/** GLOBAL HELPERS **/
function setRegion(r) { state.region = r; calculate(); (r==='uk'?['reg-usa','reg-canada','reg-uk'].forEach(v=>document.getElementById(`${v}-btn`).classList.toggle('active', v.includes(r))):null); setRegionUI(r); }
function setRegionUI(r) { 
    document.getElementById('reg-usa-btn').classList.toggle('active', r==='usa');
    document.getElementById('reg-canada-btn').classList.toggle('active', r==='canada');
    document.getElementById('reg-uk-btn').classList.toggle('active', r==='uk');
    document.querySelectorAll('.usa-only').forEach(e => e.style.display = (r==='usa'?'block':'none'));
    document.querySelectorAll('.canada-only').forEach(e => e.style.display = (r==='canada'?'block':'none'));
    document.querySelectorAll('.uk-only').forEach(e => e.style.display = (r==='uk'?'block':'none'));
    document.getElementById('std-table-csa').style.display = (r==='uk'?'none':'table');
    document.getElementById('std-table-uk').style.display = (r==='uk'?'table':'none');
    document.getElementById('rating-label').innerText = (r==='uk'?'Labeled SNR (dB)':'Labeled NRR (dB)');
}
function setSourceMode(m) { state.sourceMode = m; document.getElementById('source-auto-btn').classList.toggle('active', m==='auto'); document.getElementById('source-manual-btn').classList.toggle('active', m==='manual'); document.getElementById('manual-source-row').style.display = (m==='manual'?'grid':'none'); document.getElementById('auto-source-display').style.display = (m==='auto'?'block':'none'); calculate(); }
function setLimit(v) { state.activeLimit = v; document.querySelectorAll('.limit-btn').forEach(b => {if(b.innerText.includes('dB')) b.classList.toggle('active', b.innerText.includes(v))}); calculate(); }
function setOshaDerate(v) { document.getElementById('osh-der-0').classList.toggle('active', v==='none'); document.getElementById('osh-der-50').classList.toggle('active', v==='50'); calculate(); }
function addTask() { state.tasks.push({id:Date.now(), name:'', db:85, h:1, m:0}); renderTasks(); calculate(); }
function removeTask(id) { state.tasks = state.tasks.filter(t=>t.id!==id); renderTasks(); calculate(); }
function updateTask(id, f, v) { const t = state.tasks.find(x=>x.id===id); if(t) t[f] = (f==='name'?v:parseFloat(v)||0); calculate(); }
function renderTasks() { UI.tasksContainer.innerHTML = state.tasks.map(t => `<div class="task-row glass-panel" style="margin-bottom:10px; padding:15px; display:grid; grid-template-columns: 1fr 100px 150px 40px; gap:12px; align-items:end; background:rgba(0,0,0,0.3);"><div class="input-group"><input type="text" value="${t.name}" oninput="updateTask(${t.id}, 'name', this.value)"></div><div class="input-group"><input type="number" value="${t.db}" oninput="updateTask(${t.id}, 'db', this.value)"></div><div class="duration-split" style="display:flex; gap:8px;"><input type="number" value="${t.h}" oninput="updateTask(${t.id}, 'h', this.value)"><input type="number" value="${t.m}" oninput="updateTask(${t.id}, 'm', this.value)"></div><button onclick="removeTask(${t.id})" class="remove-task-btn">×</button></div>`).join(''); }

function renderMainChecklist() {
    const l = state.activeLimit;
    const items = [{t:'Exposure Mapping', s:state.lex8>=l?'req':'done'}, {t:'Hazard Signage', s:state.lex8>=l?'req':'done'}, {t:'Training Documents', s:'req'}, {t:'Advisor Review', s:'req'}];
    document.getElementById('action-checklist').innerHTML = items.map(i => `<div style="display:flex; gap:10px; padding:10px; border-radius:10px; margin-bottom:5px; border-left:4px solid ${i.s==='req'?'var(--accent-ruby)':'var(--accent-emerald)'}; background:rgba(255,255,255,0.02); font-size:0.8rem;">${i.t}</div>`).join('');
}

// BOOT
initChecklist();
setRegion('usa');
addTask();
calculate();
renderTasks();
