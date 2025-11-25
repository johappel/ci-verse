# Projektbeschreibung: Das Comenius-Orbital
**Interaktive 3D-Visualisierung der Bildungslandschaft**

## 1. Die Vision
Das Comenius-Institut ist ein komplexes Universum aus Projekten, die über verschiedenste externe Websites verstreut sind. Ziel dieses Projektes ist es, diese Fragmentierung aufzuheben und das Institut als **einen zusammenhängenden Organismus** erfahrbar zu machen.

Wir bauen keine klassische Website, sondern eine **explorative 3D-Welt**, die im Browser läuft. Sie dient als zentrales "Gateway" zu den vielen Satelliten-Angeboten.

## 2. Die Visuelle Metapher: Schwebende Plattformen

### Grundkonzept
Alle Bereiche des Instituts sind als **schwebende Plattformen** im Raum angeordnet. Es gibt keinen sichtbaren Boden - unter den Plattformen liegt ein mystischer Nebel, der den Fokus auf die interaktiven Elemente lenkt.

### Die 7 Plattformen

```
Seitenansicht (Y-Achse):
                                                    
Y=25    ·    ·    ·    ·    ·[Q2]·    ·    ·    ·   ← Europa (höchste)
                           ╱    ╲                   
Y=20    ·    ·[Q1]════════╬══════╬════════[Q3]·    ← Forschung & Digital
              ║           ║      ║         ║        
              ║      Lichtlinien-Transport ║        
              ║           ║      ║         ║        
Y=8    ·[B1]══╬═══════════[S]════╬═════════╬══[B3] ← Bildung + S (gleiche Höhe)
              ║           ║[B2]══╝         ║         
              ╚═══════════╬═══════════════╝         
                          ║                          
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~         ← Nebel-Grenze
Y=0    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Dichter Nebel
```

### A. S-Plattform (Marktplatz - Zentrum)
*   **Position:** Y=8, X=0, Z=0 (Zentrum)
*   **Größe:** Klein
*   **Funktion:** Startpunkt für alle Besucher, Verwaltungs-Hub
*   **Inhalt:**

| Element | Name | Funktion | Interaktion |
|---------|------|----------|-------------|
| S1 | Bibliothek | Dokumentation/Information | → Externe Webseite |
| S2_1 | ProjectChart | KI-Auskunft zu Projekten | → Chat-Modal öffnen |
| S2_2 | Backoffice | Verwaltung | Dekorativ (kein Link) |
| S2_3 | Finanzen | Buchhaltung | Dekorativ (kein Link) |

### B. B-Plattformen (Bildung - Mittlere Ebene)
Bildungsangebote nach Lebensphasen, alle auf Y=8:

| ID | Name | Position | Projekte |
|----|------|----------|----------|
| **B1** | Frühkindliche Bildung | X=-20, Z=0 | Kita-Projekte, Kindergottesdienst |
| **B2** | Schule & Jugend | X=0, Z=15 | Konfirmandenarbeit, Schulprojekte |
| **B3** | Erwachsenenbildung | X=20, Z=0 | Fortbildungen, Seniorenarbeit |

### C. Q-Plattformen (Querschnittsthemen - Obere Ebene)
Themen, die alle Bereiche betreffen, schweben höher:

| ID | Name | Y | Position | Projekte |
|----|------|---|----------|----------|
| **Q1** | Forschung | 20 | X=-15, Z=-10 | Studien, Publikationen |
| **Q2** | Europa | 25 | X=0, Z=-20 | EU-Projekte, Internationale Kooperation |
| **Q3** | Digitalisierung | 20 | X=15, Z=-10 | Digitale Tools, E-Learning |

### D. Lichtlinien-Transport
Leuchtende Verbindungslinien zwischen den Plattformen ermöglichen die Navigation:

*   **Visuelle Darstellung:** Sanft pulsierende Lichtlinien
*   **Interaktion:** 
    - Hover → Linie wird heller, Zielname erscheint
    - Klick → Kamera fliegt sanft entlang der Linie (2-3 Sekunden)
*   **Verbindungen:**
    - S ↔ B1, B2, B3 (warmweiß)
    - S ↔ Q1, Q2, Q3 (cyan/blau)
    - B1 ↔ B2 ↔ B3 ↔ B1 (Ring, gold)
    - Q1 ↔ Q2 ↔ Q3 ↔ Q1 (Ring, violett)

### E. Atmosphäre & Nebel
*   **Nebel:** Dichter Nebel unterhalb Y=5 versteckt den "Abgrund"
*   **Zweck:** Fokussiert den Blick auf die Plattformen
*   **Perspektiven-Farben:** Je nach Filter (Digitalität, Nachhaltigkeit, Gerechtigkeit) ändert sich die Atmosphäre-Farbe

---

## 3. Die "Comenius-Card" (Das Portal)

### Visueller Stil
Die Karte erscheint, wenn ein Projekt auf einer Plattform angeklickt wird. Der 3D-Hintergrund wird leicht unscharf (Blur-Effekt), um den Fokus auf die Karte zu lenken.

### Layout-Aufbau

1. **Header (Die Vorschau):** Großes Bild (Screenshot der Website). Darauf liegt das Logo des Projekts.
2. **Body (Der Kontext):**
    * Titel & Teaser-Text
    * Leitperspektiven-Tags (z.B. "Digitalität" - klickbar für Filter)
    * Mitarbeitende: Runde Avatare mit Namen/Funktion bei Hover
3. **Footer (Die Action):**
    * Primär: Großer Button "Zur Website reisen ➔"
    * Sekundär: "Verwandte Projekte" (Kleine Thumbnails)

---

## 4. Use Cases (Szenarien für die Abnahme)

### Szenario 1: "Die intuitive Suche" (Persona: Mutter/Gemeindepädagogin)
> *Eine Besucherin sucht Material für die Arbeit in der Kita, weiß aber nicht, wie die Abteilung heißt.*

1.  **Einstieg:** Die Besucherin landet auf der S-Plattform. Die Kamera zeigt die schwebende Welt.
2.  **Orientierung:** Sie sieht die Lichtlinien zu den anderen Plattformen. Eine führt zu "Frühkindliche Bildung" (B1).
3.  **Aktion:** Sie klickt auf die Lichtlinie zu B1.
4.  **Transport:** Die Kamera fliegt sanft entlang der Linie zur B1-Plattform.
5.  **Erkunden:** Auf der B1-Plattform sieht sie verschiedene Projekt-Stände in hexagonaler Anordnung.
6.  **Klick:** Sie klickt auf einen Stand. Die Comenius-Card öffnet sich.
7.  **Abschluss:** Sie klickt "Zur Website" und wird zur externen Projektseite weitergeleitet.

### Szenario 2: "Der thematische Deep-Dive" (Persona: Journalist/Fachpublikum)
> *Ein Journalist recherchiert, was die EKD zum Thema "Digitalisierung" macht.*

1.  **Einstieg:** Der Journalist sieht von S aus die Q3-Plattform (Digitalisierung) hoch oben leuchten.
2.  **Transport:** Er klickt auf die blaue Lichtlinie zu Q3.
3.  **Ankunft:** Die Kamera fliegt nach oben zur Q3-Plattform.
4.  **Überblick:** Auf Q3 sieht er alle Digital-Projekte als Messestände.
5.  **Erkenntnis:** Er kann sehen, welche Projekte hier angesiedelt sind.
6.  **Navigation:** Er kann über Lichtlinien zu Q1 (Forschung) oder Q2 (Europa) wechseln.

### Szenario 3: "Der Perspektivwechsel" (Persona: Strategische Leitung/Politik)
> *Jemand möchte wissen: Wo setzt ihr euch für "Nachhaltigkeit" ein?*

1.  **Aktion:** Der Nutzer wählt im UI-Menü den Filter "Nachhaltigkeit".
2.  **Reaktion:**
    *   Die Nebel-Farbe wechselt zu grün-getönt
    *   Projekte mit Nachhaltigkeits-Bezug leuchten auf
    *   Andere Projekte werden gedimmt
3.  **Ergebnis:** Das abstrakte Thema "Leitbild" wird visuell emotional erfahrbar.

### Szenario 4: "KI-Auskunft" (Persona: Neugieriger Besucher)
> *Jemand will schnell wissen, welche Projekte es zum Thema "Konfirmation" gibt.*

1.  **Aktion:** Auf der S-Plattform klickt der User auf "ProjectChart" (S2_1).
2.  **Reaktion:** Ein Chat-Modal öffnet sich.
3.  **Eingabe:** "Welche Projekte gibt es zur Konfirmandenarbeit?"
4.  **Antwort:** Die KI listet relevante Projekte mit direkten Links.
5.  **Navigation:** Der User kann aus dem Chat heraus direkt zu einer Plattform/Projekt navigieren.

---

## 5. Akzeptanzkriterien (Definition of Done)

*   **Performance:** Die Animation läuft auf einem durchschnittlichen Laptop flüssig (60 FPS). Auf Smartphones ist die Steuerung per Touch intuitiv möglich (Pinch to Zoom, Rotate).
*   **Navigation:** Der Nutzer kann über Lichtlinien zwischen allen Plattformen navigieren. Er landet nie in einer Sackgasse.
*   **Ästhetik:** Die schwebenden Plattformen sind klar erkennbar. Der Nebel fokussiert den Blick. Die Lichtlinien sind intuitiv als Transport-Möglichkeit erkennbar.
*   **Daten-Integrität:** Wenn im WordPress-Backend ein neues Projekt angelegt wird, erscheint es automatisch auf der entsprechenden Plattform.
*   **KI-Integration:** Der ProjectChart (S2_1) beantwortet Fragen zu Projekten korrekt.

