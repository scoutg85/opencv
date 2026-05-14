/* =====================================================================
   CIVNET Planner: Civil Affairs Network Engagement Planner
   ---------------------------------------------------------------------
   UNCLASSIFIED training prototype only.

   Single-file vanilla JS application. No build step.
   Doctrinal reference fields modeled on:
     - FM 3-57  Civil Affairs Operations
     - ATP 3-57.30 Civil Network Development and Engagement
     - ATP 3-57.50 Civil Knowledge Integration
     - ATP 3-57.60 Civil Affairs Planning
     - FM 5-0    Planning and Orders Production
     - ATP 2-01.3 IPOE
   Doctrine references are used to organize fields and templates; the
   prototype is not authoritative. Operators must consult the actual
   doctrine for real planning.
   ===================================================================== */

/* ----------------------- Constants ---------------------------------- */

const STORAGE_KEY = 'civnet-planner.project.v1';

const ENTITY_TYPES = [
  'Individual', 'Key leader', 'Government office', 'NGO',
  'International organization', 'Religious organization',
  'Tribal/community group', 'Business/economic actor', 'Media actor',
  'Security actor', 'Infrastructure site', 'Essential service provider',
  'Population center', 'Displaced civilian site',
  'School / education actor', 'Medical actor',
  'Logistics / transportation actor', 'Other'
];

const ASCOPE_CATS    = ['Area', 'Structure', 'Capability', 'Organization', 'People', 'Event'];
const PMESII_CATS    = ['Political', 'Military', 'Economic', 'Social', 'Information',
                        'Infrastructure', 'Physical Environment', 'Time'];
const SWEAT_MS_CATS  = ['Sewer', 'Water', 'Electricity', 'Academics', 'Trash', 'Medical', 'Safety'];

const INFLUENCE_LEVELS  = ['Low', 'Medium', 'High', 'Critical'];
const ACCESS_LEVELS     = ['No access', 'Limited', 'Established', 'Trusted'];
const ATTITUDES         = ['Supportive', 'Neutral', 'Resistant', 'Hostile', 'Unknown'];
const REL_STRENGTHS     = ['Weak', 'Moderate', 'Strong'];
const REL_DIRECTIONS    = ['One-way', 'Two-way'];
const REL_CONFIDENCE    = ['Low', 'Medium', 'High'];
const REL_STATUSES      = ['Confirmed', 'Suspected', 'Planned', 'Needs validation'];
const REL_TYPES         = ['Supports', 'Influences', 'Reports to', 'Provides resources to',
                           'Coordinates with', 'Conflicts with', 'Competes with', 'Depends on',
                           'Controls access to', 'Shares information with',
                           'Potential engagement path', 'Other'];
const NETWORK_ROLES     = ['Influencer', 'Broker', 'Gatekeeper', 'Spoiler', 'Resource provider',
                           'Service provider', 'Vulnerable population', 'Decision-maker', 'Other'];
const PRIORITIES        = ['Low', 'Medium', 'High', 'Urgent'];
const RISK_LEVELS       = ['Low', 'Medium', 'High', 'Extreme'];
const OPP_LEVELS        = ['Low', 'Medium', 'High'];
const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High'];

const CNDE_STATUSES = [
  'Unassessed', 'Identified', 'Planned for Engagement', 'Engaged',
  'Analyzed', 'Selected for Development', 'Being Developed',
  'Integrated into Operations', 'Reassess Required'
];

const ENGAGEMENT_METHODS = [
  'KLE', 'Civil reconnaissance', 'Civil engagement', 'Meeting', 'Phone',
  'Patrol', 'CMOC', 'Partner report', 'Open source', 'Other'
];

const SOURCE_TYPES = [
  'Patrol report', 'KLE', 'Civil reconnaissance', 'Open source',
  'Partner force', 'Civil report', 'Staff estimate', 'Other'
];

const TASK_STATUSES = ['Not started', 'In progress', 'Complete', 'Blocked'];
const TREND_VALUES  = ['Improving', 'Stable', 'Worsening', 'Unknown'];

/* CNDE status colors for badges/markers */
const CNDE_COLORS = {
  'Unassessed':                  '#6b7280',
  'Identified':                  '#94a3b8',
  'Planned for Engagement':      '#4d8be6',
  'Engaged':                     '#f6c453',
  'Analyzed':                    '#a78bfa',
  'Selected for Development':    '#fb923c',
  'Being Developed':             '#34d399',
  'Integrated into Operations':  '#22c55e',
  'Reassess Required':           '#e57373'
};

const DEFAULT_LOE_PALETTE = [
  '#4d8be6','#6fb0a2','#f6c453','#e57373','#a78bfa',
  '#fb923c','#22c55e','#94a3b8','#ec4899','#0ea5e9'
];

const DEFAULT_LOES = [
  'Governance', 'Civil Security', 'Essential Services',
  'Economic Stability', 'Public Health', 'Infrastructure',
  'Information Environment', 'Humanitarian Assistance',
  'Displacement / Civilian Harm Mitigation', 'Key Leader Engagement'
];

/* Doctrinal tooltips */
const TIPS = {
  ASCOPE:  'ASCOPE (ATP 2-01.3): Area, Structure, Capability, Organization, People, Event.',
  PMESII:  'PMESII-PT (ATP 2-01.3): Political, Military, Economic, Social, Information, Infrastructure, Physical Environment, Time.',
  SWEATMS: 'SWEAT-MS: Sewer, Water, Electricity, Academics, Trash, Medical, Safety — essential services framework.',
  LOE:     'Line of Effort (FM 5-0): logical line linking tasks and effects to objectives.',
  MOP:     'Measure of Performance (FM 5-0): are we doing things right? Task completion.',
  MOE:     'Measure of Effectiveness (FM 5-0): are we doing the right things? Change in conditions.',
  CIV_VULN:'Civil vulnerability (FM 3-57): condition in civil environment that could cause harm or instability.',
  CIV_CAP: 'Civil capability (FM 3-57): civil resource or capacity that can support the mission.',
  INFO_GAP:'Information gap (ATP 3-57.50): missing civil information needed for planning or decision.',
  CNDE:    'CNDE (ATP 3-57.30): Civil Network Development and Engagement cycle stage.',
  ACCESS:  'Access (ATP 3-57.30): degree of relational reach to engage this actor or network.',
  INFLUENCE:'Influence (ATP 3-57.30): degree to which this actor can shape outcomes in the civil environment.',
  RELIABILITY:'Source reliability (NATO A-F scale equivalent): how reliable is the source of this information?',
  CONFIDENCE:'Confidence: how confident are we that the information is accurate?'
};

/* ----------------------- Project State ------------------------------ */

let state = blankProject();
let selected = { kind: null, id: null }; // currently selected item in right panel

function blankProject() {
  return {
    projectMetadata: {
      name: 'New CIVNET Project',
      ao: '', ai: '', unit: '', operator: '',
      higherHq: '', cdrIntent: '',
      defaultLat: 38.9072, defaultLng: -77.0369, defaultZoom: 11,
      createdAt: new Date().toISOString(),
      version: 1
    },
    settings: { theme: 'dark', mapOverlay: 'loe' },
    nodes: [],
    connections: [],
    loes: [],
    engagements: [],
    tasks: [],
    assessments: [],
    informationRequirements: []
  };
}

function uid(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 8) +
         Date.now().toString(36).slice(-4);
}

/* ----------------------- Persistence -------------------------------- */

function saveProject(silent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!silent) toast('Project saved to browser storage.', 'ok');
  } catch (e) {
    console.error(e);
    toast('Save failed: ' + e.message, 'err');
  }
}
function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    state = Object.assign(blankProject(), parsed);
    return true;
  } catch (e) {
    console.error(e); return false;
  }
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  download(blob, (state.projectMetadata.name || 'civnet') + '.json');
  toast('Project JSON exported.', 'ok');
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      state = Object.assign(blankProject(), parsed);
      refreshAll();
      toast('Project imported.', 'ok');
    } catch (err) {
      toast('Import failed: ' + err.message, 'err');
    }
  };
  reader.readAsText(file);
}
function clearProject() {
  confirmModal('Clear entire project? This will erase all nodes, connections, '
    + 'LOEs, engagements, and tasks from the local browser. Export first if you '
    + 'want to keep this data.', () => {
      state = blankProject();
      ensureDefaultLOEs();
      saveProject(true);
      refreshAll();
      toast('Project cleared.', 'warn');
    });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
}

/* ----------------------- LOEs --------------------------------------- */

function ensureDefaultLOEs() {
  if (state.loes.length > 0) return;
  DEFAULT_LOES.forEach((name, i) => {
    state.loes.push({
      id: uid('loe'),
      name,
      color: DEFAULT_LOE_PALETTE[i % DEFAULT_LOE_PALETTE.length],
      description: '',
      endState: '',
      higherObjective: '',
      tasks: [],
      mop: '',
      moe: ''
    });
  });
}
function loeById(id) { return state.loes.find(l => l.id === id); }
function loeColor(id) {
  const l = loeById(id);
  return l ? l.color : '#6b7280';
}

/* ----------------------- Nodes / Connections ------------------------ */

function nodeById(id) { return state.nodes.find(n => n.id === id); }
function connById(id) { return state.connections.find(c => c.id === id); }

function newNode(partial) {
  const now = new Date().toISOString();
  return Object.assign({
    id: uid('n'),
    name: 'New Node',
    locationName: '',
    lat: state.projectMetadata.defaultLat,
    lng: state.projectMetadata.defaultLng,
    address: '',
    ao: state.projectMetadata.ao,
    ai: state.projectMetadata.ai,
    createdAt: now, updatedAt: now,
    createdBy: state.projectMetadata.operator,
    summary: '',
    entityType: 'Other',
    poc: { name: '', title: '', org: '', phone: '', email: '',
           preferred: '', language: '', interpreter: 'no', notes: '' },
    ascope: '', pmesii: '', sweatms: [],
    civilVulnerability: '', civilCapability: '',
    civilRequirement: '', civilImpactOnMission: '',
    missionImpactOnCivilians: '',
    pirSupported: '', infoGaps: '',
    sourceReliability: 'Medium', confidence: 'Medium',
    influence: 'Medium', access: 'Limited',
    attitude: 'Unknown', relationshipStrength: 'Moderate',
    networkRole: 'Other',
    priority: 'Medium', risk: 'Low', opportunity: 'Low',
    reliability: 'Medium',
    desiredEffect: '', engagementObjective: '',
    engagementMethod: 'KLE', talkingPoints: '', questions: '',
    cdrEndState: '',
    primaryLoeId: state.loes[0] ? state.loes[0].id : '',
    supportingLoes: [], loeNotes: '',
    supportedTask: '',
    nextEngagementDate: '',
    responsible: '',
    followUp: '',
    mop: '', moe: '',
    assessmentNotes: '',
    cndeStatus: 'Identified'
  }, partial || {});
}

function newConnection(partial) {
  return Object.assign({
    id: uid('c'),
    sourceNodeId: '', targetNodeId: '',
    relationshipType: 'Coordinates with',
    strength: 'Moderate', direction: 'Two-way',
    confidence: 'Medium', status: 'Suspected',
    notes: '', dateObserved: '',
    sourceType: 'Patrol report',
    loeId: '', infoRequirement: '',
    engagementObjective: '',
    risk: 'Low', opportunity: 'Low',
    cndeStatus: 'Identified'
  }, partial || {});
}

/* ----------------------- Map Layer ---------------------------------- */

let gmap = null;
let markers = {};       // nodeId -> marker
let polylines = {};     // connectionId -> polyline
let infoWindow = null;
let placesAutocomplete = null;

// Called by Google Maps API
window.initMap = function () {
  try {
    gmap = new google.maps.Map(document.getElementById('map'), {
      center: { lat: state.projectMetadata.defaultLat, lng: state.projectMetadata.defaultLng },
      zoom:   state.projectMetadata.defaultZoom,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      styles: getMapStyle()
    });
    infoWindow = new google.maps.InfoWindow();

    // Allow click on map to drop a new node
    gmap.addListener('click', (e) => {
      promptCreateNodeAt(e.latLng.lat(), e.latLng.lng());
    });

    // Wire up places autocomplete
    const input = document.getElementById('place-search');
    if (google.maps.places && input) {
      placesAutocomplete = new google.maps.places.Autocomplete(input, {
        fields: ['geometry', 'name', 'formatted_address'],
      });
      placesAutocomplete.bindTo('bounds', gmap);
      placesAutocomplete.addListener('place_changed', () => {
        const place = placesAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        gmap.panTo(place.geometry.location);
        gmap.setZoom(15);
        // Offer to create a node here
        confirmModal(`Create a new civil network node at "${place.name}"?`, () => {
          const n = newNode({
            name: place.name || 'New node',
            locationName: place.name || '',
            address: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          state.nodes.push(n);
          renderAllNodesOnMap();
          refreshLists();
          openDetail('node', n.id);
          saveProject(true);
        });
      });
    }

    renderAllNodesOnMap();
    renderAllConnectionsOnMap();
  } catch (err) {
    console.error('Maps init failed', err);
    showMapFallback();
  }
};

window.__mapsFailed = function () { showMapFallback(); };

function showMapFallback() {
  document.getElementById('map-fallback').classList.remove('hidden');
  document.getElementById('map').style.display = 'none';
}

function getMapStyle() {
  // Subtle dark-friendly style.
  // TODO: full custom dark map style.
  return [];
}

function nodeMarkerColor(n) {
  const overlay = state.settings.mapOverlay;
  switch (overlay) {
    case 'cnde':     return CNDE_COLORS[n.cndeStatus] || '#888';
    case 'risk':     return ({Low:'#22c55e',Medium:'#f6c453',High:'#fb923c',Extreme:'#e57373'})[n.risk] || '#888';
    case 'influence':return ({Low:'#94a3b8',Medium:'#4d8be6',High:'#a78bfa',Critical:'#e57373'})[n.influence] || '#888';
    case 'access':   return ({['No access']:'#e57373',Limited:'#f6c453',Established:'#4d8be6',Trusted:'#22c55e'})[n.access] || '#888';
    case 'info-gap': return n.infoGaps ? '#f6c453' : '#94a3b8';
    case 'trend':    return '#94a3b8'; // TODO: tie to assessment trend
    case 'entity':   return entityColor(n.entityType);
    case 'priority': return ({Low:'#94a3b8',Medium:'#4d8be6',High:'#fb923c',Urgent:'#e57373'})[n.priority] || '#888';
    case 'loe':
    default:         return loeColor(n.primaryLoeId);
  }
}
function entityColor(t) {
  let h = 0; for (let i=0;i<t.length;i++) h = (h*31 + t.charCodeAt(i)) >>> 0;
  return 'hsl(' + (h % 360) + ', 50%, 55%)';
}

function renderAllNodesOnMap() {
  if (!gmap) return;
  // Remove markers not in nodes
  Object.keys(markers).forEach(id => {
    if (!nodeById(id)) { markers[id].setMap(null); delete markers[id]; }
  });
  state.nodes.forEach(n => {
    if (markers[n.id]) {
      markers[n.id].setPosition({ lat: n.lat, lng: n.lng });
      markers[n.id].setIcon(svgPin(nodeMarkerColor(n)));
      markers[n.id].setLabel({ text: n.name, color: '#fff', fontSize: '11px' });
    } else {
      const m = new google.maps.Marker({
        position: { lat: n.lat, lng: n.lng },
        map: gmap, draggable: true,
        title: n.name,
        icon: svgPin(nodeMarkerColor(n))
      });
      m.addListener('click', () => openDetail('node', n.id));
      m.addListener('dragend', (e) => {
        n.lat = e.latLng.lat(); n.lng = e.latLng.lng();
        n.updatedAt = new Date().toISOString();
        saveProject(true);
        renderAllConnectionsOnMap();
      });
      markers[n.id] = m;
    }
  });
}

function svgPin(color) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
       <path d="M14 0C6 0 0 6 0 14c0 10 14 22 14 22s14-12 14-22C28 6 22 0 14 0z"
             fill="${color}" stroke="#0b0f15" stroke-width="1.5"/>
       <circle cx="14" cy="14" r="5" fill="#fff"/>
     </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 36),
    anchor: new google.maps.Point(14, 36)
  };
}

function renderAllConnectionsOnMap() {
  if (!gmap) return;
  Object.keys(polylines).forEach(id => {
    polylines[id].setMap(null); delete polylines[id];
  });
  state.connections.forEach(c => {
    const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
    if (!a || !b) return;
    const isConflict = /Conflict|Compete/i.test(c.relationshipType);
    let strokeColor = isConflict ? '#e57373' : '#9aa7b6';
    let strokeWeight = c.strength === 'Strong' ? 4 : (c.strength === 'Moderate' ? 2.5 : 1.5);
    let icons;
    if (c.status === 'Suspected') {
      icons = [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, scale: 3 },
                 offset: '0', repeat: '12px' }];
      strokeColor = isConflict ? '#e57373' : '#9aa7b6';
      var stroke0 = 0;
    } else if (c.status === 'Planned') {
      icons = [{ icon: { path: 'M 0,0 0,1', strokeOpacity: 0.9, scale: 2 },
                 offset: '0', repeat: '6px' }];
      var stroke0 = 0;
    } else {
      var stroke0 = 1;
    }
    const line = new google.maps.Polyline({
      path: [{lat:a.lat,lng:a.lng},{lat:b.lat,lng:b.lng}],
      strokeColor, strokeWeight,
      strokeOpacity: (typeof stroke0 === 'number' && stroke0 === 0) ? 0 : 0.9,
      icons,
      map: gmap, clickable: true
    });
    line.addListener('click', () => openDetail('connection', c.id));
    polylines[c.id] = line;
  });
}

/* ----------------------- Views (Top Nav) ---------------------------- */

function setView(name) {
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v =>
    v.classList.toggle('active', v.id === 'view-' + name));
  if (name === 'graph') renderGraphView();
  if (name === 'cnde') renderCndePanels();
  if (name === 'dashboard') renderDashboard();
  if (name === 'map' && gmap) google.maps.event.trigger(gmap, 'resize');
}

/* ----------------------- Lists in left panel ------------------------ */

function refreshLists() {
  // node count
  document.getElementById('node-count').textContent = state.nodes.length;

  // node list
  const ul = document.getElementById('node-list');
  ul.innerHTML = '';
  filteredNodes().forEach(n => {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = loeColor(n.primaryLoeId);
    const name = document.createElement('span');
    name.textContent = n.name;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = n.cndeStatus;
    li.appendChild(dot); li.appendChild(name); li.appendChild(meta);
    li.onclick = () => {
      openDetail('node', n.id);
      if (gmap) { gmap.panTo({ lat: n.lat, lng: n.lng }); }
    };
    ul.appendChild(li);
  });
  if (state.nodes.length === 0) ul.innerHTML = '<li style="color:var(--fg-dim)">No nodes yet.</li>';

  // LOE list
  const lo = document.getElementById('loe-list');
  lo.innerHTML = '';
  state.loes.forEach(l => {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot'; dot.style.background = l.color;
    const name = document.createElement('span'); name.textContent = l.name;
    li.appendChild(dot); li.appendChild(name);
    li.onclick = () => openDetail('loe', l.id);
    lo.appendChild(li);
  });

  // Engagements
  const en = document.getElementById('engagement-list');
  en.innerHTML = '';
  state.engagements.slice().reverse().forEach(e => {
    const li = document.createElement('li');
    const node = nodeById(e.nodeId);
    li.textContent = (e.date ? e.date.slice(0,10)+': ' : '') +
                     (node ? node.name : '(unknown)');
    li.onclick = () => openDetail('engagement', e.id);
    en.appendChild(li);
  });
  if (state.engagements.length === 0) en.innerHTML = '<li style="color:var(--fg-dim)">No engagements yet.</li>';

  // Tasks
  const tl = document.getElementById('task-list');
  tl.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.title + (t.dueDate ? ' (' + t.dueDate.slice(0,10) + ')' : '');
    li.onclick = () => openDetail('task', t.id);
    tl.appendChild(li);
  });
  if (state.tasks.length === 0) tl.innerHTML = '<li style="color:var(--fg-dim)">No tasks yet.</li>';

  buildFilterControls();
}

/* ----------------------- Filters ------------------------------------ */

const filterState = {
  loe: new Set(), cnde: new Set(), entity: new Set(),
  priority: new Set(), risk: new Set(),
  access: new Set(), influence: new Set()
};

function buildFilterControls() {
  fillCheckboxGroup('filter-loe',  state.loes.map(l => ({v:l.id, label:l.name})), filterState.loe);
  fillCheckboxGroup('filter-cnde', CNDE_STATUSES.map(s => ({v:s, label:s})), filterState.cnde);
  fillCheckboxGroup('filter-entity', ENTITY_TYPES.map(s => ({v:s, label:s})), filterState.entity);
  fillCheckboxGroup('filter-misc', [
    ...PRIORITIES.map(p => ({v:'priority:'+p, label:'Priority: '+p, set:filterState.priority})),
    ...RISK_LEVELS.map(p => ({v:'risk:'+p, label:'Risk: '+p, set:filterState.risk})),
    ...ACCESS_LEVELS.map(p => ({v:'access:'+p, label:'Access: '+p, set:filterState.access})),
    ...INFLUENCE_LEVELS.map(p => ({v:'inf:'+p, label:'Influence: '+p, set:filterState.influence})),
  ], null);
}
function fillCheckboxGroup(containerId, items, set) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  items.forEach(it => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const targetSet = set || it.set;
    cb.checked = targetSet.has(it.v);
    cb.onchange = () => {
      if (cb.checked) targetSet.add(it.v); else targetSet.delete(it.v);
      renderAllNodesOnMap(); renderAllConnectionsOnMap(); refreshLists();
    };
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(' ' + it.label));
    c.appendChild(lbl);
  });
}

function filteredNodes() {
  return state.nodes.filter(n => {
    if (filterState.loe.size      && !filterState.loe.has(n.primaryLoeId)) return false;
    if (filterState.cnde.size     && !filterState.cnde.has(n.cndeStatus))  return false;
    if (filterState.entity.size   && !filterState.entity.has(n.entityType)) return false;
    if (filterState.priority.size && !filterState.priority.has('priority:'+n.priority)) return false;
    if (filterState.risk.size     && !filterState.risk.has('risk:'+n.risk)) return false;
    if (filterState.access.size   && !filterState.access.has('access:'+n.access)) return false;
    if (filterState.influence.size && !filterState.influence.has('inf:'+n.influence)) return false;
    return true;
  });
}

function clearFilters() {
  Object.values(filterState).forEach(s => s.clear());
  buildFilterControls();
  renderAllNodesOnMap(); renderAllConnectionsOnMap(); refreshLists();
}

/* ----------------------- Right Detail Panel ------------------------- */

function openDetail(kind, id) {
  selected = { kind, id };
  const el = document.getElementById('detail-content');
  el.innerHTML = '';
  if (kind === 'node')        el.appendChild(buildNodeForm(nodeById(id)));
  else if (kind === 'connection') el.appendChild(buildConnectionForm(connById(id)));
  else if (kind === 'loe')        el.appendChild(buildLoeForm(loeById(id)));
  else if (kind === 'engagement') el.appendChild(buildEngagementForm(state.engagements.find(e => e.id===id)));
  else if (kind === 'task')       el.appendChild(buildTaskForm(state.tasks.find(t => t.id===id)));
}

function rowField(label, input, helpKey) {
  const wrap = document.createElement('div');
  const lab = document.createElement('label');
  lab.textContent = label;
  if (helpKey && TIPS[helpKey]) {
    const t = document.createElement('span');
    t.className = 'tooltip-q'; t.textContent = '?'; t.title = TIPS[helpKey];
    lab.appendChild(t);
  }
  wrap.appendChild(lab);
  wrap.appendChild(input);
  return wrap;
}
function makeInput(value, onInput, type) {
  const i = document.createElement('input');
  i.type = type || 'text';
  i.value = value || '';
  i.oninput = () => onInput(i.value);
  return i;
}
function makeTextarea(value, onInput, rows) {
  const t = document.createElement('textarea');
  t.value = value || ''; t.rows = rows || 2;
  t.oninput = () => onInput(t.value);
  return t;
}
function makeSelect(value, options, onChange, optionsLabels) {
  const s = document.createElement('select');
  options.forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = opt; o.textContent = optionsLabels ? optionsLabels[i] : opt;
    if (value === opt) o.selected = true;
    s.appendChild(o);
  });
  s.onchange = () => onChange(s.value);
  return s;
}
function makeMultiSelect(values, options, onChange, optionsLabels) {
  const s = document.createElement('select');
  s.multiple = true; s.size = Math.min(5, options.length);
  options.forEach((opt, i) => {
    const o = document.createElement('option');
    o.value = opt; o.textContent = optionsLabels ? optionsLabels[i] : opt;
    if (values && values.indexOf(opt) >= 0) o.selected = true;
    s.appendChild(o);
  });
  s.onchange = () => onChange(Array.from(s.selectedOptions).map(o => o.value));
  return s;
}

function buildNodeForm(n) {
  if (!n) return emptyMsg();
  const f = document.createElement('div');
  f.className = 'detail-form';

  // Title row
  const title = document.createElement('div');
  title.innerHTML = `<div style="font-weight:700;font-size:14px;">Node: ${escapeHtml(n.name)}</div>
    <div style="color:var(--fg-dim);font-size:11px">ID: ${n.id}</div>`;
  f.appendChild(title);

  // Badges
  const badges = document.createElement('div');
  const loe = loeById(n.primaryLoeId);
  badges.innerHTML =
    `<span class="badge cnde" style="border-left:4px solid ${CNDE_COLORS[n.cndeStatus]||'#888'};padding-left:6px">${n.cndeStatus}</span>` +
    `<span class="badge loe" style="border-left:4px solid ${loe?loe.color:'#888'};padding-left:6px">${loe ? loe.name : 'No LOE'}</span>` +
    `<span class="badge risk">Risk: ${n.risk}</span>` +
    `<span class="badge opp">Opp: ${n.opportunity}</span>`;
  f.appendChild(badges);

  // Basic info
  const basic = section('Basic Information', true);
  basic.body.appendChild(rowField('Name', makeInput(n.name, v => { n.name = v; touchNode(n); })));
  basic.body.appendChild(rowField('Location name', makeInput(n.locationName, v => { n.locationName = v; touchNode(n); })));
  const row = document.createElement('div'); row.className = 'row';
  row.appendChild(rowField('Lat', makeInput(n.lat, v => { n.lat = parseFloat(v)||0; touchNode(n); }, 'number')));
  row.appendChild(rowField('Lng', makeInput(n.lng, v => { n.lng = parseFloat(v)||0; touchNode(n); }, 'number')));
  basic.body.appendChild(row);
  basic.body.appendChild(rowField('Address', makeInput(n.address, v => { n.address = v; touchNode(n); })));
  const row2 = document.createElement('div'); row2.className = 'row';
  row2.appendChild(rowField('AO', makeInput(n.ao, v => { n.ao = v; touchNode(n); })));
  row2.appendChild(rowField('AI', makeInput(n.ai, v => { n.ai = v; touchNode(n); })));
  basic.body.appendChild(row2);
  basic.body.appendChild(rowField('Summary', makeTextarea(n.summary, v => { n.summary = v; touchNode(n); })));
  basic.body.appendChild(metaLine(n));
  f.appendChild(basic.root);

  // Entity type
  const ent = section('Civil Entity Type');
  ent.body.appendChild(rowField('Type', makeSelect(n.entityType, ENTITY_TYPES, v => { n.entityType = v; touchNode(n); })));
  f.appendChild(ent.root);

  // POC
  const poc = section('Point of Contact');
  ['name','title','org','phone','email','preferred','language','notes'].forEach(k => {
    poc.body.appendChild(rowField(k.charAt(0).toUpperCase()+k.slice(1),
      makeInput(n.poc[k], v => { n.poc[k] = v; touchNode(n); })));
  });
  poc.body.appendChild(rowField('Interpreter required?',
    makeSelect(n.poc.interpreter, ['no','yes'], v => { n.poc.interpreter = v; touchNode(n); })));
  f.appendChild(poc.root);

  // Analytical
  const an = section('CA Analytical Fields');
  an.body.appendChild(rowField('ASCOPE', makeSelect(n.ascope, ['',...ASCOPE_CATS], v => { n.ascope = v; touchNode(n); }), 'ASCOPE'));
  an.body.appendChild(rowField('PMESII-PT', makeSelect(n.pmesii, ['',...PMESII_CATS], v => { n.pmesii = v; touchNode(n); }), 'PMESII'));
  an.body.appendChild(rowField('SWEAT-MS relevance',
    makeMultiSelect(n.sweatms, SWEAT_MS_CATS, v => { n.sweatms = v; touchNode(n); }), 'SWEATMS'));
  an.body.appendChild(rowField('Civil vulnerability', makeTextarea(n.civilVulnerability, v => { n.civilVulnerability=v; touchNode(n); }), 'CIV_VULN'));
  an.body.appendChild(rowField('Civil capability',    makeTextarea(n.civilCapability,    v => { n.civilCapability=v; touchNode(n); }), 'CIV_CAP'));
  an.body.appendChild(rowField('Civil requirement',   makeTextarea(n.civilRequirement,   v => { n.civilRequirement=v; touchNode(n); })));
  an.body.appendChild(rowField('Civil impact on mission',    makeTextarea(n.civilImpactOnMission, v => { n.civilImpactOnMission=v; touchNode(n); })));
  an.body.appendChild(rowField('Mission impact on civilians',makeTextarea(n.missionImpactOnCivilians, v => { n.missionImpactOnCivilians=v; touchNode(n); })));
  an.body.appendChild(rowField('PIR supported',     makeTextarea(n.pirSupported, v => { n.pirSupported=v; touchNode(n); })));
  an.body.appendChild(rowField('Information gaps',  makeTextarea(n.infoGaps,     v => { n.infoGaps=v; touchNode(n); }), 'INFO_GAP'));
  an.body.appendChild(rowField('Source reliability',makeSelect(n.sourceReliability, CONFIDENCE_LEVELS, v => { n.sourceReliability=v; touchNode(n); }), 'RELIABILITY'));
  an.body.appendChild(rowField('Confidence',        makeSelect(n.confidence, CONFIDENCE_LEVELS, v => { n.confidence=v; touchNode(n); }), 'CONFIDENCE'));
  f.appendChild(an.root);

  // Civil network
  const cn = section('Civil Network');
  cn.body.appendChild(rowField('Influence', makeSelect(n.influence, INFLUENCE_LEVELS, v => { n.influence=v; touchNode(n); }), 'INFLUENCE'));
  cn.body.appendChild(rowField('Access',    makeSelect(n.access, ACCESS_LEVELS, v => { n.access=v; touchNode(n); }), 'ACCESS'));
  cn.body.appendChild(rowField('Attitude toward friendly forces', makeSelect(n.attitude, ATTITUDES, v => { n.attitude=v; touchNode(n); })));
  cn.body.appendChild(rowField('Relationship strength', makeSelect(n.relationshipStrength, REL_STRENGTHS, v => { n.relationshipStrength=v; touchNode(n); })));
  cn.body.appendChild(rowField('Network role', makeSelect(n.networkRole, NETWORK_ROLES, v => { n.networkRole=v; touchNode(n); })));
  cn.body.appendChild(rowField('Engagement priority', makeSelect(n.priority, PRIORITIES, v => { n.priority=v; touchNode(n); })));
  cn.body.appendChild(rowField('Risk',        makeSelect(n.risk, RISK_LEVELS, v => { n.risk=v; touchNode(n); })));
  cn.body.appendChild(rowField('Opportunity', makeSelect(n.opportunity, OPP_LEVELS, v => { n.opportunity=v; touchNode(n); })));
  cn.body.appendChild(rowField('Reliability', makeSelect(n.reliability, CONFIDENCE_LEVELS, v => { n.reliability=v; touchNode(n); })));
  f.appendChild(cn.root);

  // LOE
  const lo = section('Lines of Effort');
  lo.body.appendChild(rowField('Primary LOE',
    makeSelect(n.primaryLoeId, state.loes.map(l=>l.id), v => { n.primaryLoeId=v; touchNode(n); },
               state.loes.map(l => l.name)), 'LOE'));
  lo.body.appendChild(rowField('Supporting LOEs',
    makeMultiSelect(n.supportingLoes, state.loes.map(l=>l.id), v => { n.supportingLoes=v; touchNode(n); },
                    state.loes.map(l => l.name))));
  lo.body.appendChild(rowField('LOE notes', makeTextarea(n.loeNotes, v => { n.loeNotes=v; touchNode(n); })));
  f.appendChild(lo.root);

  // Engagement planning
  const ep = section('Engagement Planning');
  ep.body.appendChild(rowField('Desired effect',        makeTextarea(n.desiredEffect, v => { n.desiredEffect=v; touchNode(n); })));
  ep.body.appendChild(rowField('Engagement objective',  makeTextarea(n.engagementObjective, v => { n.engagementObjective=v; touchNode(n); })));
  ep.body.appendChild(rowField('Recommended method',    makeSelect(n.engagementMethod, ENGAGEMENT_METHODS, v => { n.engagementMethod=v; touchNode(n); })));
  ep.body.appendChild(rowField('Talking points',        makeTextarea(n.talkingPoints, v => { n.talkingPoints=v; touchNode(n); })));
  ep.body.appendChild(rowField('Questions to ask',      makeTextarea(n.questions, v => { n.questions=v; touchNode(n); })));
  ep.body.appendChild(rowField("Commander's end state supported", makeTextarea(n.cdrEndState, v => { n.cdrEndState=v; touchNode(n); })));
  ep.body.appendChild(rowField('Supported task / purpose', makeTextarea(n.supportedTask, v => { n.supportedTask=v; touchNode(n); })));
  ep.body.appendChild(rowField('Next engagement date',  makeInput(n.nextEngagementDate, v => { n.nextEngagementDate=v; touchNode(n); }, 'date')));
  ep.body.appendChild(rowField('Responsible team/member', makeInput(n.responsible, v => { n.responsible=v; touchNode(n); })));
  ep.body.appendChild(rowField('Follow-up actions',     makeTextarea(n.followUp, v => { n.followUp=v; touchNode(n); })));
  ep.body.appendChild(rowField('MOP', makeTextarea(n.mop, v => { n.mop=v; touchNode(n); }), 'MOP'));
  ep.body.appendChild(rowField('MOE', makeTextarea(n.moe, v => { n.moe=v; touchNode(n); }), 'MOE'));
  ep.body.appendChild(rowField('Assessment notes',      makeTextarea(n.assessmentNotes, v => { n.assessmentNotes=v; touchNode(n); })));
  f.appendChild(ep.root);

  // CNDE
  const cd = section('CNDE Cycle Status');
  cd.body.appendChild(rowField('Status', makeSelect(n.cndeStatus, CNDE_STATUSES, v => {
    n.cndeStatus = v; touchNode(n); renderCndePanels();
  }), 'CNDE'));
  f.appendChild(cd.root);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'button-row';
  const btnConn = document.createElement('button');
  btnConn.textContent = 'Connect to...';
  btnConn.onclick = () => openCreateConnectionFor(n.id);
  const btnDel = document.createElement('button');
  btnDel.className = 'danger'; btnDel.textContent = 'Delete node';
  btnDel.onclick = () => deleteNode(n.id);
  actions.appendChild(btnConn);
  actions.appendChild(btnDel);
  f.appendChild(actions);

  return f;
}

function metaLine(n) {
  const d = document.createElement('div');
  d.style.fontSize='11px'; d.style.color='var(--fg-dim)';
  d.textContent = `Created ${n.createdAt.slice(0,16).replace('T',' ')} • Updated ${n.updatedAt.slice(0,16).replace('T',' ')} • By ${n.createdBy||'—'}`;
  return d;
}

function section(title, openByDefault) {
  const root = document.createElement('details');
  if (openByDefault) root.open = true;
  const sum = document.createElement('summary'); sum.textContent = title;
  root.appendChild(sum);
  const body = document.createElement('div');
  body.style.display = 'flex'; body.style.flexDirection = 'column';
  body.style.gap = '6px'; body.style.marginTop = '6px';
  root.appendChild(body);
  return { root, body };
}

function emptyMsg() {
  const e = document.createElement('div');
  e.className = 'empty-state';
  e.innerHTML = '<h3>Not found</h3><p>Item no longer exists.</p>';
  return e;
}

function touchNode(n) {
  n.updatedAt = new Date().toISOString();
  saveProject(true);
  renderAllNodesOnMap();
  renderAllConnectionsOnMap();
  refreshLists();
}

function deleteNode(id) {
  const n = nodeById(id);
  if (!n) return;
  confirmModal(`Delete node "${n.name}" and all its connections? This cannot be undone.`, () => {
    state.nodes = state.nodes.filter(x => x.id !== id);
    state.connections = state.connections.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id);
    if (markers[id]) { markers[id].setMap(null); delete markers[id]; }
    refreshAll();
    document.getElementById('detail-content').innerHTML =
      '<div class="empty-state"><h3>Node deleted.</h3></div>';
    toast('Node deleted.', 'warn');
  });
}

/* ----------------------- Connection Form ---------------------------- */

function buildConnectionForm(c) {
  if (!c) return emptyMsg();
  const f = document.createElement('div'); f.className = 'detail-form';
  const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
  f.innerHTML = `<div style="font-weight:700">Connection</div>
    <div style="color:var(--fg-dim);font-size:11px">ID: ${c.id}</div>`;
  f.appendChild(rowField('From node',
    makeSelect(c.sourceNodeId, state.nodes.map(n=>n.id), v => { c.sourceNodeId=v; saveProject(true); renderAllConnectionsOnMap(); },
               state.nodes.map(n=>n.name))));
  f.appendChild(rowField('To node',
    makeSelect(c.targetNodeId, state.nodes.map(n=>n.id), v => { c.targetNodeId=v; saveProject(true); renderAllConnectionsOnMap(); },
               state.nodes.map(n=>n.name))));
  f.appendChild(rowField('Relationship type',
    makeSelect(c.relationshipType, REL_TYPES, v => { c.relationshipType=v; saveProject(true); renderAllConnectionsOnMap(); })));
  f.appendChild(rowField('Strength', makeSelect(c.strength, REL_STRENGTHS, v => { c.strength=v; saveProject(true); renderAllConnectionsOnMap(); })));
  f.appendChild(rowField('Direction', makeSelect(c.direction, REL_DIRECTIONS, v => { c.direction=v; saveProject(true); })));
  f.appendChild(rowField('Confidence', makeSelect(c.confidence, REL_CONFIDENCE, v => { c.confidence=v; saveProject(true); })));
  f.appendChild(rowField('Status', makeSelect(c.status, REL_STATUSES, v => { c.status=v; saveProject(true); renderAllConnectionsOnMap(); })));
  f.appendChild(rowField('Source type', makeSelect(c.sourceType, SOURCE_TYPES, v => { c.sourceType=v; saveProject(true); })));
  f.appendChild(rowField('LOE',
    makeSelect(c.loeId, ['', ...state.loes.map(l=>l.id)], v => { c.loeId=v; saveProject(true); },
               ['—', ...state.loes.map(l=>l.name)])));
  f.appendChild(rowField('Info requirement', makeTextarea(c.infoRequirement, v => { c.infoRequirement=v; saveProject(true); })));
  f.appendChild(rowField('Engagement objective', makeTextarea(c.engagementObjective, v => { c.engagementObjective=v; saveProject(true); })));
  f.appendChild(rowField('Risk', makeSelect(c.risk, RISK_LEVELS, v => { c.risk=v; saveProject(true); })));
  f.appendChild(rowField('Opportunity', makeSelect(c.opportunity, OPP_LEVELS, v => { c.opportunity=v; saveProject(true); })));
  f.appendChild(rowField('Date observed', makeInput(c.dateObserved, v => { c.dateObserved=v; saveProject(true); }, 'date')));
  f.appendChild(rowField('CNDE status', makeSelect(c.cndeStatus, CNDE_STATUSES, v => { c.cndeStatus=v; saveProject(true); }), 'CNDE'));
  f.appendChild(rowField('Notes', makeTextarea(c.notes, v => { c.notes=v; saveProject(true); })));

  const del = document.createElement('button');
  del.className = 'danger'; del.textContent = 'Delete connection';
  del.onclick = () => {
    confirmModal('Delete this connection?', () => {
      state.connections = state.connections.filter(x => x.id !== c.id);
      if (polylines[c.id]) { polylines[c.id].setMap(null); delete polylines[c.id]; }
      saveProject(true); refreshAll();
      document.getElementById('detail-content').innerHTML =
        '<div class="empty-state"><h3>Connection deleted.</h3></div>';
    });
  };
  const row = document.createElement('div'); row.className='button-row'; row.appendChild(del);
  f.appendChild(row);
  return f;
}

function openCreateConnectionFor(nodeId) {
  if (state.nodes.length < 2) {
    toast('Create at least one more node before connecting.', 'warn'); return;
  }
  const c = newConnection({ sourceNodeId: nodeId });
  // pick first other node by default
  const other = state.nodes.find(n => n.id !== nodeId);
  if (other) c.targetNodeId = other.id;
  state.connections.push(c);
  saveProject(true);
  renderAllConnectionsOnMap();
  refreshLists();
  openDetail('connection', c.id);
}

/* ----------------------- LOE Form ----------------------------------- */

function buildLoeForm(l) {
  if (!l) return emptyMsg();
  const f = document.createElement('div'); f.className = 'detail-form';
  f.innerHTML = `<div style="font-weight:700">Line of Effort</div>
    <div style="color:var(--fg-dim);font-size:11px">ID: ${l.id}</div>`;
  f.appendChild(rowField('Name', makeInput(l.name, v => { l.name=v; saveProject(true); refreshLists(); })));
  f.appendChild(rowField('Color', makeInput(l.color, v => { l.color=v; saveProject(true); refreshLists(); renderAllNodesOnMap(); }, 'color')));
  f.appendChild(rowField('Description', makeTextarea(l.description, v => { l.description=v; saveProject(true); })));
  f.appendChild(rowField('Desired end state', makeTextarea(l.endState, v => { l.endState=v; saveProject(true); })));
  f.appendChild(rowField('Supported higher HQ objective', makeTextarea(l.higherObjective, v => { l.higherObjective=v; saveProject(true); })));
  f.appendChild(rowField('MOP', makeTextarea(l.mop, v => { l.mop=v; saveProject(true); }), 'MOP'));
  f.appendChild(rowField('MOE', makeTextarea(l.moe, v => { l.moe=v; saveProject(true); }), 'MOE'));
  const del = document.createElement('button');
  del.className = 'danger'; del.textContent = 'Delete LOE';
  del.onclick = () => {
    confirmModal(`Delete LOE "${l.name}"? Nodes referencing this LOE will lose their assignment.`, () => {
      state.loes = state.loes.filter(x => x.id !== l.id);
      state.nodes.forEach(n => {
        if (n.primaryLoeId === l.id) n.primaryLoeId = '';
        n.supportingLoes = (n.supportingLoes||[]).filter(x => x !== l.id);
      });
      saveProject(true); refreshAll();
      document.getElementById('detail-content').innerHTML = '<div class="empty-state"><h3>LOE deleted.</h3></div>';
    });
  };
  const row = document.createElement('div'); row.className='button-row'; row.appendChild(del);
  f.appendChild(row);
  return f;
}

/* ----------------------- Engagement Form ---------------------------- */

function buildEngagementForm(e) {
  if (!e) return emptyMsg();
  const f = document.createElement('div'); f.className = 'detail-form';
  f.innerHTML = `<div style="font-weight:700">Engagement Log Entry</div>
    <div style="color:var(--fg-dim);font-size:11px">ID: ${e.id}</div>`;
  f.appendChild(rowField('Date/time', makeInput(e.date, v => { e.date=v; saveProject(true); refreshLists(); }, 'datetime-local')));
  f.appendChild(rowField('Team members present', makeInput(e.team, v => { e.team=v; saveProject(true); })));
  f.appendChild(rowField('Civil actor / node',
    makeSelect(e.nodeId, state.nodes.map(n=>n.id), v => { e.nodeId=v; saveProject(true); refreshLists(); },
               state.nodes.map(n=>n.name))));
  f.appendChild(rowField('Method', makeSelect(e.method, ENGAGEMENT_METHODS, v => { e.method=v; saveProject(true); })));
  f.appendChild(rowField('Location', makeInput(e.location, v => { e.location=v; saveProject(true); })));
  f.appendChild(rowField('Topics discussed', makeTextarea(e.topics, v => { e.topics=v; saveProject(true); })));
  f.appendChild(rowField('Questions asked', makeTextarea(e.questions, v => { e.questions=v; saveProject(true); })));
  f.appendChild(rowField('Answers received', makeTextarea(e.answers, v => { e.answers=v; saveProject(true); })));
  f.appendChild(rowField('Commitments — friendly', makeTextarea(e.commitmentsUs, v => { e.commitmentsUs=v; saveProject(true); })));
  f.appendChild(rowField('Commitments — civil actor', makeTextarea(e.commitmentsThem, v => { e.commitmentsThem=v; saveProject(true); })));
  f.appendChild(rowField('New contacts identified', makeTextarea(e.newContacts, v => { e.newContacts=v; saveProject(true); })));
  f.appendChild(rowField('New locations identified', makeTextarea(e.newLocations, v => { e.newLocations=v; saveProject(true); })));
  f.appendChild(rowField('New issues identified', makeTextarea(e.newIssues, v => { e.newIssues=v; saveProject(true); })));
  f.appendChild(rowField('Follow-up required', makeTextarea(e.followUp, v => { e.followUp=v; saveProject(true); })));
  f.appendChild(rowField('Updated attitude', makeSelect(e.updatedAttitude||'Unknown', ATTITUDES, v => { e.updatedAttitude=v; saveProject(true); })));
  f.appendChild(rowField('Updated access', makeSelect(e.updatedAccess||'Limited', ACCESS_LEVELS, v => { e.updatedAccess=v; saveProject(true); })));
  f.appendChild(rowField('Updated influence', makeSelect(e.updatedInfluence||'Medium', INFLUENCE_LEVELS, v => { e.updatedInfluence=v; saveProject(true); })));
  f.appendChild(rowField('Source reliability', makeSelect(e.reliability||'Medium', CONFIDENCE_LEVELS, v => { e.reliability=v; saveProject(true); }), 'RELIABILITY'));
  f.appendChild(rowField('Confidence', makeSelect(e.confidence||'Medium', CONFIDENCE_LEVELS, v => { e.confidence=v; saveProject(true); }), 'CONFIDENCE'));
  f.appendChild(rowField('Notes', makeTextarea(e.notes, v => { e.notes=v; saveProject(true); })));

  // Post-engagement prompts
  const prompts = section('After this engagement...', true);
  const promptBtn = (label, fn) => {
    const b = document.createElement('button'); b.textContent = label; b.onclick = fn;
    return b;
  };
  prompts.body.appendChild(promptBtn('Convert new contacts/locations into nodes', () => {
    const lines = (e.newContacts || '').split('\n').concat((e.newLocations || '').split('\n'))
                   .map(s => s.trim()).filter(Boolean);
    if (!lines.length) { toast('No new contacts/locations recorded.', 'warn'); return; }
    lines.forEach(name => {
      const n = newNode({ name, cndeStatus: 'Identified' });
      state.nodes.push(n);
    });
    saveProject(true); refreshAll();
    toast(`Created ${lines.length} new node(s).`, 'ok');
  }));
  prompts.body.appendChild(promptBtn('Create follow-up task', () => {
    const t = { id: uid('t'), title: 'Follow up on engagement ' + e.id.slice(-4),
                nodeId: e.nodeId, engagementId: e.id, dueDate: '', priority: 'Medium',
                status: 'Not started', purpose: 'Close follow-up from engagement.',
                expectedOutput: '', notes: e.followUp || '' };
    state.tasks.push(t); saveProject(true); refreshAll();
    openDetail('task', t.id);
  }));
  prompts.body.appendChild(promptBtn('Update assessment / move node to Engaged', () => {
    const n = nodeById(e.nodeId);
    if (n) { n.cndeStatus = 'Engaged';
      if (e.updatedAttitude) n.attitude = e.updatedAttitude;
      if (e.updatedAccess)   n.access   = e.updatedAccess;
      if (e.updatedInfluence)n.influence = e.updatedInfluence;
      touchNode(n);
      toast('Node updated and moved to Engaged.', 'ok');
    }
  }));
  f.appendChild(prompts.root);

  const del = document.createElement('button');
  del.className = 'danger'; del.textContent = 'Delete engagement';
  del.onclick = () => {
    confirmModal('Delete this engagement record?', () => {
      state.engagements = state.engagements.filter(x => x.id !== e.id);
      saveProject(true); refreshAll();
      document.getElementById('detail-content').innerHTML = '<div class="empty-state"><h3>Engagement deleted.</h3></div>';
    });
  };
  const row = document.createElement('div'); row.className='button-row'; row.appendChild(del);
  f.appendChild(row);

  return f;
}

/* ----------------------- Task Form ---------------------------------- */

function buildTaskForm(t) {
  if (!t) return emptyMsg();
  const f = document.createElement('div'); f.className = 'detail-form';
  f.innerHTML = `<div style="font-weight:700">Task</div>
    <div style="color:var(--fg-dim);font-size:11px">ID: ${t.id}</div>`;
  f.appendChild(rowField('Title', makeInput(t.title, v => { t.title=v; saveProject(true); refreshLists(); })));
  f.appendChild(rowField('Related node',
    makeSelect(t.nodeId||'', ['', ...state.nodes.map(n=>n.id)], v => { t.nodeId=v; saveProject(true); },
               ['—', ...state.nodes.map(n=>n.name)])));
  f.appendChild(rowField('Related LOE',
    makeSelect(t.loeId||'', ['', ...state.loes.map(l=>l.id)], v => { t.loeId=v; saveProject(true); },
               ['—', ...state.loes.map(l=>l.name)])));
  f.appendChild(rowField('Responsible', makeInput(t.responsible, v => { t.responsible=v; saveProject(true); })));
  f.appendChild(rowField('Due date', makeInput(t.dueDate, v => { t.dueDate=v; saveProject(true); }, 'date')));
  f.appendChild(rowField('Priority', makeSelect(t.priority, PRIORITIES, v => { t.priority=v; saveProject(true); })));
  f.appendChild(rowField('Status', makeSelect(t.status, TASK_STATUSES, v => { t.status=v; saveProject(true); })));
  f.appendChild(rowField('Purpose', makeTextarea(t.purpose, v => { t.purpose=v; saveProject(true); })));
  f.appendChild(rowField('Expected output', makeTextarea(t.expectedOutput, v => { t.expectedOutput=v; saveProject(true); })));
  f.appendChild(rowField('Notes', makeTextarea(t.notes, v => { t.notes=v; saveProject(true); })));
  const del = document.createElement('button');
  del.className = 'danger'; del.textContent = 'Delete task';
  del.onclick = () => {
    confirmModal('Delete this task?', () => {
      state.tasks = state.tasks.filter(x => x.id !== t.id);
      saveProject(true); refreshAll();
      document.getElementById('detail-content').innerHTML = '<div class="empty-state"><h3>Task deleted.</h3></div>';
    });
  };
  const row = document.createElement('div'); row.className='button-row'; row.appendChild(del);
  f.appendChild(row);
  return f;
}

/* ----------------------- CNDE Panels -------------------------------- */

function renderCndePanels() {
  renderCndeBoard();
  renderCndePlan();
  renderCndeEngage();
  renderCndeAnalyze();
  renderCndeDevelop();
  renderCndeAssess();
  renderCndeIntegrate();
}

function renderCndeBoard() {
  const root = document.getElementById('cnde-panel-board');
  root.innerHTML = '';
  const board = document.createElement('div'); board.className = 'kanban-board';
  CNDE_STATUSES.forEach(status => {
    const col = document.createElement('div');
    col.className = 'kanban-col';
    col.dataset.status = status;
    col.innerHTML = `<h4 style="border-left:4px solid ${CNDE_COLORS[status]};padding-left:6px">${status}</h4>`;
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drop-target'); });
    col.addEventListener('dragleave', () => col.classList.remove('drop-target'));
    col.addEventListener('drop', e => {
      e.preventDefault(); col.classList.remove('drop-target');
      const id = e.dataTransfer.getData('text/plain');
      const n = nodeById(id);
      if (n) { n.cndeStatus = status; touchNode(n); renderCndeBoard(); renderDashboard(); }
    });
    state.nodes.filter(n => n.cndeStatus === status).forEach(n => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.style.borderLeftColor = loeColor(n.primaryLoeId);
      const loe = loeById(n.primaryLoeId);
      card.innerHTML = `<strong>${escapeHtml(n.name)}</strong><br>
        <small style="color:var(--fg-dim)">${n.entityType} ${loe ? '• '+loe.name : ''}</small>`;
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', n.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.onclick = () => openDetail('node', n.id);
      col.appendChild(card);
    });
    board.appendChild(col);
  });
  root.appendChild(board);
}

function renderCndePlan() {
  const root = document.getElementById('cnde-panel-plan');
  root.innerHTML = `
    <h3>Plan Civil Network Engagement</h3>
    <p style="color:var(--fg-dim);max-width:780px">Use this tab to capture why an engagement matters before conducting it. Answer the questions below for each node planned for engagement. Updates here flow back to the node's record.</p>
    <ol style="max-width:780px;line-height:1.5">
      <li>Why are we engaging this node?</li>
      <li>What do we need to learn (information requirements / gaps)?</li>
      <li>What civil effect are we trying to create?</li>
      <li>What LOE does this engagement support?</li>
      <li>What commander decision or operation does this inform?</li>
    </ol>
    <p>Open a node from the map or list and use its <strong>Engagement Planning</strong> section to record this. Nodes in status <em>Planned for Engagement</em> appear below.</p>
  `;
  const list = document.createElement('div'); list.style.padding='10px';
  state.nodes.filter(n => n.cndeStatus === 'Planned for Engagement').forEach(n => {
    const card = document.createElement('div');
    card.className = 'dash-card'; card.style.maxWidth = '780px'; card.style.marginBottom='8px';
    const loe = loeById(n.primaryLoeId);
    card.innerHTML = `<h4>${escapeHtml(n.name)} <small style="color:var(--fg-dim)">${loe? '• '+loe.name : ''}</small></h4>
      <div><strong>Why engage:</strong> ${escapeHtml(n.engagementObjective || '(blank)')}</div>
      <div><strong>Desired effect:</strong> ${escapeHtml(n.desiredEffect || '(blank)')}</div>
      <div><strong>Method:</strong> ${escapeHtml(n.engagementMethod)} • <strong>Next:</strong> ${escapeHtml(n.nextEngagementDate || '—')}</div>`;
    card.onclick = () => openDetail('node', n.id);
    list.appendChild(card);
  });
  if (!list.children.length) list.innerHTML = '<p style="color:var(--fg-dim)">No nodes in "Planned for Engagement" status yet.</p>';
  root.appendChild(list);
}

function renderCndeEngage() {
  const root = document.getElementById('cnde-panel-engage');
  root.innerHTML = `<h3>Engagement Log</h3>
    <p style="color:var(--fg-dim)">Record engagements with civil actors. Use the <em>+ Log Engagement</em> button in the left panel or click a row to edit.</p>`;
  const tbl = document.createElement('table');
  tbl.style.width = '100%'; tbl.style.borderCollapse = 'collapse'; tbl.style.fontSize='12px';
  tbl.innerHTML = `<thead><tr style="text-align:left;color:var(--fg-dim)">
    <th>Date</th><th>Node</th><th>Method</th><th>Topics</th><th>Follow-up</th></tr></thead>`;
  const tb = document.createElement('tbody');
  state.engagements.slice().reverse().forEach(e => {
    const tr = document.createElement('tr');
    tr.style.cursor='pointer'; tr.onclick = () => openDetail('engagement', e.id);
    const n = nodeById(e.nodeId);
    tr.innerHTML = `<td style="padding:4px;border-top:1px solid var(--border)">${(e.date||'').slice(0,16).replace('T',' ')}</td>
      <td style="padding:4px;border-top:1px solid var(--border)">${n ? escapeHtml(n.name) : '—'}</td>
      <td style="padding:4px;border-top:1px solid var(--border)">${escapeHtml(e.method||'')}</td>
      <td style="padding:4px;border-top:1px solid var(--border)">${escapeHtml((e.topics||'').slice(0,60))}</td>
      <td style="padding:4px;border-top:1px solid var(--border)">${escapeHtml((e.followUp||'').slice(0,60))}</td>`;
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  root.appendChild(tbl);
  if (!state.engagements.length) root.innerHTML += '<p style="color:var(--fg-dim)">No engagements logged yet.</p>';
}

function renderCndeAnalyze() {
  const root = document.getElementById('cnde-panel-analyze');
  const insights = generateInsights();
  let html = `<h3>Civil Network Analysis</h3>
    <p style="color:var(--fg-dim)">Simple network analytics based on current data. TODO: graph centrality, clustering, geo-clustering.</p>
    <div id="dashboard-grid" style="padding:0">`;
  insights.forEach(ins => {
    html += `<div class="dash-card"><h4>${ins.title}</h4><div>${ins.body}</div></div>`;
  });
  html += '</div>';
  root.innerHTML = html;
}

function renderCndeDevelop() {
  const root = document.getElementById('cnde-panel-develop');
  root.innerHTML = `<h3>Develop Selected Civil Networks</h3>
    <p style="color:var(--fg-dim)">Select nodes to develop into productive civil networks supporting operational effects.</p>
    <button id="btn-dev-recs">Generate Development Recommendations</button>
    <div id="dev-recs" style="margin-top:10px"></div>
    <h4 style="margin-top:14px">Nodes Selected for Development / Being Developed</h4>`;
  const list = document.createElement('div');
  state.nodes.filter(n => /Selected for Development|Being Developed/i.test(n.cndeStatus)).forEach(n => {
    const card = document.createElement('div');
    card.className = 'dash-card'; card.style.marginBottom='8px';
    const loe = loeById(n.primaryLoeId);
    card.innerHTML = `<h4>${escapeHtml(n.name)} <small style="color:var(--fg-dim)">${loe? '• '+loe.name : ''}</small></h4>
      <div><strong>Desired effect:</strong> ${escapeHtml(n.desiredEffect || '(blank)')}</div>
      <div><strong>Capability/resource:</strong> ${escapeHtml(n.civilCapability || '(blank)')}</div>
      <div><strong>Risks:</strong> ${escapeHtml(n.risk)}</div>
      <div><strong>Responsible:</strong> ${escapeHtml(n.responsible || '—')}</div>`;
    card.onclick = () => openDetail('node', n.id);
    list.appendChild(card);
  });
  if (!list.children.length) list.innerHTML = '<p style="color:var(--fg-dim)">No nodes currently selected for development.</p>';
  root.appendChild(list);
  document.getElementById('btn-dev-recs').onclick = () => {
    document.getElementById('dev-recs').innerHTML = generateDevRecommendations()
      .map(r => `<div class="dash-card" style="margin-bottom:6px"><strong>${escapeHtml(r.title)}</strong><br>${escapeHtml(r.body)}</div>`)
      .join('');
  };
}

function renderCndeAssess() {
  const root = document.getElementById('cnde-panel-assess');
  const byStatus = {};
  CNDE_STATUSES.forEach(s => byStatus[s] = 0);
  state.nodes.forEach(n => byStatus[n.cndeStatus] = (byStatus[n.cndeStatus]||0) + 1);

  let html = `<h3>Assessment</h3>
    <p style="color:var(--fg-dim)">Track MOP / MOE for nodes, connections, LOEs, engagements, and the overall network. (Simple summary view; richer rubric TODO.)</p>
    <div id="dashboard-grid" style="padding:0">
    <div class="dash-card"><h4>Nodes by CNDE status</h4><ul>`;
  CNDE_STATUSES.forEach(s => { html += `<li>${s}: <strong>${byStatus[s]}</strong></li>`; });
  html += `</ul></div>
    <div class="dash-card"><h4>Engagements</h4>
      <div class="big-num">${state.engagements.length}</div>
      <small style="color:var(--fg-dim)">total recorded</small></div>
    <div class="dash-card"><h4>Open information gaps</h4>
      <div class="big-num">${state.nodes.filter(n => n.infoGaps).length}</div></div>
    <div class="dash-card"><h4>Nodes requiring reassessment</h4>
      <div class="big-num">${byStatus['Reassess Required']||0}</div></div>
    <div class="dash-card full"><h4>LOE roll-up</h4><ul>`;
  state.loes.forEach(l => {
    const cnt = state.nodes.filter(n => n.primaryLoeId === l.id).length;
    const eng = state.nodes.filter(n => n.primaryLoeId === l.id && n.cndeStatus === 'Engaged').length;
    html += `<li><span class="badge loe" style="border-left:4px solid ${l.color};padding-left:6px">${escapeHtml(l.name)}</span>
            ${cnt} nodes • ${eng} engaged • MOP: ${escapeHtml(l.mop || '—')} • MOE: ${escapeHtml(l.moe || '—')}</li>`;
  });
  html += '</ul></div></div>';
  root.innerHTML = html;
}

function renderCndeIntegrate() {
  const root = document.getElementById('cnde-panel-integrate');
  root.innerHTML = `<h3>Integrate Civil Network Knowledge into Operations</h3>
    <p style="color:var(--fg-dim)">Turn civil network work into useful staff products. See the <em>Exports</em> tab for the full set. Recommended task statements appear below.</p>
    <div id="frago-list"></div>`;
  const list = document.getElementById('frago-list');
  generateFragoTasks().forEach(s => {
    const c = document.createElement('div');
    c.className = 'dash-card'; c.style.marginBottom = '6px';
    c.innerHTML = `<code style="white-space:pre-wrap">${escapeHtml(s)}</code>`;
    list.appendChild(c);
  });
  if (!list.children.length) list.innerHTML = '<p style="color:var(--fg-dim)">Set priority/LOE/objectives on nodes to generate task statements.</p>';
}

/* CNDE Tab switcher */
function setCndeTab(name) {
  document.querySelectorAll('.cnde-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.cndeTab === name));
  document.querySelectorAll('.cnde-panel').forEach(p =>
    p.classList.toggle('hidden', p.id !== 'cnde-panel-' + name));
}

/* ----------------------- Insights & Recommendations ------------------ */

function generateInsights() {
  const out = [];
  if (!state.nodes.length) return [{title:'No data', body:'Load sample data or create nodes to see analysis.'}];

  // Most connected
  const connCount = {};
  state.connections.forEach(c => {
    connCount[c.sourceNodeId] = (connCount[c.sourceNodeId]||0) + 1;
    connCount[c.targetNodeId] = (connCount[c.targetNodeId]||0) + 1;
  });
  const sorted = state.nodes.slice().sort((a,b) => (connCount[b.id]||0) - (connCount[a.id]||0));
  const top = sorted.slice(0,3).filter(n => connCount[n.id]);
  out.push({title:'Most connected (potential broker)',
    body: top.length ? top.map(n => `${escapeHtml(n.name)} (${connCount[n.id]||0} ties)`).join('<br>') : 'No connections recorded.'});

  // High influence / low access
  const hilo = state.nodes.filter(n => /High|Critical/.test(n.influence) && /No access|Limited/.test(n.access));
  out.push({title:'High influence / low access',
    body: hilo.length ? hilo.map(n => escapeHtml(n.name)).join('<br>') : 'None.'});

  // High risk / high opportunity
  const hr = state.nodes.filter(n => /High|Extreme/.test(n.risk) && /High/.test(n.opportunity));
  out.push({title:'High risk / high opportunity',
    body: hr.length ? hr.map(n => escapeHtml(n.name)).join('<br>') : 'None.'});

  // Isolated nodes
  const isolated = state.nodes.filter(n => !connCount[n.id]);
  out.push({title:'Isolated nodes',
    body: isolated.length ? isolated.map(n => escapeHtml(n.name)).join('<br>') : 'None.'});

  // Nodes without LOE
  const noLoe = state.nodes.filter(n => !n.primaryLoeId);
  out.push({title:'Nodes without LOE assignment',
    body: noLoe.length ? noLoe.map(n => escapeHtml(n.name)).join('<br>') : 'All nodes have a primary LOE.'});

  // Information gaps
  const gaps = state.nodes.filter(n => n.infoGaps);
  out.push({title:'Open information gaps',
    body: gaps.length ? gaps.map(n => `<strong>${escapeHtml(n.name)}:</strong> ${escapeHtml((n.infoGaps||'').slice(0,80))}`).join('<br>') : 'None.'});

  // Low-confidence relationships
  const lowConf = state.connections.filter(c => c.confidence === 'Low' || c.status === 'Needs validation');
  out.push({title:'Relationships needing validation',
    body: lowConf.length ? lowConf.map(c => {
      const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
      return `${a?a.name:'?'} ↔ ${b?b.name:'?'} (${c.relationshipType})`;
    }).join('<br>') : 'None.'});

  // Reassess required
  const reassess = state.nodes.filter(n => n.cndeStatus === 'Reassess Required');
  out.push({title:'Nodes requiring reassessment',
    body: reassess.length ? reassess.map(n => escapeHtml(n.name)).join('<br>') : 'None.'});

  // Vulnerable populations without linked capability
  const vuln = state.nodes.filter(n => n.networkRole === 'Vulnerable population');
  out.push({title:'Vulnerable populations',
    body: vuln.length ? vuln.map(n => escapeHtml(n.name)).join('<br>') : 'None tagged.'});

  // Next Best Engagement
  out.push({title:'Next Best Engagement', body: nextBestEngagement()});

  return out;
}

function nextBestEngagement() {
  // Simple scoring: priority + influence + opportunity - risk + access boost
  const score = (n) => {
    const pri = ({Low:1,Medium:2,High:3,Urgent:4})[n.priority]||1;
    const inf = ({Low:1,Medium:2,High:3,Critical:4})[n.influence]||1;
    const opp = ({Low:1,Medium:2,High:3})[n.opportunity]||1;
    const risk = ({Low:0,Medium:1,High:2,Extreme:3})[n.risk]||0;
    const acc = ({['No access']:3,Limited:2,Established:1,Trusted:0})[n.access]||0;
    const gapBonus = n.infoGaps ? 1 : 0;
    const reassess = n.cndeStatus === 'Reassess Required' ? 1 : 0;
    return pri*2 + inf*1.5 + opp + gapBonus + reassess - risk*0.5 + acc*0.5;
  };
  if (!state.nodes.length) return 'No nodes yet.';
  const ranked = state.nodes.slice().sort((a,b) => score(b) - score(a));
  const top = ranked[0];
  const loe = loeById(top.primaryLoeId);
  let access = [];
  state.connections.forEach(c => {
    if (c.sourceNodeId === top.id) { const o = nodeById(c.targetNodeId); if (o) access.push(o.name); }
    if (c.targetNodeId === top.id) { const o = nodeById(c.sourceNodeId); if (o) access.push(o.name); }
  });
  let rec = `Engage <strong>${escapeHtml(top.name)}</strong> next`;
  if (access.length) rec += ` to gain access to ${escapeHtml(access.slice(0,3).join(', '))}`;
  if (loe) rec += `. Supports <strong>${escapeHtml(loe.name)}</strong>`;
  if (top.infoGaps) rec += `; may close information gap: <em>${escapeHtml((top.infoGaps||'').slice(0,60))}</em>`;
  rec += '.';
  return rec;
}

function generateDevRecommendations() {
  const recs = [];
  const connCount = {};
  state.connections.forEach(c => {
    connCount[c.sourceNodeId] = (connCount[c.sourceNodeId]||0) + 1;
    connCount[c.targetNodeId] = (connCount[c.targetNodeId]||0) + 1;
  });
  // Strengthen weak ties on important nodes
  state.connections.filter(c => c.strength === 'Weak').forEach(c => {
    const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
    if (a && b && (/High|Critical/.test(a.influence) || /High|Critical/.test(b.influence)))
      recs.push({title:'Strengthen important weak tie',
        body: `${a.name} ↔ ${b.name} (${c.relationshipType}). High influence on at least one side — invest engagements to strengthen.`});
  });
  // Service provider to vulnerable population gaps
  const services = state.nodes.filter(n => n.networkRole === 'Service provider' || /Essential service|Medical|School/.test(n.entityType));
  const vulns    = state.nodes.filter(n => n.networkRole === 'Vulnerable population' || /Displaced/.test(n.entityType));
  vulns.forEach(v => {
    const linked = state.connections.some(c =>
      (c.sourceNodeId === v.id && services.some(s => s.id === c.targetNodeId)) ||
      (c.targetNodeId === v.id && services.some(s => s.id === c.sourceNodeId)));
    if (!linked) recs.push({title:'Missing service-to-vulnerable tie',
      body: `${v.name} has no connection to a service provider. Identify a service node and create a connection.`});
  });
  // High-influence/low-access
  state.nodes.filter(n => /High|Critical/.test(n.influence) && /No access|Limited/.test(n.access)).forEach(n => {
    recs.push({title:'Build access through trusted intermediary',
      body: `${n.name} is high influence but low access. Identify a trusted broker connection and engage them first.`});
  });
  // Single-point dependencies
  Object.keys(connCount).forEach(id => {
    if (connCount[id] >= 4) {
      const n = nodeById(id);
      if (n) recs.push({title:'Reduce dependence on single gatekeeper',
        body: `${n.name} sits on many ties (${connCount[id]}). Identify redundancy to avoid single-point-of-failure.`});
    }
  });
  if (!recs.length) recs.push({title:'No recommendations',
    body:'Add more nodes, connections, and assessments to generate recommendations.'});
  return recs;
}

function generateFragoTasks() {
  const out = [];
  state.nodes.filter(n => /High|Urgent/.test(n.priority) || n.cndeStatus === 'Planned for Engagement').forEach(n => {
    const loe = loeById(n.primaryLoeId);
    const team = n.responsible || state.projectMetadata.unit || '[Unit]';
    const when = n.nextEngagementDate || 'NLT [date]';
    const need = n.civilRequirement || n.civilVulnerability || n.infoGaps || '[civil requirement/vulnerability]';
    const ao  = state.projectMetadata.ao || '[AO]';
    const sup = loe ? loe.name : '[LOE]';
    const dec = n.cdrEndState || '[commander decision/operation]';
    out.push(`${team} conducts civil engagement with ${n.name} NLT ${when} to identify ${need} in ${ao}, in order to support ${sup} and inform ${dec}.`);
  });
  return out;
}

/* ----------------------- Dashboard ---------------------------------- */

function renderDashboard() {
  const root = document.getElementById('dashboard-grid');
  root.innerHTML = '';

  const byStatus = {};
  CNDE_STATUSES.forEach(s => byStatus[s] = 0);
  state.nodes.forEach(n => byStatus[n.cndeStatus] = (byStatus[n.cndeStatus]||0)+1);

  const card = (h, body, cls) => {
    const d = document.createElement('div'); d.className = 'dash-card' + (cls?' '+cls:'');
    d.innerHTML = `<h4>${h}</h4>${body}`;
    return d;
  };
  root.appendChild(card('Total nodes', `<div class="big-num">${state.nodes.length}</div>`));
  root.appendChild(card('Connections', `<div class="big-num">${state.connections.length}</div>`));
  root.appendChild(card('Engagements', `<div class="big-num">${state.engagements.length}</div>`));
  root.appendChild(card('LOEs', `<div class="big-num">${state.loes.length}</div>`));
  root.appendChild(card('Reassess required', `<div class="big-num">${byStatus['Reassess Required']||0}</div>`));
  root.appendChild(card('Planned engagements', `<div class="big-num">${byStatus['Planned for Engagement']||0}</div>`));
  root.appendChild(card('Engaged', `<div class="big-num">${byStatus['Engaged']||0}</div>`));
  root.appendChild(card('Being developed', `<div class="big-num">${byStatus['Being Developed']||0}</div>`));

  // Nodes by CNDE status
  let html = '<ul>';
  CNDE_STATUSES.forEach(s => {
    html += `<li><span class="badge cnde" style="border-left:4px solid ${CNDE_COLORS[s]};padding-left:6px">${s}</span> ${byStatus[s]||0}</li>`;
  });
  html += '</ul>';
  root.appendChild(card('Nodes by CNDE status', html, 'full'));

  // High-influence / low-access
  const hilo = state.nodes.filter(n => /High|Critical/.test(n.influence) && /No access|Limited/.test(n.access));
  root.appendChild(card('High influence / low access',
    hilo.length ? '<ul>'+hilo.map(n => '<li>'+escapeHtml(n.name)+'</li>').join('')+'</ul>' : '<small>None.</small>'));

  // High risk / high opportunity
  const hrho = state.nodes.filter(n => /High|Extreme/.test(n.risk) && /High/.test(n.opportunity));
  root.appendChild(card('High risk / high opportunity',
    hrho.length ? '<ul>'+hrho.map(n => '<li>'+escapeHtml(n.name)+'</li>').join('')+'</ul>' : '<small>None.</small>'));

  // Open info gaps
  const gaps = state.nodes.filter(n => n.infoGaps);
  root.appendChild(card('Open information gaps',
    gaps.length ? '<ul>'+gaps.slice(0,5).map(n => '<li>'+escapeHtml(n.name)+'</li>').join('')+'</ul>' : '<small>None.</small>'));

  // Connections needing validation
  const cv = state.connections.filter(c => c.confidence === 'Low' || c.status === 'Needs validation');
  root.appendChild(card('Connections needing validation', `<div class="big-num">${cv.length}</div>`));

  // Upcoming follow-ups
  const today = new Date().toISOString().slice(0,10);
  const upcoming = state.nodes.filter(n => n.nextEngagementDate && n.nextEngagementDate >= today)
                              .sort((a,b) => a.nextEngagementDate.localeCompare(b.nextEngagementDate));
  root.appendChild(card('Upcoming engagements',
    upcoming.length ? '<ul>'+upcoming.slice(0,6).map(n => `<li>${escapeHtml(n.nextEngagementDate)} — ${escapeHtml(n.name)}</li>`).join('')+'</ul>' : '<small>None scheduled.</small>'));

  // Overdue engagements
  const overdue = state.nodes.filter(n => n.nextEngagementDate && n.nextEngagementDate < today && n.cndeStatus !== 'Engaged');
  root.appendChild(card('Overdue engagements', `<div class="big-num">${overdue.length}</div>`));

  // Next best engagement
  root.appendChild(card('Next Best Engagement', '<small>'+nextBestEngagement()+'</small>', 'full'));
}

/* ----------------------- Network Graph View ------------------------- */

function renderGraphView() {
  const root = document.getElementById('network-graph');
  if (!root) return;
  root.innerHTML = '';

  // TODO: replace with Cytoscape.js for proper layout, zoom, selection.
  const W = root.clientWidth || 800;
  const H = root.clientHeight || 500;
  const cx = W/2, cy = H/2, R = Math.min(W,H)/2 - 60;

  const svgns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Position nodes on a circle (simple layout)
  const pos = {};
  state.nodes.forEach((n, i) => {
    const angle = (2*Math.PI*i)/Math.max(1, state.nodes.length);
    pos[n.id] = { x: cx + R*Math.cos(angle), y: cy + R*Math.sin(angle) };
  });

  // Edges
  state.connections.forEach(c => {
    const a = pos[c.sourceNodeId], b = pos[c.targetNodeId];
    if (!a || !b) return;
    const line = document.createElementNS(svgns, 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke-width', c.strength === 'Strong' ? 3 : (c.strength === 'Moderate' ? 2 : 1));
    let cls = 'graph-edge';
    if (c.status === 'Suspected') cls += ' suspected';
    if (c.status === 'Planned')   cls += ' planned';
    if (/Conflict|Compete/i.test(c.relationshipType)) cls += ' conflict';
    line.setAttribute('class', cls);
    line.style.cursor = 'pointer';
    line.addEventListener('click', () => openDetail('connection', c.id));
    svg.appendChild(line);
  });
  // Nodes
  state.nodes.forEach(n => {
    const g = document.createElementNS(svgns, 'g');
    g.setAttribute('class', 'graph-node');
    g.setAttribute('transform', `translate(${pos[n.id].x},${pos[n.id].y})`);
    g.style.cursor='pointer';
    const circ = document.createElementNS(svgns, 'circle');
    circ.setAttribute('r', 12);
    circ.setAttribute('fill', loeColor(n.primaryLoeId));
    g.appendChild(circ);
    const txt = document.createElementNS(svgns, 'text');
    txt.setAttribute('x', 16); txt.setAttribute('y', 4);
    txt.textContent = n.name;
    g.appendChild(txt);
    g.addEventListener('click', () => openDetail('node', n.id));
    svg.appendChild(g);
  });
  root.appendChild(svg);
  if (!state.nodes.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.position='absolute'; empty.style.top='50%'; empty.style.left='50%';
    empty.style.transform='translate(-50%,-50%)';
    empty.innerHTML = '<h3>No civil network nodes yet</h3><p>Create nodes or load sample data.</p>';
    root.appendChild(empty);
  }
}

/* ----------------------- Exports ------------------------------------ */

function exportThing(kind) {
  const proj = state.projectMetadata;
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  if (kind === 'nodes-csv')      return exportCSV('nodes', csvNodes());
  if (kind === 'connections-csv')return exportCSV('connections', csvConnections());
  if (kind === 'engagements-csv')return exportCSV('engagements', csvEngagements());
  if (kind === 'tasks-csv')      return exportCSV('tasks', csvTasks());
  if (kind === 'geojson')        return exportFile('geojson.json',
                                    JSON.stringify(toGeoJSON(), null, 2), 'application/geo+json');
  if (kind === 'cnep')        return exportFile('civil-network-engagement-plan.md', mdCnep(), 'text/markdown');
  if (kind === 'running-estimate') return exportFile('ca-running-estimate.md', mdRunningEstimate(), 'text/markdown');
  if (kind === 'kle')         return exportFile('kle-engagement-tracker.md', mdKLE(), 'text/markdown');
  if (kind === 'cicm')        return exportFile('civil-info-collection-matrix.md', mdCICM(), 'text/markdown');
  if (kind === 'ascope')      return exportFile('ascope-pmesii-summary.md', mdAscopePmesii(), 'text/markdown');
  if (kind === 'loe-assessment') return exportFile('loe-assessment.md', mdLoeAssessment(), 'text/markdown');
  if (kind === 'frago')       return exportFile('frago-recommended-tasks.md', mdFrago(), 'text/markdown');
  if (kind === 'commander')   return exportFile('commander-update.md', mdCommander(), 'text/markdown');
  if (kind === 'gaps')        return exportFile('information-gaps.md', mdGaps(), 'text/markdown');
  if (kind === 'vulncap')     return exportFile('vulnerabilities-capabilities.md', mdVulnCap(), 'text/markdown');
  if (kind === 'html-report') return exportFile('civnet-report.html', htmlReport(), 'text/html');
  toast('Unknown export: '+kind, 'err');
}

function exportFile(name, content, mime) {
  download(new Blob([content], { type: mime || 'text/plain' }), name);
  toast('Exported: ' + name, 'ok');
}
function exportCSV(name, rows) {
  const csv = rows.map(r => r.map(cell => csvCell(cell)).join(',')).join('\n');
  exportFile(name + '.csv', csv, 'text/csv');
}
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? '"' + s + '"' : s;
}

function csvNodes() {
  const rows = [['id','name','entityType','lat','lng','primaryLoe','cndeStatus',
    'influence','access','attitude','priority','risk','opportunity',
    'ascope','pmesii','sweatms','civilVulnerability','civilCapability','infoGaps',
    'nextEngagementDate','responsible']];
  state.nodes.forEach(n => {
    const loe = loeById(n.primaryLoeId);
    rows.push([n.id,n.name,n.entityType,n.lat,n.lng, loe?loe.name:'', n.cndeStatus,
      n.influence,n.access,n.attitude,n.priority,n.risk,n.opportunity,
      n.ascope,n.pmesii,(n.sweatms||[]).join(';'),
      n.civilVulnerability,n.civilCapability,n.infoGaps,
      n.nextEngagementDate,n.responsible]);
  });
  return rows;
}
function csvConnections() {
  const rows = [['id','from','to','type','strength','direction','confidence','status','loe','risk','opportunity','cnde','notes']];
  state.connections.forEach(c => {
    const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
    const loe = loeById(c.loeId);
    rows.push([c.id, a?a.name:'', b?b.name:'', c.relationshipType, c.strength, c.direction,
      c.confidence, c.status, loe?loe.name:'', c.risk, c.opportunity, c.cndeStatus, c.notes]);
  });
  return rows;
}
function csvEngagements() {
  const rows = [['id','date','team','node','method','location','topics','followUp','reliability','confidence']];
  state.engagements.forEach(e => {
    const n = nodeById(e.nodeId);
    rows.push([e.id,e.date,e.team,n?n.name:'',e.method,e.location,e.topics,e.followUp,e.reliability,e.confidence]);
  });
  return rows;
}
function csvTasks() {
  const rows = [['id','title','node','loe','responsible','dueDate','priority','status']];
  state.tasks.forEach(t => {
    const n = nodeById(t.nodeId), l = loeById(t.loeId);
    rows.push([t.id,t.title,n?n.name:'',l?l.name:'',t.responsible,t.dueDate,t.priority,t.status]);
  });
  return rows;
}
function toGeoJSON() {
  const features = [];
  state.nodes.forEach(n => features.push({
    type:'Feature',
    geometry:{type:'Point',coordinates:[n.lng,n.lat]},
    properties:{ id:n.id, name:n.name, entityType:n.entityType,
      primaryLoe: (loeById(n.primaryLoeId)||{}).name, cndeStatus:n.cndeStatus,
      influence:n.influence, access:n.access, priority:n.priority }
  }));
  state.connections.forEach(c => {
    const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
    if (!a || !b) return;
    features.push({
      type:'Feature',
      geometry:{type:'LineString',coordinates:[[a.lng,a.lat],[b.lng,b.lat]]},
      properties:{ id:c.id, type:c.relationshipType, strength:c.strength, status:c.status }
    });
  });
  return { type:'FeatureCollection', features };
}

/* Markdown exports */

function mdHeader() {
  const p = state.projectMetadata;
  return `# ${p.name}\n\n` +
    `_Unit:_ ${p.unit||'—'}  _AO:_ ${p.ao||'—'}  _AI:_ ${p.ai||'—'}  \n` +
    `_Operator:_ ${p.operator||'—'}  _Generated:_ ${new Date().toISOString().slice(0,16).replace('T',' ')}\n\n` +
    `> **UNCLASSIFIED — TRAINING USE ONLY.** Do not enter classified, CUI, PII, intelligence source, or sensitive real-world operational details.\n\n`;
}

function mdCnep() {
  let s = mdHeader();
  s += `# Civil Network Engagement Plan\n\n`;
  s += `## 1. Situation overview\n\n${state.projectMetadata.higherHq || '(higher HQ objective)'}\n\n`;
  s += `## 2. Commander's intent (notional / training)\n\n${state.projectMetadata.cdrIntent || '(intent)'}\n\n`;
  s += `## 3. Civil considerations\n\n`;
  s += `- Total civil network nodes: ${state.nodes.length}\n`;
  s += `- Connections: ${state.connections.length}\n`;
  s += `- LOEs: ${state.loes.map(l => l.name).join(', ')}\n\n`;
  s += `## 4. Key civil actors\n\n`;
  state.nodes.filter(n => /High|Critical/.test(n.influence)).forEach(n => {
    s += `- **${n.name}** (${n.entityType}) — Influence ${n.influence}, Access ${n.access}, Priority ${n.priority}\n`;
  });
  s += `\n## 5. Civil network analysis\n\n`;
  generateInsights().forEach(i => { s += `### ${i.title}\n\n${stripHtml(i.body)}\n\n`; });
  s += `## 6. LOEs and engagement priorities\n\n`;
  state.loes.forEach(l => {
    const nodes = state.nodes.filter(n => n.primaryLoeId === l.id);
    s += `### ${l.name}\n\n${l.description||'(no description)'}\n\n`;
    s += `- End state: ${l.endState||'—'}\n- MOP: ${l.mop||'—'}\n- MOE: ${l.moe||'—'}\n`;
    s += `- Assigned nodes: ${nodes.map(n=>n.name).join(', ')||'—'}\n\n`;
  });
  s += `## 7. CNDE cycle status summary\n\n`;
  CNDE_STATUSES.forEach(st => {
    const cnt = state.nodes.filter(n => n.cndeStatus === st).length;
    s += `- ${st}: ${cnt}\n`;
  });
  s += `\n## 8. Recommended engagement sequence\n\n`;
  generateFragoTasks().forEach(t => s += `- ${t}\n`);
  s += `\n## 9. Risks and mitigations\n\n`;
  state.nodes.filter(n => /High|Extreme/.test(n.risk)).forEach(n => {
    s += `- ${n.name}: risk ${n.risk}. ${n.assessmentNotes||''}\n`;
  });
  s += `\n## 10. Information gaps\n\n`;
  state.nodes.filter(n => n.infoGaps).forEach(n => s += `- **${n.name}:** ${n.infoGaps}\n`);
  s += `\n## 11. MOP / MOE\n\n`;
  state.loes.forEach(l => s += `- **${l.name}**: MOP ${l.mop||'—'} • MOE ${l.moe||'—'}\n`);
  s += `\n## 12. Appendix: Node list\n\n`;
  state.nodes.forEach(n => s += `- **${n.name}** (${n.entityType}) — LOE: ${(loeById(n.primaryLoeId)||{}).name||'—'} — CNDE: ${n.cndeStatus}\n`);
  s += `\n## 13. Appendix: Connection list\n\n`;
  state.connections.forEach(c => {
    const a = nodeById(c.sourceNodeId), b = nodeById(c.targetNodeId);
    s += `- ${a?a.name:'?'} — ${c.relationshipType} → ${b?b.name:'?'} (${c.status}, ${c.strength})\n`;
  });
  s += `\n## 14. Appendix: Engagement tracker\n\n`;
  state.engagements.forEach(e => {
    const n = nodeById(e.nodeId);
    s += `- ${(e.date||'').slice(0,16).replace('T',' ')} — ${n?n.name:'?'} (${e.method}). ${e.topics||''}\n`;
  });
  s += `\n## 15. Appendix: Task tracker\n\n`;
  state.tasks.forEach(t => s += `- [${t.status}] ${t.title} — due ${t.dueDate||'—'} — ${t.responsible||'—'}\n`);
  return s;
}

function mdRunningEstimate() {
  let s = mdHeader();
  s += `# Civil Affairs Running Estimate\n\n`;
  s += `## Mission\n\n${state.projectMetadata.cdrIntent || '(insert mission)'}\n\n`;
  s += `## Civil considerations summary\n\n`;
  s += `- Civil network nodes: ${state.nodes.length}\n- LOEs: ${state.loes.length}\n- Engagements: ${state.engagements.length}\n\n`;
  s += `## ASCOPE summary\n\n`;
  ASCOPE_CATS.forEach(c => {
    const ns = state.nodes.filter(n => n.ascope === c);
    s += `### ${c}\n\n` + (ns.length ? ns.map(n => '- '+n.name).join('\n') : '_(none)_') + '\n\n';
  });
  s += `## PMESII-PT summary\n\n`;
  PMESII_CATS.forEach(c => {
    const ns = state.nodes.filter(n => n.pmesii === c);
    s += `### ${c}\n\n` + (ns.length ? ns.map(n => '- '+n.name).join('\n') : '_(none)_') + '\n\n';
  });
  s += `## Civil vulnerabilities\n\n`;
  state.nodes.filter(n => n.civilVulnerability).forEach(n => s += `- **${n.name}:** ${n.civilVulnerability}\n`);
  s += `\n## Civil capabilities\n\n`;
  state.nodes.filter(n => n.civilCapability).forEach(n => s += `- **${n.name}:** ${n.civilCapability}\n`);
  s += `\n## Civil requirements\n\n`;
  state.nodes.filter(n => n.civilRequirement).forEach(n => s += `- **${n.name}:** ${n.civilRequirement}\n`);
  s += `\n## Effects on civilians\n\n`;
  state.nodes.filter(n => n.missionImpactOnCivilians).forEach(n => s += `- **${n.name}:** ${n.missionImpactOnCivilians}\n`);
  s += `\n## Effects of civilians on operations\n\n`;
  state.nodes.filter(n => n.civilImpactOnMission).forEach(n => s += `- **${n.name}:** ${n.civilImpactOnMission}\n`);
  s += `\n## Information gaps\n\n`;
  state.nodes.filter(n => n.infoGaps).forEach(n => s += `- **${n.name}:** ${n.infoGaps}\n`);
  s += `\n## Risks\n\n`;
  state.nodes.filter(n => /High|Extreme/.test(n.risk)).forEach(n => s += `- ${n.name} — ${n.risk}\n`);
  s += `\n## Opportunities\n\n`;
  state.nodes.filter(n => n.opportunity === 'High').forEach(n => s += `- ${n.name}\n`);
  s += `\n## Recommended tasks\n\n`;
  generateFragoTasks().forEach(t => s += `- ${t}\n`);
  return s;
}
function mdKLE() {
  let s = mdHeader() + `# KLE / Engagement Tracker\n\n`;
  state.engagements.forEach(e => {
    const n = nodeById(e.nodeId);
    s += `## ${(e.date||'').slice(0,16).replace('T',' ')} — ${n?n.name:'?'}\n\n`;
    s += `- Method: ${e.method||''}\n- Team: ${e.team||''}\n- Location: ${e.location||''}\n`;
    s += `- Topics: ${e.topics||''}\n- Q: ${e.questions||''}\n- A: ${e.answers||''}\n`;
    s += `- Commitments (us): ${e.commitmentsUs||''}\n- Commitments (them): ${e.commitmentsThem||''}\n`;
    s += `- New contacts: ${e.newContacts||''}\n- Follow-up: ${e.followUp||''}\n`;
    s += `- Reliability: ${e.reliability||''} • Confidence: ${e.confidence||''}\n\n`;
  });
  if (!state.engagements.length) s += '_No engagements logged._\n';
  return s;
}
function mdCICM() {
  let s = mdHeader() + `# Civil Information Collection Matrix\n\n| Node | Information requirement | Gap | Source reliability | Confidence |\n|---|---|---|---|---|\n`;
  state.nodes.forEach(n => {
    s += `| ${n.name} | ${n.pirSupported||''} | ${n.infoGaps||''} | ${n.sourceReliability||''} | ${n.confidence||''} |\n`;
  });
  return s;
}
function mdAscopePmesii() {
  let s = mdHeader() + `# ASCOPE / PMESII-PT Summary\n\n`;
  s += `## ASCOPE\n\n`;
  ASCOPE_CATS.forEach(c => {
    const ns = state.nodes.filter(n => n.ascope === c);
    s += `### ${c}\n` + ns.map(n => `- ${n.name}: ${n.summary||''}`).join('\n') + '\n\n';
  });
  s += `## PMESII-PT\n\n`;
  PMESII_CATS.forEach(c => {
    const ns = state.nodes.filter(n => n.pmesii === c);
    s += `### ${c}\n` + ns.map(n => `- ${n.name}: ${n.summary||''}`).join('\n') + '\n\n';
  });
  return s;
}
function mdLoeAssessment() {
  let s = mdHeader() + `# LOE Assessment\n\n`;
  state.loes.forEach(l => {
    const nodes = state.nodes.filter(n => n.primaryLoeId === l.id);
    const engaged = nodes.filter(n => n.cndeStatus === 'Engaged').length;
    s += `## ${l.name}\n\n${l.description||''}\n\n`;
    s += `- End state: ${l.endState||'—'}\n- MOP: ${l.mop||'—'}\n- MOE: ${l.moe||'—'}\n`;
    s += `- Nodes: ${nodes.length} • Engaged: ${engaged}\n\n`;
  });
  return s;
}
function mdFrago() {
  return mdHeader() + `# Recommended FRAGO Tasks\n\n` +
    generateFragoTasks().map(t => `- ${t}`).join('\n') + '\n';
}
function mdCommander() {
  let s = mdHeader() + `# Commander Update Summary\n\n`;
  s += `## What changed\n\n- Nodes: ${state.nodes.length} • Connections: ${state.connections.length} • Engagements: ${state.engagements.length}\n\n`;
  s += `## What matters\n\n`;
  generateInsights().slice(0,6).forEach(i => s += `- **${i.title}:** ${stripHtml(i.body)}\n`);
  s += `\n## Recommended decisions\n\n`;
  generateDevRecommendations().forEach(r => s += `- **${r.title}:** ${r.body}\n`);
  return s;
}
function mdGaps() {
  let s = mdHeader() + `# Information Gaps\n\n`;
  state.nodes.filter(n => n.infoGaps).forEach(n =>
    s += `- **${n.name}** (Reliability ${n.sourceReliability}, Confidence ${n.confidence}): ${n.infoGaps}\n`);
  if (!state.nodes.some(n => n.infoGaps)) s += '_No open gaps recorded._\n';
  return s;
}
function mdVulnCap() {
  let s = mdHeader() + `# Civil Vulnerabilities and Capabilities\n\n## Vulnerabilities\n\n`;
  state.nodes.filter(n => n.civilVulnerability).forEach(n => s += `- **${n.name}:** ${n.civilVulnerability}\n`);
  s += `\n## Capabilities\n\n`;
  state.nodes.filter(n => n.civilCapability).forEach(n => s += `- **${n.name}:** ${n.civilCapability}\n`);
  return s;
}
function htmlReport() {
  // Very simple printable HTML
  const md = mdCnep();
  return `<!doctype html><html><head><meta charset="utf-8"><title>CIVNET Plan</title>
    <style>body{font-family:system-ui,sans-serif;max-width:820px;margin:30px auto;padding:0 16px;line-height:1.45;color:#222}
    h1,h2,h3{border-bottom:1px solid #ddd;padding-bottom:4px} blockquote{background:#fff3cd;border-left:4px solid #b76e00;padding:6px 10px} code{background:#f3f3f3;padding:1px 4px;border-radius:3px}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(md)}</pre></body></html>`;
}
function stripHtml(s) { return String(s||'').replace(/<[^>]+>/g, ''); }
function escapeHtml(s) {
  return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

/* ----------------------- Modal & Toast ------------------------------ */

let modalConfirmCb = null;
let modalCancelCb  = null;

function openModal(opts) {
  document.getElementById('modal-title').textContent = opts.title || 'Confirm';
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  if (typeof opts.body === 'string') body.innerHTML = opts.body;
  else if (opts.body) body.appendChild(opts.body);
  modalConfirmCb = opts.onConfirm || null;
  modalCancelCb  = opts.onCancel  || null;
  document.getElementById('modal-confirm').textContent = opts.confirmLabel || 'OK';
  document.getElementById('modal-cancel').style.display = opts.hideCancel ? 'none' : '';
  document.getElementById('modal-root').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-root').classList.add('hidden');
  modalConfirmCb = modalCancelCb = null;
}
function confirmModal(message, onYes) {
  openModal({ title: 'Confirm', body: `<p>${escapeHtml(message)}</p>`,
              confirmLabel: 'Confirm', onConfirm: onYes });
}

function toast(msg, kind) {
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind||'');
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ----------------------- Sample Data -------------------------------- */

function loadSample() {
  state = blankProject();
  ensureDefaultLOEs();
  state.projectMetadata.name = 'CIVNET Training Project';
  state.projectMetadata.ao = 'Notional Town AO';
  state.projectMetadata.unit = 'CA Team';
  state.projectMetadata.operator = 'TRAINING';
  state.projectMetadata.defaultLat = 38.9072;
  state.projectMetadata.defaultLng = -77.0369;
  state.projectMetadata.defaultZoom = 13;

  const loeByName = {};
  state.loes.forEach(l => loeByName[l.name] = l.id);

  const places = [
    { name: "City Mayor's Office",        lat: 38.9100, lng: -77.0400, entity: 'Government office', loe:'Governance', role:'Decision-maker', cnde:'Engaged', inf:'High', acc:'Established' },
    { name: 'Local Police Headquarters',  lat: 38.9050, lng: -77.0500, entity: 'Security actor',    loe:'Civil Security', role:'Decision-maker', cnde:'Engaged', inf:'High', acc:'Established' },
    { name: 'Water Utility Office',       lat: 38.9000, lng: -77.0300, entity: 'Essential service provider', loe:'Essential Services', role:'Service provider', cnde:'Planned for Engagement', inf:'High', acc:'Limited' },
    { name: 'Hospital',                   lat: 38.9150, lng: -77.0350, entity: 'Medical actor',     loe:'Public Health', role:'Service provider', cnde:'Engaged', inf:'High', acc:'Established' },
    { name: 'Religious Leader',           lat: 38.9120, lng: -77.0250, entity: 'Religious organization', loe:'Information Environment', role:'Influencer', cnde:'Planned for Engagement', inf:'Critical', acc:'Limited' },
    { name: 'Market Association',         lat: 38.9080, lng: -77.0420, entity: 'Business/economic actor', loe:'Economic Stability', role:'Broker', cnde:'Identified', inf:'High', acc:'Established' },
    { name: 'Displaced Civilian Site',    lat: 38.9020, lng: -77.0200, entity: 'Displaced civilian site', loe:'Humanitarian Assistance', role:'Vulnerable population', cnde:'Selected for Development', inf:'Low', acc:'Limited' },
    { name: 'Local Radio Station',        lat: 38.9170, lng: -77.0450, entity: 'Media actor',       loe:'Information Environment', role:'Influencer', cnde:'Identified', inf:'High', acc:'Established' },
    { name: 'NGO Coordination Office',    lat: 38.9090, lng: -77.0280, entity: 'NGO',               loe:'Humanitarian Assistance', role:'Service provider', cnde:'Being Developed', inf:'Medium', acc:'Trusted' },
    { name: 'School District Office',     lat: 38.9130, lng: -77.0480, entity: 'School / education actor', loe:'Essential Services', role:'Service provider', cnde:'Reassess Required', inf:'Medium', acc:'Established' },
  ];
  const idMap = {};
  places.forEach(p => {
    const n = newNode({
      name: p.name, locationName: p.name, lat: p.lat, lng: p.lng,
      entityType: p.entity, primaryLoeId: loeByName[p.loe] || '',
      networkRole: p.role, cndeStatus: p.cnde, influence: p.inf, access: p.acc,
      summary: 'Notional training example.',
      ascope: p.entity === 'Government office' ? 'Organization' :
              p.entity === 'Infrastructure site' ? 'Structure' :
              p.entity === 'Displaced civilian site' ? 'People' : 'Organization',
      pmesii: p.loe === 'Civil Security' ? 'Military' :
              p.loe === 'Public Health'  ? 'Social'   :
              p.loe === 'Essential Services' ? 'Infrastructure' :
              p.loe === 'Economic Stability' ? 'Economic' :
              p.loe === 'Information Environment' ? 'Information' : 'Social',
      priority: p.inf === 'Critical' ? 'High' : 'Medium',
      risk: p.role === 'Vulnerable population' ? 'High' : 'Low',
      opportunity: p.role === 'Broker' || p.role === 'Influencer' ? 'High' : 'Medium',
      infoGaps: p.name.includes('Religious') ? 'Attitude toward neighboring community unclear.' :
                p.name.includes('Water') ? 'Status of pumping station 2 unknown.' : ''
    });
    state.nodes.push(n);
    idMap[p.name] = n.id;
  });
  const conn = (from, to, type, strength, status) => state.connections.push(newConnection({
    sourceNodeId: idMap[from], targetNodeId: idMap[to],
    relationshipType: type, strength, status, confidence: 'Medium'
  }));
  conn("City Mayor's Office", 'Local Police Headquarters', 'Coordinates with', 'Strong', 'Confirmed');
  conn("City Mayor's Office", 'Water Utility Office', 'Coordinates with', 'Moderate', 'Confirmed');
  conn('Hospital', 'Water Utility Office', 'Depends on', 'Strong', 'Confirmed');
  conn('NGO Coordination Office', 'Displaced Civilian Site', 'Supports', 'Strong', 'Confirmed');
  conn('Religious Leader', 'Displaced Civilian Site', 'Influences', 'Moderate', 'Suspected');
  conn('Market Association', 'Religious Leader', 'Influences', 'Moderate', 'Suspected');
  conn('Local Radio Station', "City Mayor's Office", 'Shares information with', 'Moderate', 'Confirmed');
  conn('School District Office', 'Local Police Headquarters', 'Coordinates with', 'Weak', 'Needs validation');
  conn('Market Association', "City Mayor's Office", 'Coordinates with', 'Moderate', 'Confirmed');
  conn('NGO Coordination Office', 'Hospital', 'Coordinates with', 'Moderate', 'Confirmed');

  // Sample engagement
  state.engagements.push({
    id: uid('e'),
    date: new Date(Date.now()-86400000).toISOString().slice(0,16),
    team: 'CA Team',
    nodeId: idMap["City Mayor's Office"],
    method: 'KLE', location: "City Mayor's Office",
    topics: 'Local services, water reliability, market security.',
    questions: 'Status of pumping station 2? Concerns from market vendors?',
    answers: 'Pumping station 2 needs spare parts; market reports thefts at night.',
    commitmentsUs: 'Coordinate with utility office, share with police.',
    commitmentsThem: 'Provide list of vendors; introduce religious leader.',
    newContacts: 'Pumping station foreman',
    newLocations: 'Pumping station 2',
    newIssues: 'Spare parts shortage',
    followUp: 'Visit pumping station 2; pass info to S2/CMOC.',
    updatedAttitude: 'Supportive',
    updatedAccess: 'Established',
    updatedInfluence: 'High',
    reliability: 'High', confidence: 'Medium',
    notes: 'Notional training engagement.'
  });

  // Sample task
  state.tasks.push({
    id: uid('t'),
    title: 'Visit pumping station 2 and assess spare parts shortage',
    nodeId: idMap['Water Utility Office'],
    loeId: loeByName['Essential Services'],
    responsible: 'CA Team', dueDate: new Date(Date.now()+3*86400000).toISOString().slice(0,10),
    priority: 'High', status: 'Not started',
    purpose: 'Validate water service vulnerability and identify mitigations.',
    expectedOutput: 'Updated civil capability assessment for Water Utility Office.',
    notes: 'Coordinate with NGO Coordination Office.'
  });

  saveProject(true);
  refreshAll();
  toast('Sample training data loaded.', 'ok');
}

/* ----------------------- Refresh / Init ----------------------------- */

function refreshAll() {
  refreshLists();
  renderAllNodesOnMap();
  renderAllConnectionsOnMap();
  renderGraphView();
  renderCndePanels();
  renderDashboard();
  applySettingsToInputs();
}

function applySettingsToInputs() {
  const p = state.projectMetadata;
  setVal('set-project-name', p.name);
  setVal('set-ao', p.ao);
  setVal('set-ai', p.ai);
  setVal('set-unit', p.unit);
  setVal('set-operator', p.operator);
  setVal('set-higher-hq', p.higherHq);
  setVal('set-cdr-intent', p.cdrIntent);
  setVal('set-default-lat', p.defaultLat);
  setVal('set-default-lng', p.defaultLng);
  setVal('set-default-zoom', p.defaultZoom);
}
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v||''; }

function promptCreateNodeAt(lat, lng) {
  confirmModal('Drop a new civil network node at this location?', () => {
    const n = newNode({ lat, lng, name: 'New node' });
    state.nodes.push(n);
    renderAllNodesOnMap(); refreshLists();
    openDetail('node', n.id);
    saveProject(true);
  });
}

/* ----------------------- Wiring ------------------------------------- */

function wireUI() {
  // Top nav
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.onclick = () => setView(b.dataset.view);
  });
  // CNDE tabs
  document.querySelectorAll('.cnde-tab').forEach(b => {
    b.onclick = () => setCndeTab(b.dataset.cndeTab);
  });
  // Collapsible panels
  document.querySelectorAll('.collapse-btn').forEach(b => {
    b.onclick = () => {
      document.getElementById(b.dataset.target).classList.toggle('collapsed');
    };
  });
  // Theme toggle
  document.getElementById('btn-toggle-theme').onclick = () => {
    document.body.classList.toggle('theme-dark');
    document.body.classList.toggle('theme-light');
    state.settings.theme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    saveProject(true);
  };
  // Save / load
  document.getElementById('btn-save-project').onclick = () => saveProject();
  document.getElementById('btn-load-sample').onclick  = () =>
    confirmModal('Load sample training data? This will replace the current project.', loadSample);
  document.getElementById('btn-export-json').onclick  = exportJSON;
  document.getElementById('btn-import-json').onclick  = () => document.getElementById('import-file').click();
  document.getElementById('import-file').onchange = (e) => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  };
  document.getElementById('btn-clear-project').onclick = clearProject;
  document.getElementById('btn-clear-filters').onclick = clearFilters;

  // Create buttons
  document.getElementById('btn-new-node').onclick = () => {
    const lat = gmap ? gmap.getCenter().lat() : state.projectMetadata.defaultLat;
    const lng = gmap ? gmap.getCenter().lng() : state.projectMetadata.defaultLng;
    const n = newNode({ lat, lng });
    state.nodes.push(n);
    saveProject(true); refreshAll(); openDetail('node', n.id);
  };
  document.getElementById('btn-new-connection').onclick = () => {
    if (state.nodes.length < 2) { toast('Create two nodes first.', 'warn'); return; }
    const c = newConnection({ sourceNodeId: state.nodes[0].id, targetNodeId: state.nodes[1].id });
    state.connections.push(c);
    saveProject(true); refreshAll(); openDetail('connection', c.id);
  };
  document.getElementById('btn-new-loe').onclick = () => {
    const l = { id: uid('loe'), name: 'New LOE',
                color: DEFAULT_LOE_PALETTE[state.loes.length % DEFAULT_LOE_PALETTE.length],
                description:'', endState:'', higherObjective:'', tasks:[], mop:'', moe:'' };
    state.loes.push(l); saveProject(true); refreshAll(); openDetail('loe', l.id);
  };
  document.getElementById('btn-new-engagement').onclick = () => {
    const e = { id: uid('e'), date: new Date().toISOString().slice(0,16), team:'',
                nodeId: state.nodes[0] ? state.nodes[0].id : '', method:'KLE',
                location:'', topics:'', questions:'', answers:'',
                commitmentsUs:'', commitmentsThem:'', newContacts:'',
                newLocations:'', newIssues:'', followUp:'',
                updatedAttitude:'Unknown', updatedAccess:'Limited', updatedInfluence:'Medium',
                reliability:'Medium', confidence:'Medium', notes:'' };
    state.engagements.push(e); saveProject(true); refreshAll(); openDetail('engagement', e.id);
  };
  document.getElementById('btn-new-task').onclick = () => {
    const t = { id: uid('t'), title:'New task', nodeId:'', loeId:'', responsible:'',
                dueDate:'', priority:'Medium', status:'Not started',
                purpose:'', expectedOutput:'', notes:'' };
    state.tasks.push(t); saveProject(true); refreshAll(); openDetail('task', t.id);
  };

  // Overlay select
  document.getElementById('map-overlay-select').onchange = (e) => {
    state.settings.mapOverlay = e.target.value;
    saveProject(true); renderAllNodesOnMap();
  };

  // Modal
  document.getElementById('modal-close').onclick  = () => { if (modalCancelCb) modalCancelCb(); closeModal(); };
  document.getElementById('modal-cancel').onclick = () => { if (modalCancelCb) modalCancelCb(); closeModal(); };
  document.getElementById('modal-confirm').onclick = () => {
    const cb = modalConfirmCb; closeModal();
    if (cb) cb();
  };
  document.getElementById('modal-backdrop').onclick = () => { if (modalCancelCb) modalCancelCb(); closeModal(); };

  // Settings inputs
  const bindMeta = (id, key, isNumber) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = () => {
      state.projectMetadata[key] = isNumber ? parseFloat(el.value)||0 : el.value;
      saveProject(true);
    };
  };
  bindMeta('set-project-name', 'name');
  bindMeta('set-ao', 'ao');
  bindMeta('set-ai', 'ai');
  bindMeta('set-unit', 'unit');
  bindMeta('set-operator', 'operator');
  bindMeta('set-higher-hq', 'higherHq');
  bindMeta('set-cdr-intent', 'cdrIntent');
  bindMeta('set-default-lat', 'defaultLat', true);
  bindMeta('set-default-lng', 'defaultLng', true);
  bindMeta('set-default-zoom', 'defaultZoom', true);

  // Exports
  document.querySelectorAll('.export-card button').forEach(b => {
    b.onclick = () => exportThing(b.dataset.export);
  });

  // Map fallback timer: if google never loads, show fallback after 5s
  setTimeout(() => {
    if (!gmap) showMapFallback();
  }, 5000);
}

/* ----------------------- Boot --------------------------------------- */

function boot() {
  if (!loadProject()) {
    state = blankProject();
    ensureDefaultLOEs();
  } else {
    ensureDefaultLOEs(); // safety: ensure LOEs exist
  }
  // Apply theme
  if (state.settings && state.settings.theme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  }
  // Apply overlay
  const sel = document.getElementById('map-overlay-select');
  if (sel) sel.value = state.settings.mapOverlay || 'loe';

  wireUI();
  refreshAll();
}

document.addEventListener('DOMContentLoaded', boot);
