# CIVNET Planner: Civil Affairs Network Engagement Planner

An interactive web prototype to help a Civil Affairs Team understand, engage,
and influence the civil component of an operational environment. Built around
core Army Civil Affairs doctrine concepts (FM 3-57, ATP 3-57.30, ATP 3-57.50,
ATP 3-57.60, FM 5-0, ATP 2-01.3).

> **UNCLASSIFIED — TRAINING USE ONLY.**
> Do not enter classified information, CUI, protected personal information,
> intelligence source information, sensitive real-world operational details,
> or information that could endanger personnel or civilians. This is a
> prototype training tool. It is not authoritative and does not replace
> doctrine, command guidance, or trained planners.

---

## 1. What this prototype does

- Search for locations with Google Places Autocomplete and drop them as
  **civil network nodes** on a Google Map.
- Capture each node's doctrinal fields: ASCOPE, PMESII-PT, SWEAT-MS,
  civil vulnerabilities and capabilities, influence, access, attitude,
  network role, engagement priority, risk, and opportunity.
- Tag nodes with one or more **Lines of Effort (LOE)** and a **CNDE cycle
  status** (Unassessed → Identified → Planned → Engaged → Analyzed →
  Selected for Development → Being Developed → Integrated → Reassess).
- Connect nodes with typed civil network relationships and render them as
  styled lines on the map and as a simple network graph.
- Step the team through the six **CNDE cycle** stages: Plan, Engage,
  Analyze, Develop, Assess, Integrate.
- Generate insights (most connected actor, high-influence/low-access nodes,
  isolated nodes, info gaps, "Next Best Engagement," etc.).
- Export a **Civil Network Engagement Plan**, **CA Running Estimate**, KLE
  tracker, ASCOPE/PMESII summary, CSVs, and GeoJSON.

The first version is intentionally simple. Everything runs locally in the
browser with no backend, no login, and no external storage beyond the local
JSON files you choose to export.

---

## 2. Run it locally

### 2a. Get a Google Maps API key

1. Go to https://console.cloud.google.com/ and create or pick a project.
2. Enable the **Maps JavaScript API** and the **Places API**.
3. Create an API key.
4. (Recommended) Restrict the key to HTTP referrers like `http://localhost:*`
   and `http://127.0.0.1:*` while developing.

### 2b. Insert the key

Open `index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY` near the bottom:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMap&v=weekly" async defer></script>
```

The app still loads without a key — you can create nodes, edit fields, build
plans, and export — but the map and Places Autocomplete will not function.

### 2c. Serve the files

Most browsers won't load `localStorage`-using pages from `file://` reliably,
so serve the folder over HTTP. Any static server works:

```bash
# Python 3
cd civnet-planner
python3 -m http.server 8080

# or Node
npx serve .
```

Then open http://localhost:8080.

---

## 3. Save, export, import

- **Save**: click the *Save* button in the header, or any edit auto-saves.
  Data lives in `localStorage` under the key `civnet-planner.project.v1`.
- **Export Project JSON**: left panel → *Project* → *Export Project JSON*.
  Hand the file to a teammate or stash it in your project share drive.
- **Import Project JSON**: same panel → *Import Project JSON*. Replaces the
  current state.
- **Load Sample**: header → *Load Sample*. Loads a notional training town
  with ten nodes, ten connections, one engagement, and one task so the rest
  of the app is immediately useful.
- **Clear Project**: left panel → *Project* → *Clear Project*. Requires
  confirmation.

Additional exports (Markdown plans, CSVs, GeoJSON, printable HTML) live
under the *Exports* top-nav tab.

---

## 4. Layout

```
┌───────────────────────────────────────────────────────────────┐
│  UNCLASSIFIED / TRAINING USE ONLY warning banner              │
├───────────────────────────────────────────────────────────────┤
│  Header: CIVNET • [Map] [Network Graph] [CNDE] [Dashboard]    │
│          [Exports] [Settings]    Load Sample • Save • Theme   │
├─────────────┬──────────────────────────────┬──────────────────┤
│ LEFT PANEL  │      CENTER WORKSPACE        │   RIGHT PANEL    │
│             │                              │                  │
│ Search      │   Map / Graph / CNDE /       │  Detail / Edit   │
│ Create      │   Dashboard / Exports /      │  for the         │
│ Overlay     │   Settings (only one         │  selected node,  │
│ Filters     │   shown at a time)           │  connection,     │
│ Node list   │                              │  LOE, engagement │
│ LOE list    │                              │  or task.        │
│ Engagements │                              │                  │
│ Tasks       │                              │                  │
│ Project I/O │                              │                  │
└─────────────┴──────────────────────────────┴──────────────────┘
```

Side panels are collapsible via the `«` / `»` buttons.

---

## 5. Doctrinal field reference

The prototype uses field names drawn from Army Civil Affairs doctrine. Brief
plain-language definitions:

- **ASCOPE** (ATP 2-01.3) — civil considerations framework: **A**rea,
  **S**tructure, **C**apability, **O**rganization, **P**eople, **E**vent.
- **PMESII-PT** (ATP 2-01.3) — operational variables: Political, Military,
  Economic, Social, Information, Infrastructure, Physical Environment, Time.
- **SWEAT-MS** — essential services framework: Sewer, Water, Electricity,
  Academics, Trash, Medical, Safety.
- **LOE** (FM 5-0) — Line of Effort: a logical line linking multiple tasks
  and effects to a strategic or operational objective.
- **MOP** (FM 5-0) — Measure of Performance. "Are we doing things right?"
  Did the unit complete the task? (binary / count).
- **MOE** (FM 5-0) — Measure of Effectiveness. "Are we doing the right
  things?" Did conditions change in the operational environment?
- **Civil vulnerability** (FM 3-57) — a condition in the civil environment
  that could cause harm or instability.
- **Civil capability** (FM 3-57) — a civil resource or capacity that can
  support the mission.
- **Information gap** (ATP 3-57.50) — civil information that the staff
  needs but does not yet have.
- **CNDE** (ATP 3-57.30) — Civil Network Development and Engagement cycle:
  Plan → Conduct → Analyze → Develop → Assess → Integrate.
- **Influence** — degree to which an actor can shape outcomes in the civil
  environment (Low / Medium / High / Critical).
- **Access** — degree of relational reach the friendly force has with this
  actor or network (No access / Limited / Established / Trusted).
- **Source reliability** and **confidence** — independently rated;
  reliability is about the source, confidence is about the information.

Most fields show a small `?` tooltip with this same definition.

---

## 6. CNDE cycle workflow

The app surfaces the CNDE cycle as both:

1. A **Kanban board** with one column per cycle status — drag a node card
   between columns to update the node.
2. Six **CNDE tabs** (Plan, Engage, Analyze, Develop, Assess, Integrate)
   that prompt the user for the right kind of work at each stage and
   surface relevant nodes and outputs.

When you save an engagement record, the *Engage* tab also prompts you to
convert new contacts/locations into nodes and create follow-up tasks.

---

## 7. Exports

All exports are produced client-side and downloaded directly:

| Export                                | Format   |
|---------------------------------------|----------|
| Civil Network Engagement Plan         | Markdown |
| CA Running Estimate                   | Markdown |
| KLE / Engagement Tracker              | Markdown |
| Civil Information Collection Matrix   | Markdown |
| ASCOPE / PMESII-PT Summary            | Markdown |
| LOE Assessment                        | Markdown |
| Recommended FRAGO Tasks               | Markdown |
| Commander Update Summary              | Markdown |
| Information Gaps                      | Markdown |
| Vulnerabilities & Capabilities        | Markdown |
| Nodes / Connections / Engagements / Tasks | CSV  |
| GeoJSON                               | GeoJSON  |
| Printable HTML Report                 | HTML     |

Recommended task statements are generated in the format:

> *[Unit/team] conducts civil engagement with [node] NLT [date] to identify
> [civil requirement/vulnerability] in [AO], in order to support [LOE] and
> inform [commander decision/operation].*

---

## 8. Data model

All data lives in a single JS object persisted to `localStorage` and
serialized to JSON on export. Top-level keys:

- `projectMetadata` — project name, AO/AI, unit, operator, commander's
  intent (notional), map defaults.
- `nodes[]` — civil network nodes (see Node detail panel for the full set
  of fields).
- `connections[]` — `sourceNodeId`/`targetNodeId` plus relationship type,
  strength, direction, confidence, status, LOE, info requirement, risk,
  opportunity, CNDE status.
- `loes[]` — Lines of Effort with name, color, description, end state,
  higher HQ objective, MOP, MOE.
- `engagements[]` — engagement log entries tied to a node.
- `tasks[]` — task tracker entries tied to a node / LOE / engagement.
- `assessments[]` — placeholder for richer assessment records (TODO).
- `informationRequirements[]` — placeholder for a structured CICM (TODO).
- `settings{}` — theme, default overlay.

Every node, connection, LOE, engagement, and task has a unique ID prefixed
by its kind (`n-…`, `c-…`, `loe-…`, `e-…`, `t-…`).

---

## 9. Known limitations

- **Google Maps key required** for the map and Places Autocomplete. Without
  one, you'll see a fallback panel and lose those features only.
- **Network graph view** uses a simple SVG circle layout. For richer
  interaction (drag, zoom, force-directed layout) swap in Cytoscape.js or
  vis-network — there is a TODO comment at the top of `renderGraphView()`.
- **Insights and "Next Best Engagement"** use simple heuristic scoring.
  They are useful for prompting human judgement, not for replacing it.
- **Assessments** are summarized but the structured assessment editor is
  basic. Trend / baseline / current condition fields can be expanded.
- **No backend, no auth, no sync.** Data stays in your browser unless you
  export it. Two operators cannot collaborate in real time.
- **Map markers** are SVG pins; the *engagement box* concept is
  approximated by labeling.  An anchored-box renderer is a future
  improvement.
- **Connection arrows** for directionality are not drawn yet (planned).
- **No printing optimization** beyond the HTML report.
- **Drag-and-drop on Kanban** works inside one view but is not yet wired
  to virtual lists or filters.
- **All free-text fields are user-trusted.** Do not paste sensitive data —
  see the warning banner.

---

## 10. Future improvements (TODOs in code)

- Replace SVG graph with Cytoscape.js / vis-network for force-directed
  layout, clustering, and centrality.
- Add proper trend tracking with timestamps for influence / access /
  attitude per engagement.
- Tooltip popovers for ASCOPE/PMESII/SWEAT-MS already exist; expand to a
  "doctrine help" pane.
- Add bulk edit (multi-select on the Kanban board / node list).
- Add full directional / arrow rendering on map polylines.
- Add a structured **Civil Information Collection Matrix** editor (right
  now it is built from node fields at export time).
- Add **assessments** as first-class items so MOP/MOE roll-up has history.
- Add **commander decision points** and a recommended decisions queue.
- Add an optional **dark map style** when the dark theme is on.
- Add a custom **engagement box** marker overlay (rectangular labeled
  boxes anchored to the map at zoom > 14).
- Add **import** of CSV (currently only export).
- Add a **share via JSON URL** option for training environments.

---

## 11. Doctrinal usefulness

This tool is built to help the team answer:

- Who matters in the civil environment?
- Where are they?
- What do they influence?
- Who do they connect to?
- What civil vulnerabilities exist?
- What civil capabilities exist?
- What information gaps remain?
- What engagement should happen next, and why?
- What LOE does each engagement support?
- What effect is the engagement trying to create?
- How will the team measure progress (MOP / MOE)?
- How does any of this turn into a staff product or commander decision?

If a field in the app does not help answer one of those questions, it's
in the wrong place — open an issue and we'll move it.

---

## 12. Files

- `index.html` — single-page shell (layout, banner, panels, modal, toasts).
- `styles.css` — dark professional theme by default, light mode optional.
- `app.js` — application logic, data model, map rendering, CNDE cycle,
  insights, exports, persistence. Vanilla JS, no build step.
- `README.md` — this file.

---

## 13. License & disclaimer

Training prototype. Provided as-is, without warranty of any kind. Doctrinal
field names are drawn from publicly available U.S. Army doctrine references;
they are summarized for staff use and are not authoritative. Always consult
the actual doctrine and your chain of command for real planning.
