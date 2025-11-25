# Projektbeschreibung: Das Comenius-Orbital
**Status: ✅ MVP Implementiert**

## 🎯 Übersicht

Interaktive 3D-Visualisierung der Comenius-Institut Bildungslandschaft als explorative Browser-Anwendung. Projekte werden als **Ausstellungsstände** (Messestand-Stil) dargestellt, die jeweils zu externen Websites führen.

## 🚀 Quick Start

```bash
cd f:/code/svelte/ci-verse
npm run dev
```

Öffne: http://localhost:5173

## ✨ Implementierte Features

✅ **3D-Ausstellungsstände**: Moderne Messestände mit Paneelen und Holzrahmen  
✅ **Hover-Effekte**: Smooth Scale & Glow-Animationen  
✅ **Project Modal**: Glassmorphism-Card mit Related Projects  
✅ **Perspektiven-Filter**: 5 Leitperspektiven (Digitalität, Nachhaltigkeit, etc.)  
✅ **Hexagonale Anordnung**: Automatisches Ring-System nach Departments  
✅ **Camera Controls**: OrbitControls für Interaktion  
✅ **URL Deep-Linking**: `/?project=slug` & `/?view=perspective`  

## 📚 Dokumentation

- **[Architektur](./docs/architektur.md)**: Tech-Stack und Layer-Struktur
- **[Komponenten](./docs/components.md)**: Svelte-Komponenten Spezifikation
- **[Layout-Algorithmus](./src/lib/logic/layout.ts)**: Hexagonale Positionierung
- **[Store](./src/lib/logic/store.svelte.ts)**: Svelte 5 Runes State Management
- **[Walkthrough](C:\Users\Joachim\.gemini\antigravity\brain\131aa6bc-c15d-4bd0-bba8-bdd6c65ba601\walkthrough.md)**: Vollständige Feature-Dokumentation

## 🛠️ Tech-Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit (Svelte 5) |
| 3D Engine | Threlte 8 |
| Styling | TailwindCSS v4 |
| State | Svelte 5 Runes |
| Language | TypeScript |

## 📁 Projektstruktur

```
src/
├── lib/
│   ├── components/3d/    # 3D Threlte-Komponenten
│   ├── components/ui/    # HTML UI-Overlays
│   ├── logic/            # State & Layout-Algorithmus
│   ├── types/            # TypeScript Interfaces
│   └── data/             # Mock-Daten
└── routes/               # SvelteKit Routes
```

## 🎨 Design-Konzept

### Die 3 Ebenen

1. **Terra** (Boden): Bildungsangebote B1-B3 & Verwaltung S1-S3
2. **Orbit** (Schwebend): Querschnittsaufgaben Q1-Q3 (bei y=12m)
3. **Atmosphäre**: Leitperspektiven ändern Licht/Farbe/Nebel

### Ausstellungsstände

- **Basis**: 6×6m Plattform
- **Struktur**: 3 Paneele (Front + 2 Seiten)
- **Rahmen**: Holz-Streben (BoxGeometry)
- **Material**: MeshStandardMaterial mit dynamischem Emissive

## 🧪 Testing

Alle Core-Features getestet und funktional:
- ✅ Hover-Animationen
- ✅ Modal Interaction
- ✅ Filter-System
- ✅ Camera Controls
- ✅ Performance (60 FPS)

## 🔄 Nächste Schritte (Optional)

- [ ] WordPress GraphQL Integration (statt Mock-Daten)
- [ ] Website-Screenshots als Texturen
- [ ] DataStream-Animationen zwischen Q-Plattformen
- [ ] Bloom Post-Processing für Digitalität-Filter
- [ ] Live-Pulse (Nostr/RSS)

## 📝 Development Notes

**Mock-Daten**: `src/lib/data/mockProjects.ts`  
**Deployment**: Vercel-ready (SvelteKit adapter-auto)  
**Browser-Support**: Modern browsers mit WebGL 2.0  

---

**Letztes Update**: 2025-11-25  
**Version**: 1.0.0-MVP
