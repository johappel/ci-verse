<?php
/**
 * ACF Field Groups Export für CI-Verse
 * 
 * Importieren über: ACF > Tools > Import
 * Oder via PHP: include this file
 */

if (!defined('ABSPATH')) exit;

add_action('acf/init', 'civerse_register_acf_fields');

function civerse_register_acf_fields() {
    if (!function_exists('acf_add_local_field_group')) return;

    // =========================================================================
    // PLATTFORM FELDER
    // =========================================================================
    
    acf_add_local_field_group([
        'key' => 'group_platform',
        'title' => 'Plattform Einstellungen',
        'fields' => [
            [
                'key' => 'field_platform_id',
                'label' => 'Plattform ID',
                'name' => 'platform_id',
                'type' => 'select',
                'required' => 1,
                'choices' => [
                    'B1' => 'B1 - Frühkindliche Bildung',
                    'B2' => 'B2 - Schule & Jugend',
                    'B3' => 'B3 - Erwachsenenbildung',
                    'Q1' => 'Q1 - Forschung',
                    'Q2' => 'Q2 - Europa & Internationales',
                    'Q3' => 'Q3 - Digitalisierung',
                ],
            ],
            [
                'key' => 'field_platform_title',
                'label' => 'Voller Titel',
                'name' => 'platform_title',
                'type' => 'text',
                'required' => 1,
                'placeholder' => 'z.B. Frühkindliche Bildung',
            ],
            [
                'key' => 'field_platform_short',
                'label' => 'Kurzname (für Buttons)',
                'name' => 'platform_short',
                'type' => 'text',
                'required' => 1,
                'placeholder' => 'z.B. Kita',
                'maxlength' => 15,
            ],
            [
                'key' => 'field_platform_description',
                'label' => 'Beschreibung',
                'name' => 'platform_description',
                'type' => 'textarea',
                'rows' => 2,
            ],
            [
                'key' => 'field_platform_color',
                'label' => 'Primärfarbe',
                'name' => 'platform_color',
                'type' => 'color_picker',
                'required' => 1,
                'default_value' => '#64748b',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key' => 'field_platform_glow_color',
                'label' => 'Leuchtfarbe (Glow)',
                'name' => 'platform_glow_color',
                'type' => 'color_picker',
                'required' => 1,
                'default_value' => '#94a3b8',
                'instructions' => 'Hellere Variante der Primärfarbe für Glow-Effekte',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key' => 'field_platform_aspects',
                'label' => 'Thematische Aspekte',
                'name' => 'platform_aspects',
                'type' => 'repeater',
                'max' => 5,
                'layout' => 'block',
                'button_label' => 'Aspekt hinzufügen',
                'sub_fields' => [
                    [
                        'key' => 'field_aspect_title',
                        'label' => 'Titel',
                        'name' => 'title',
                        'type' => 'text',
                        'required' => 1,
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_aspect_icon',
                        'label' => 'Icon (Emoji)',
                        'name' => 'icon',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => '🙏',
                        'wrapper' => ['width' => '15'],
                    ],
                    [
                        'key' => 'field_aspect_description',
                        'label' => 'Beschreibung',
                        'name' => 'description',
                        'type' => 'text',
                        'wrapper' => ['width' => '45'],
                    ],
                    [
                        'key' => 'field_aspect_content_url',
                        'label' => 'Content URL',
                        'name' => 'content_url',
                        'type' => 'url',
                    ],
                ],
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'civerse_platform'],
            ],
        ],
    ]);

    // =========================================================================
    // PROJEKT FELDER
    // =========================================================================
    
    acf_add_local_field_group([
        'key' => 'group_project',
        'title' => 'Projekt Einstellungen',
        'fields' => [
            // Tab: Basis
            [
                'key' => 'field_project_tab_basis',
                'label' => 'Basis',
                'type' => 'tab',
            ],
            [
                'key' => 'field_project_id',
                'label' => 'Projekt ID',
                'name' => 'project_id',
                'type' => 'text',
                'required' => 1,
                'placeholder' => 'p1, p2, ...',
                'instructions' => 'Eindeutige ID (z.B. p1, p2, ...)',
                'wrapper' => ['width' => '20'],
            ],
            [
                'key' => 'field_project_external_url',
                'label' => 'Externe URL',
                'name' => 'project_external_url',
                'type' => 'url',
                'required' => 1,
                'wrapper' => ['width' => '80'],
            ],
            [
                'key' => 'field_project_teaser',
                'label' => 'Kurzbeschreibung',
                'name' => 'project_teaser',
                'type' => 'textarea',
                'rows' => 2,
                'maxlength' => 270,
            ],
            
            // Tab: Zuordnung
            [
                'key' => 'field_project_tab_zuordnung',
                'label' => 'Zuordnung',
                'type' => 'tab',
            ],
            [
                'key' => 'field_project_departments',
                'label' => 'Plattformen (Departments)',
                'name' => 'project_departments',
                'type' => 'checkbox',
                'choices' => [
                    'B1' => 'B1 - Kita',
                    'B2' => 'B2 - Schule',
                    'B3' => 'B3 - Erwachsene',
                    'Q1' => 'Q1 - Forschung',
                    'Q2' => 'Q2 - Europa',
                    'Q3' => 'Q3 - Digital',
                ],
                'layout' => 'horizontal',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key' => 'field_project_related_departments',
                'label' => 'Wegweiser-Plattformen',
                'name' => 'project_related_departments',
                'type' => 'checkbox',
                'choices' => [
                    'B1' => 'B1 - Kita',
                    'B2' => 'B2 - Schule',
                    'B3' => 'B3 - Erwachsene',
                    'Q1' => 'Q1 - Forschung',
                    'Q2' => 'Q2 - Europa',
                    'Q3' => 'Q3 - Digital',
                ],
                'layout' => 'horizontal',
                'wrapper' => ['width' => '50'],
                'instructions' => 'Plattformen, auf denen ein Wegweiser zu diesem Projekt erscheint (ohne eigenen Stand).',
            ],
            [
                'key' => 'field_project_perspectives',
                'label' => 'Leitlinien (Perspektiven)',
                'name' => 'project_perspectives',
                'type' => 'checkbox',
                'choices' => [
                    'education' => '📖 Religiöse Bildung',
                    'justice' => '⚖️ Bildungsgerechtigkeit',
                    'sustainability' => '🌱 Nachhaltigkeit',
                    'diversity' => '🌈 Differenzsensibilität',
                    'digitality' => '💻 Digitalität',
                    'structure' => '🏗️ Strukturveränderungen',
                ],
                'layout' => 'horizontal',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key' => 'field_project_target_groups',
                'label' => 'Zielgruppen',
                'name' => 'project_target_groups',
                'type' => 'checkbox',
                'choices' => [
                    '0-3' => '0-3 Jahre',
                    '4-6' => '4-6 Jahre',
                    '7-10' => '7-10 Jahre',
                    '11-14' => '11-14 Jahre',
                    '15-18' => '15-18 Jahre',
                    'young-adults' => 'Junge Erwachsene',
                    'adults' => 'Erwachsene',
                    'seniors' => 'Senioren',
                    'employees' => 'Fachkräfte',
                    'volunteers' => 'Ehrenamtliche',
                ],
                'layout' => 'horizontal',
            ],
            [
                'key' => 'field_project_display_type',
                'label' => 'Anzeigetyp',
                'name' => 'project_display_type',
                'type' => 'radio',
                'choices' => [
                    'booth' => '🏪 Booth (Freistehender Messestand)',
                    'wall' => '🖼️ Wall (Poster an der Wand)',
                    'both' => '✨ Both (Beides)',
                ],
                'layout' => 'horizontal',
                'default_value' => 'booth',
                'instructions' => 'Legt fest, wie das Projekt auf der Plattform angezeigt wird.',
            ],
            [
                'key' => 'field_project_staff',
                'label' => 'Zuständige Mitarbeiter',
                'name' => 'project_staff',
                'type' => 'relationship',
                'post_type' => ['civerse_staff'],
                'filters' => ['search'],
                'return_format' => 'object',
            ],
            
            // Tab: Display
            [
                'key' => 'field_project_tab_display',
                'label' => 'Darstellung',
                'type' => 'tab',
            ],
            [
                'key' => 'field_project_slogan',
                'label' => 'Slogan',
                'name' => 'project_slogan',
                'type' => 'text',
                'placeholder' => 'Kurzer, prägnanter Slogan',
            ],
            [
                'key' => 'field_project_color',
                'label' => 'Primärfarbe',
                'name' => 'project_color',
                'type' => 'color_picker',
                'default_value' => '#3b82f6',
            ],
            [
                'key' => 'field_project_poster_image',
                'label' => 'Poster-Bild',
                'name' => 'project_poster_image',
                'type' => 'image',
                'return_format' => 'array',
                'preview_size' => 'medium',
                'instructions' => 'Empfohlen: 800×1200px (Portrait)',
            ],
            [
                'key' => 'field_project_poster_image_format',
                'label' => 'Poster-Bildformat',
                'name' => 'project_poster_image_format',
                'type' => 'select',
                'choices' => [
                    'portrait' => '📐 Portrait (800×1200px)',
                    'landscape' => '🖼️ Landscape (1200×800px)',
                    'square' => '⬜ Quadratisch (1000×1000px)',
                ],
                'default_value' => 'portrait',
                'instructions' => 'Format des Poster-Bildes für optimale Darstellung.',
            ],
            [
                'key' => 'field_project_screenshot',
                'label' => 'Website Screenshot',
                'name' => 'project_screenshot',
                'type' => 'image',
                'return_format' => 'array',
                'preview_size' => 'medium',
                'instructions' => 'Screenshot der Projekt-Website (800×600px)',
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'civerse_project'],
            ],
        ],
    ]);

    // =========================================================================
    // PERSONAL FELDER
    // =========================================================================
    
    acf_add_local_field_group([
        'key' => 'group_staff',
        'title' => 'Mitarbeiter Einstellungen',
        'fields' => [
            [
                'key' => 'field_staff_id',
                'label' => 'Mitarbeiter ID',
                'name' => 'staff_id',
                'type' => 'text',
                'required' => 1,
                'placeholder' => 'm1, m2, ...',
                'wrapper' => ['width' => '30'],
            ],
            [
                'key' => 'field_staff_role',
                'label' => 'Rolle / Position',
                'name' => 'staff_role',
                'type' => 'text',
                'placeholder' => 'z.B. Wissenschaftliche Leitung',
                'wrapper' => ['width' => '70'],
            ],
            [
                'key' => 'field_staff_email',
                'label' => 'E-Mail',
                'name' => 'staff_email',
                'type' => 'email',
            ],
        ],
        'location' => [
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'civerse_staff'],
            ],
        ],
    ]);

    // =========================================================================
    // MARKTPLATZ FELDER (Options Page)
    // =========================================================================
    
    acf_add_local_field_group([
        'key' => 'group_marketplace',
        'title' => 'Marktplatz (S-Plattform)',
        'fields' => [
            // Tab: Allgemein
            [
                'key' => 'field_marketplace_tab_general',
                'label' => 'Allgemein',
                'type' => 'tab',
            ],
            [
                'key' => 'field_marketplace_title',
                'label' => 'Titel',
                'name' => 'marketplace_title',
                'type' => 'text',
                'required' => 1,
                'default_value' => 'Marktplatz',
                'wrapper' => ['width' => '40'],
            ],
            [
                'key' => 'field_marketplace_short',
                'label' => 'Kurzname',
                'name' => 'marketplace_short',
                'type' => 'text',
                'required' => 1,
                'default_value' => 'Marktplatz',
                'wrapper' => ['width' => '30'],
            ],
            [
                'key' => 'field_marketplace_description',
                'label' => 'Beschreibung',
                'name' => 'marketplace_description',
                'type' => 'textarea',
                'rows' => 2,
                'default_value' => 'Bildungsmarktplatz des Comenius-Instituts.',
            ],
            [
                'key' => 'field_marketplace_color',
                'label' => 'Primärfarbe',
                'name' => 'marketplace_color',
                'type' => 'color_picker',
                'required' => 1,
                'default_value' => '#64748b',
                'wrapper' => ['width' => '50'],
            ],
            [
                'key' => 'field_marketplace_glow_color',
                'label' => 'Leuchtfarbe (Glow)',
                'name' => 'marketplace_glow_color',
                'type' => 'color_picker',
                'required' => 1,
                'default_value' => '#94a3b8',
                'wrapper' => ['width' => '50'],
            ],
            // Tab: Stände
            [
                'key' => 'field_marketplace_tab_stands',
                'label' => 'Stände',
                'type' => 'tab',
            ],
            [
                'key' => 'field_marketplace_stands',
                'label' => 'Marktplatz-Stände',
                'name' => 'marketplace_stands',
                'type' => 'repeater',
                'layout' => 'block',
                'button_label' => 'Stand hinzufügen',
                'sub_fields' => [
                    [
                        'key' => 'field_stand_title',
                        'label' => 'Titel',
                        'name' => 'title',
                        'type' => 'text',
                        'required' => 1,
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_stand_type',
                        'label' => 'Typ',
                        'name' => 'type',
                        'type' => 'select',
                        'choices' => [
                            'institution' => '🏛️ Institution (mit KI-Chat)',
                            'publications' => '📚 Publikationen (RSS)',
                            'events' => '📅 Veranstaltungen (iCal)',
                            'info' => 'ℹ️ Info-Stand',
                        ],
                        'wrapper' => ['width' => '35'],
                    ],
                    [
                        'key' => 'field_stand_icon',
                        'label' => 'Icon',
                        'name' => 'icon',
                        'type' => 'text',
                        'placeholder' => '🏛️',
                        'wrapper' => ['width' => '10'],
                    ],
                    [
                        'key' => 'field_stand_color',
                        'label' => 'Farbe',
                        'name' => 'color',
                        'type' => 'color_picker',
                        'wrapper' => ['width' => '15'],
                    ],
                    [
                        'key' => 'field_stand_description',
                        'label' => 'Beschreibung',
                        'name' => 'description',
                        'type' => 'textarea',
                        'rows' => 2,
                    ],
                    [
                        'key' => 'field_stand_logo',
                        'label' => 'Logo',
                        'name' => 'logo',
                        'type' => 'image',
                        'return_format' => 'array',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key' => 'field_stand_banner',
                        'label' => 'Banner (1200×400)',
                        'name' => 'banner',
                        'type' => 'image',
                        'return_format' => 'array',
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key' => 'field_stand_external_url',
                        'label' => 'Externe URL',
                        'name' => 'external_url',
                        'type' => 'url',
                    ],
                    [
                        'key' => 'field_stand_chat_webhook',
                        'label' => 'Chat Webhook (n8n)',
                        'name' => 'chat_webhook',
                        'type' => 'url',
                        'instructions' => 'Nur bei Typ "Institution"',
                        'conditional_logic' => [
                            [['field' => 'field_stand_type', 'operator' => '==', 'value' => 'institution']],
                        ],
                    ],
                    [
                        'key' => 'field_stand_rss_feeds',
                        'label' => 'RSS Feed URLs',
                        'name' => 'rss_feeds',
                        'type' => 'repeater',
                        'layout' => 'table',
                        'button_label' => 'Feed hinzufügen',
                        'sub_fields' => [
                            ['key' => 'field_rss_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                        ],
                        'conditional_logic' => [
                            [['field' => 'field_stand_type', 'operator' => '==', 'value' => 'publications']],
                        ],
                    ],
                    [
                        'key' => 'field_stand_calendar_url',
                        'label' => 'Kalender URL (iCal)',
                        'name' => 'calendar_url',
                        'type' => 'url',
                        'conditional_logic' => [
                            [['field' => 'field_stand_type', 'operator' => '==', 'value' => 'events']],
                        ],
                    ],
                ],
            ],
            
            // Tab: Leitlinien-Poster
            [
                'key' => 'field_marketplace_tab_posters',
                'label' => 'Leitlinien-Poster',
                'type' => 'tab',
            ],
            [
                'key' => 'field_marketplace_wall_posters',
                'label' => 'Wandposter (Leitlinien)',
                'name' => 'marketplace_wall_posters',
                'type' => 'repeater',
                'max' => 6,
                'layout' => 'block',
                'button_label' => 'Poster hinzufügen',
                'sub_fields' => [
                    [
                        'key' => 'field_poster_title',
                        'label' => 'Titel',
                        'name' => 'title',
                        'type' => 'text',
                        'required' => 1,
                        'wrapper' => ['width' => '30'],
                    ],
                    [
                        'key' => 'field_poster_perspective',
                        'label' => 'Leitlinie',
                        'name' => 'perspective',
                        'type' => 'select',
                        'choices' => [
                            'education' => '📖 Religiöse Bildung',
                            'justice' => '⚖️ Bildungsgerechtigkeit',
                            'sustainability' => '🌱 Nachhaltigkeit',
                            'diversity' => '🌈 Differenzsensibilität',
                            'digitality' => '💻 Digitalität',
                            'structure' => '🏗️ Strukturveränderungen',
                        ],
                        'wrapper' => ['width' => '30'],
                    ],
                    [
                        'key' => 'field_poster_image',
                        'label' => 'Bild (800×1200)',
                        'name' => 'image',
                        'type' => 'image',
                        'return_format' => 'array',
                        'wrapper' => ['width' => '40'],
                    ],
                ],
            ],
            [
                'key' => 'field_marketplace_tab_partners',
                'label' => 'Partner-Netzwerk',
                'type' => 'tab',
            ],
            [
                'key' => 'field_partners_info',
                'label' => 'Partner-Netzwerk',
                'type' => 'message',
                'message' => 'Partner-Einrichtungen erscheinen im Nexus Terminal auf dem Marktplatz als animierter "Fahrplan" mit Verbindungen zu anderen Institutionen.',
            ],
            [
                'key' => 'field_partner_connections',
                'label' => 'Partner-Verbindungen',
                'name' => 'partner_connections',
                'type' => 'repeater',
                'layout' => 'block',
                'button_label' => 'Partner hinzufügen',
                'sub_fields' => [
                    [
                        'key' => 'field_partner_id',
                        'label' => 'Partner ID',
                        'name' => 'id',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. ekd, bmbf, eu',
                        'wrapper' => ['width' => '20'],
                    ],
                    [
                        'key' => 'field_partner_name',
                        'label' => 'Vollständiger Name',
                        'name' => 'name',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. Evangelische Kirche in Deutschland',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_partner_short_name',
                        'label' => 'Kurzname (für Anzeige)',
                        'name' => 'shortName',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. EKD Hannover',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_partner_category',
                        'label' => 'Kategorie',
                        'name' => 'category',
                        'type' => 'select',
                        'choices' => [
                            'ministry' => '🏛️ Ministerium',
                            'church' => '⛪ Kirchliche Einrichtung',
                            'university' => '🎓 Universität',
                            'institute' => '🔬 Institut',
                            'international' => '🌍 International',
                            'association' => '🤝 Verband/Gesellschaft',
                        ],
                        'wrapper' => ['width' => '30'],
                    ],
                    [
                        'key' => 'field_partner_color',
                        'label' => 'Primärfarbe',
                        'name' => 'color',
                        'type' => 'color_picker',
                        'default_value' => '#3b82f6',
                        'wrapper' => ['width' => '20'],
                    ],
                    [
                        'key' => 'field_partner_url',
                        'label' => 'Website URL',
                        'name' => 'url',
                        'type' => 'url',
                        'required' => 1,
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key' => 'field_partner_logo',
                        'label' => 'Logo',
                        'name' => 'logoUrl',
                        'type' => 'image',
                        'return_format' => 'url',
                        'preview_size' => 'thumbnail',
                        'wrapper' => ['width' => '50'],
                        'instructions' => 'Logo für die Anzeige im Nexus Terminal',
                    ],
                ],
            ],
        ],
        'location' => [
            [
                ['param' => 'options_page', 'operator' => '==', 'value' => 'civerse-marketplace-settings'],
            ],
        ],
    ]);

    // =========================================================================
    // PARTNER-EINRICHTUNGEN (Nexus Terminal) - DEPRECATED (Merged into Marketplace)
    // =========================================================================
    /*
    acf_add_local_field_group([
        'key' => 'group_partners',
        'title' => 'Partner-Einrichtungen (Nexus Terminal)',
        'fields' => [
            [
                'key' => 'field_partners_info',
                'label' => 'Partner-Netzwerk',
                'type' => 'message',
                'message' => 'Partner-Einrichtungen erscheinen im Nexus Terminal auf dem Marktplatz als animierter "Fahrplan" mit Verbindungen zu anderen Institutionen.',
            ],
            [
                'key' => 'field_partner_connections',
                'label' => 'Partner-Verbindungen',
                'name' => 'partner_connections',
                'type' => 'repeater',
                'layout' => 'block',
                'button_label' => 'Partner hinzufügen',
                'sub_fields' => [
                    [
                        'key' => 'field_partner_id',
                        'label' => 'Partner ID',
                        'name' => 'id',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. ekd, bmbf, eu',
                        'wrapper' => ['width' => '20'],
                    ],
                    [
                        'key' => 'field_partner_name',
                        'label' => 'Vollständiger Name',
                        'name' => 'name',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. Evangelische Kirche in Deutschland',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_partner_short_name',
                        'label' => 'Kurzname (für Anzeige)',
                        'name' => 'shortName',
                        'type' => 'text',
                        'required' => 1,
                        'placeholder' => 'z.B. EKD Hannover',
                        'wrapper' => ['width' => '40'],
                    ],
                    [
                        'key' => 'field_partner_category',
                        'label' => 'Kategorie',
                        'name' => 'category',
                        'type' => 'select',
                        'choices' => [
                            'ministry' => '🏛️ Ministerium',
                            'church' => '⛪ Kirchliche Einrichtung',
                            'university' => '🎓 Universität',
                            'institute' => '🔬 Institut',
                            'international' => '🌍 International',
                            'association' => '🤝 Verband/Gesellschaft',
                        ],
                        'wrapper' => ['width' => '30'],
                    ],
                    [
                        'key' => 'field_partner_color',
                        'label' => 'Primärfarbe',
                        'name' => 'color',
                        'type' => 'color_picker',
                        'default_value' => '#3b82f6',
                        'wrapper' => ['width' => '20'],
                    ],
                    [
                        'key' => 'field_partner_url',
                        'label' => 'Website URL',
                        'name' => 'url',
                        'type' => 'url',
                        'required' => 1,
                        'wrapper' => ['width' => '50'],
                    ],
                    [
                        'key' => 'field_partner_logo',
                        'label' => 'Logo',
                        'name' => 'logoUrl',
                        'type' => 'image',
                        'return_format' => 'url',
                        'preview_size' => 'thumbnail',
                        'wrapper' => ['width' => '50'],
                        'instructions' => 'Logo für die Anzeige im Nexus Terminal',
                    ],
                ],
            ],
        ],
        'location' => [
            [
                ['param' => 'options_page', 'operator' => '==', 'value' => 'civerse-marketplace-settings'],
            ],
        ],
    ]);
    */
}
