# UI Component: Comenius-Card

## Verhalten
- **Trigger:** Klick auf ein Gebäude (`worldStore.selectProject(id)`).
- **Animation:** Die Karte "entfaltet" sich aus der Mitte oder gleitet von der Seite herein (Glassmorphism Stil).
- **Navigation:** Klick außerhalb schließt die Karte (zurück zur Übersicht).

## Sektion: "Ähnliche Projekte" (Logik)
Algorithmus zur Ermittlung der 3 Vorschläge unten in der Karte:
1. Gleiche Abteilung (Priorität 1).
2. Gleiche Zielgruppe (Priorität 2).
3. Gleiche Leitperspektive (Priorität 3).
-> Zeige die Top 3 Matches als kleine klickbare Kacheln.