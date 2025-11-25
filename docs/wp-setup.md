# WordPress Setup Definition

Wir nutzen **WPGraphQL**, da wir komplexe, verschachtelte Relationen (Projekt -> hat Mitarbeiter -> hat Bild) effizienter in einem Request abfragen können als mit REST.

## 1. Custom Post Types (CPT)

### `ci_project` (Projekte/Angebote)
- **Supports:** Title, Editor (Beschreibung), Thumbnail (Logo/Keyvisual).
- **Taxonomies:** `ci_department`, `ci_perspective`, `ci_target_group`.

### `ci_staff` (Mitarbeitende)
- **Supports:** Title (Name), Thumbnail (Foto).
- **ACF:** Position, Email.

## 2. Taxonomies (Hierarchisch)

### `ci_department` (Arbeitsbereiche)
Struktur für die Filterung und Positionierung:
- **B-Ebene** (Parent): B1, B2, B3 (für Ring-Positionierung).
- **Q-Ebene** (Parent): Q1, Q2, Q3 (für Orbit-Zuordnung).
- **S-Ebene** (Parent): S1, S2, S3 (für Zentrum).

### `ci_perspective` (Leitperspektiven)
- Tags: "Digitalität", "Nachhaltigkeit", "Gerechtigkeit", "Strukturwandel".

### `ci_target_group` (Zielgruppen)
- Tags: "0-3", "4-6", "Schule", "Erwachsene", "Senioren".

## 3. ACF Fields (Advanced Custom Fields)

### Field Group: Projekt Details (Location: Post Type = ci_project)
| Name | Typ | Beschreibung |
|------|-----|--------------|
| `external_url` | URL | Link zur Satelliten-Website |
| `related_staff` | Relationship | Verknüpfung zu `ci_staff` |
| `color_override`| Color Picker | (Optional) Falls Projekt eigene Farbe braucht |
| `nostr_pubkey` | Text | (Optional) Für Live-Pulse Integration |
| `website_screenshot` | Image | Manuell hochgeladen oder via Plugin generiert. Zeigt den Look der Zielseite. |
| `preview_video` | File (mp4) | (Optional) Kurzer Loop, falls vorhanden. |
| `short_teaser` | Text Area | Max 150 Zeichen für die Karte (nicht der lange Text). |

## 4. GraphQL Query Beispiel

```graphql
query GetWorldData {
  ciProjects(first: 100) {
    nodes {
      id
      title
      slug
      projectDetails {
        externalUrl
      }
      ciDepartments {
        nodes {
          name
          slug
          parent { node { slug } } # Um B/Q/S zu unterscheiden
        }
      }
      ciPerspectives {
        nodes {
          slug
        }
      }
      ciTargetGroups {
        nodes {
          name
        }
      }
      featuredImage {
        node {
          sourceUrl
        }
      }
    }
  }
}
```