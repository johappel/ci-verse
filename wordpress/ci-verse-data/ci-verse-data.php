<?php
/**
 * Plugin Name: CI-Verse Data
 * Description: REST API für die CI-Verse 3D-Bildungslandschaft. CPTs und Fields werden über ACF Pro verwaltet.
 * Version: 2.0.0
 * Author: Joachim Happel
 * Author URI: https://joachimhappel.de
 * Text Domain: ci-verse
 * Requires Plugins: advanced-custom-fields-pro
 */

if (!defined('ABSPATH')) exit;

// ============================================================================
// URL CONVERSION HELPER
// ============================================================================

/**
 * Konvertiert absolute URLs zu relativen Pfaden
 * Damit werden URLs durch den Vite Dev-Server Proxy korrekt weitergeleitet
 * 
 * Beispiel:
 *   http://ci.test/wp-content/uploads/2025/12/image.jpg
 *   → /wp-content/uploads/2025/12/image.jpg
 * 
 * Funktioniert auch mit verschiedenen Domains (z.B. CDN):
 *   https://cdn.example.com/wp-content/uploads/...
 *   → /wp-content/uploads/...
 */
function civerse_to_relative_url($absolute_url) {
    if (!$absolute_url) {
        return '';
    }
    
    // Extrahiere Pfad nach dem Domain-Teil
    // http://example.com/path/to/file → /path/to/file
    $parsed = parse_url($absolute_url);
    if (isset($parsed['path'])) {
        return $parsed['path'];
    }
    
    // Fallback: return as is
    return $absolute_url;
}

// ============================================================================
// ACF OPTIONS PAGE (muss per PHP registriert werden)
// ============================================================================

add_action('acf/init', 'civerse_register_options_page');

function civerse_register_options_page() {
    if (!function_exists('acf_add_options_page')) return;
    
    acf_add_options_page([
        'page_title' => 'Marktplatz Einstellungen',
        'menu_title' => 'CI-Verse Marktplatz',
        'menu_slug' => 'civerse-marketplace-settings',
        'capability' => 'manage_options',
        'position' => 33,
        'icon_url' => 'dashicons-store',
        'redirect' => false,
        'post_id' => 'civerse_marketplace',
        'autoload' => true,
        'update_button' => 'Marktplatz speichern',
        'updated_message' => 'Marktplatz-Einstellungen gespeichert.',
    ]);
}

// ============================================================================
// REST API ENDPOINT
// ============================================================================

add_action('rest_api_init', 'civerse_register_rest_routes');

function civerse_register_rest_routes() {
    register_rest_route('civerse/v1', '/world', [
        'methods' => 'GET',
        'callback' => 'civerse_get_world_data',
        'permission_callback' => '__return_true',
    ]);
    
    // Image Proxy - Falls CORS-Header nicht funktionieren
    register_rest_route('civerse/v1', '/image-proxy', [
        'methods' => 'GET',
        'callback' => 'civerse_image_proxy',
        'permission_callback' => '__return_true',
        'args' => [
            'url' => [
                'required' => true,
                'description' => 'Image URL to proxy',
            ],
        ],
    ]);

    // Feed Proxy - holt entfernte RSS/Atom-Feeds und gibt sie mit CORS-Headern zurück
    register_rest_route('civerse/v1', '/feed-proxy', [
        'methods' => 'GET',
        'callback' => 'civerse_feed_proxy',
        'permission_callback' => '__return_true',
        'args' => [
            'url' => [
                'required' => true,
                'description' => 'Feed URL to proxy (http(s)://...)',
            ],
        ],
    ]);
}

function civerse_get_world_data() {
    return [
        'partnerConnections' => civerse_get_partner_connections(),
        'marketplace' => civerse_get_marketplace(),
        'platforms' => civerse_get_platforms(),
        'projects' => civerse_get_projects(),
        'staff' => civerse_get_staff(),
    ];
}

/**
 * Image Proxy - Fallback falls CORS-Header nicht funktionieren
 * Proxied externe Bilder durch die REST API mit korrekten CORS-Headern
 */
function civerse_image_proxy($request) {
    $image_url = $request->get_param('url');
    
    if (!$image_url) {
        return new WP_Error('missing_url', 'Image URL is required');
    }
    
    // Nur WordPress Uploads erlauben
    if (strpos($image_url, home_url()) === false) {
        return new WP_Error('invalid_url', 'Only local images are allowed');
    }
    
    // Bild abrufen
    $response = wp_safe_remote_get($image_url, [
        'timeout' => 10,
    ]);
    
    if (is_wp_error($response)) {
        return new WP_Error('fetch_failed', 'Could not fetch image');
    }
    
    // Body und Content-Type extrahieren
    $body = wp_remote_retrieve_body($response);
    $content_type = wp_remote_retrieve_header($response, 'content-type');
    
    // Response mit CORS-Headern zurückgeben
    return new WP_REST_Response($body, 200, [
        'Content-Type' => $content_type,
        'Access-Control-Allow-Origin' => '*',
    ]);
}

function civerse_feed_proxy($request) {
    $feed_url = $request->get_param('url');

    if (!$feed_url) {
        return new WP_Error('missing_url', 'Feed URL is required');
    }

    // Sicherheitscheck: nur http(s)
    if (!preg_match('#^https?://#i', $feed_url)) {
        return new WP_Error('invalid_url', 'Feed URL must be an absolute http(s) URL');
    }

    // Fetch remote feed
    $response = wp_safe_remote_get($feed_url, [
        'timeout' => 15,
        'headers' => [
            'User-Agent' => 'CI-Verse-Feed-Proxy/1.0 (+https://example.org)'
        ]
    ]);

    if (is_wp_error($response)) {
        return new WP_Error('fetch_failed', 'Could not fetch feed');
    }

    $body = wp_remote_retrieve_body($response);
    $content_type = wp_remote_retrieve_header($response, 'content-type') ?: 'application/xml';

    // WICHTIG: Rohen XML-Body direkt ausgeben, NICHT als JSON enkodieren
    // WP_REST_Response würde den Body als JSON enkodieren und escapen
    status_header(200);
    header('Content-Type: ' . $content_type);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    echo $body;
    exit; // REST-Pipeline beenden
}

// ============================================================================
// DATA GETTERS
// ============================================================================

function civerse_get_partner_connections() {
    $partners = get_field('partner_connections', 'civerse_marketplace') ?: [];
    
    return array_map(function($partner) {
        return [
            'id' => $partner['id'] ?? '',
            'name' => $partner['name'] ?? '',
            'shortName' => $partner['shortName'] ?? '',
            'logoUrl' => is_array($partner['logoUrl']) ? $partner['logoUrl']['url'] : ($partner['logoUrl'] ?? ''),
            'color' => $partner['color'] ?? '#3b82f6',
            'url' => $partner['url'] ?? '',
            'category' => $partner['category'] ?? '',
        ];
    }, $partners);
}

function civerse_get_marketplace() {
    $stands = get_field('marketplace_stands', 'civerse_marketplace') ?: [];
    $wallPosters = get_field('marketplace_wall_posters', 'civerse_marketplace') ?: [];
    
    return [
        'id' => 'S',
        'title' => get_field('marketplace_title', 'civerse_marketplace') ?: 'Marktplatz',
        'short' => get_field('marketplace_short', 'civerse_marketplace') ?: 'Marktplatz',
        'description' => get_field('marketplace_description', 'civerse_marketplace') ?: 'Bildungsmarktplatz des Comenius-Instituts.',
        'color' => get_field('marketplace_color', 'civerse_marketplace') ?: '#64748b',
        'glowColor' => get_field('marketplace_glow_color', 'civerse_marketplace') ?: '#94a3b8',
        'stands' => array_map(function($stand) {
            $rss_feeds = [];
            if (!empty($stand['rss_feeds'])) {
                foreach ($stand['rss_feeds'] as $feed) {
                    $rss_feeds[] = $feed['url'];
                }
            }
                // Nostr fields: ACF bietet `nostr_filter` (npub/nevent).
                // Für den Relay-URL verwenden wir explizit `nostr_relay` wenn vorhanden,
                // ansonsten als pragmatischen Fallback `external_url` (häufig im ACF-Form eingetragen).
                $nostr_filter = !empty($stand['nostr_filter']) ? $stand['nostr_filter'] : null;
                $nostr_relay = !empty($stand['nostr_relay']) ? $stand['nostr_relay'] : (!empty($stand['external_url']) ? $stand['external_url'] : null);

                return [
                    'id' => 's-' . sanitize_title($stand['title'] ?? 'stand'),
                    'title' => $stand['title'] ?? '',
                    'type' => $stand['type'] ?? 'info',
                    'icon' => $stand['icon'] ?? '',
                    'description' => $stand['description'] ?? '',
                    'display' => [
                        'color' => $stand['color'] ?? '#64748b',
                        'logoUrl' => civerse_to_relative_url($stand['logo']['url'] ?? ''),
                        'bannerImage' => civerse_to_relative_url($stand['banner']['url'] ?? ''),
                    ],
                    'chatWebhook' => !empty($stand['chat_webhook']) ? $stand['chat_webhook'] : null,
                    'rssFeedUrls' => !empty($rss_feeds) ? $rss_feeds : null,
                    'calendarUrl' => !empty($stand['calendar_url']) ? $stand['calendar_url'] : null,
                    'externalUrl' => $stand['external_url'] ?? null,
                    // Neu: Nostr Einstellungen (npub/nevent + relay)
                    'nostrFilter' => $nostr_filter,
                    'nostrRelay' => $nostr_relay,
                ];
        }, $stands),
        'wallPosters' => array_map(function($poster) {
            return [
                'id' => 'leitlinie-' . ($poster['perspective'] ?? 'unknown'),
                'title' => $poster['title'] ?? '',
                'imageUrl' => civerse_to_relative_url($poster['image']['url'] ?? ''),
                'perspective' => $poster['perspective'] ?? '',
            ];
        }, $wallPosters),
    ];
}

function civerse_get_platforms() {
    $platforms = [];
    
    // Alle Projekte holen für automatische Zuordnung
    $all_projects = get_posts([
        'post_type' => 'civerse_project',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ]);

    $posts = get_posts([
        'post_type' => 'civerse_platform',
        'posts_per_page' => -1,
        'orderby' => 'menu_order',
        'order' => 'ASC',
    ]);
    
    foreach ($posts as $post) {
        $id = get_field('platform_id', $post->ID);
        if (!$id) continue;
        
        $aspects = get_field('platform_aspects', $post->ID) ?: [];
        
        // Projekte automatisch zuordnen basierend auf 'project_departments'
        $wall_posters = [];
        $booth_projects = [];

        foreach ($all_projects as $p) {
            $p_id = get_field('project_id', $p->ID);
            $departments = get_field('project_departments', $p->ID) ?: [];
            $display_type = get_field('project_display_type', $p->ID) ?: 'booth';

            if (in_array($id, $departments)) {
                if ($display_type === 'wall' || $display_type === 'both') {
                    $wall_posters[] = $p_id;
                }
                if ($display_type === 'booth' || $display_type === 'both') {
                    $booth_projects[] = $p_id;
                }
            }
        }
        
        $platforms[$id] = [
            'id' => $id,
            'title' => get_field('platform_title', $post->ID) ?: $post->post_title,
            'short' => get_field('platform_short', $post->ID) ?: $id,
            'description' => get_field('platform_description', $post->ID) ?: '',
            'color' => get_field('platform_color', $post->ID) ?: '#64748b',
            'glowColor' => get_field('platform_glow_color', $post->ID) ?: '#94a3b8',
            'aspects' => array_map(function($aspect, $index) use ($id) {
                return [
                    'id' => strtolower($id) . '-a' . ($index + 1),
                    'title' => $aspect['title'] ?? '',
                    'icon' => $aspect['icon'] ?? '',
                    'description' => $aspect['description'] ?? '',
                    'contentUrl' => $aspect['content_url'] ?? null,
                ];
            }, $aspects, array_keys($aspects)),
            'wallPosters' => $wall_posters,
            'boothProjects' => $booth_projects,
        ];
    }
    
    return $platforms;
}

function civerse_get_projects() {
    $projects = [];
    $posts = get_posts([
        'post_type' => 'civerse_project',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ]);
    
    foreach ($posts as $post) {
        $staff_posts = get_field('project_staff', $post->ID) ?: [];
        $staff_ids = array_map(function($s) {
            return get_field('staff_id', $s->ID);
        }, $staff_posts);
        
        $poster_image = get_field('project_poster_image', $post->ID);
        $logo = get_field('project_logo', $post->ID);
        $screenshot = get_field('project_screenshot', $post->ID);
        
        $projects[] = [
            'id' => get_field('project_id', $post->ID) ?: 'p' . $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'externalUrl' => get_field('project_external_url', $post->ID) ?: '',
            'departments' => get_field('project_departments', $post->ID) ?: [],
            'relatedDepartments' => get_field('project_related_departments', $post->ID) ?: [],
            'perspectives' => get_field('project_perspectives', $post->ID) ?: [],
            'targetGroups' => get_field('project_target_groups', $post->ID) ?: [],
            'displayType' => get_field('project_display_type', $post->ID) ?: 'booth',
            'staff' => $staff_ids,
            'shortTeaser' => get_field('project_teaser', $post->ID) ?: '',
            'description' => get_field('project_description', $post->ID) ?: '',
            'display' => [
                'slogan' => get_field('project_slogan', $post->ID) ?: '',
                'posterImage' => civerse_to_relative_url($poster_image['url'] ?? ''),
                'posterImageFormat' => get_field('project_poster_image_format', $post->ID) ?: 'portrait',
                'logoUrl' => civerse_to_relative_url($logo['url'] ?? ''),
                'color' => get_field('project_color', $post->ID) ?: '#3b82f6',
                'screenshotUrl' => civerse_to_relative_url($screenshot['url'] ?? ''),
            ],
        ];
    }
    
    return $projects;
}

function civerse_get_staff() {
    $staff = [];
    $posts = get_posts([
        'post_type' => 'civerse_staff',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ]);
    
    foreach ($posts as $post) {
        $staff[] = [
            'id' => get_field('staff_id', $post->ID) ?: 'm' . $post->ID,
            'name' => $post->post_title,
            'avatarUrl' => civerse_to_relative_url(get_the_post_thumbnail_url($post->ID, 'thumbnail') ?: ''),
            'role' => get_field('staff_role', $post->ID) ?: '',
            'email' => get_field('staff_email', $post->ID) ?: '',
        ];
    }
    
    return $staff;
}

// ============================================================================
// CORS HEADER (einmalig und sauber)
// ============================================================================

// Entferne WordPress Standard CORS-Handler und setze eigene
add_action('rest_api_init', function() {
    // Entferne Standard WordPress CORS
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    
    // Setze eigene CORS-Header NUR EINMAL
    add_filter('rest_pre_serve_request', function($value) {
        // Prüfe ob Header schon gesetzt wurde
        $headers = headers_list();
        $cors_set = false;
        foreach ($headers as $header) {
            if (stripos($header, 'Access-Control-Allow-Origin') !== false) {
                $cors_set = true;
                break;
            }
        }
        
        // Nur setzen wenn noch nicht vorhanden
        if (!$cors_set && !headers_sent()) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept');
        }
        
        return $value;
    }, 1); // Priorität 1 = sehr früh
}, 1);

// ============================================================================
// ADMIN HINWEISE
// ============================================================================

add_action('admin_notices', function() {
    if (!class_exists('ACF')) {
        echo '<div class="notice notice-error"><p><strong>CI-Verse Data:</strong> Dieses Plugin benötigt ACF Pro. Bitte installieren und aktivieren Sie ACF Pro.</p></div>';
    }
});

// ============================================================================
// FRONTEND APP HOSTING unter /ci-verse
// ============================================================================

// Rewrite Rules für /ci-verse
add_action('init', 'civerse_add_rewrite_rules');

function civerse_add_rewrite_rules() {
    // Statische Assets (_app/, assets/) - OHNE trailing slash
    add_rewrite_rule('^ci-verse/(_app/.+\.(js|css|json|map))$', 'index.php?civerse_app=1&civerse_path=$matches[1]', 'top');
    add_rewrite_rule('^ci-verse/(assets/.+)$', 'index.php?civerse_app=1&civerse_path=$matches[1]', 'top');
    
    // Root-Level-Dateien (config.json, robots.txt, etc.)
    add_rewrite_rule('^ci-verse/(config\.json|robots\.txt|404\.html)$', 'index.php?civerse_app=1&civerse_path=$matches[1]', 'top');
    
    // Hauptroute /ci-verse
    add_rewrite_rule('^ci-verse/?$', 'index.php?civerse_app=1', 'top');
    
    // SPA-Routen (z.B. /ci-verse/project/xyz)
    add_rewrite_rule('^ci-verse/([^/]+)/?$', 'index.php?civerse_app=1&civerse_path=$matches[1]', 'top');
}

// Verhindere trailing slashes für Asset-URLs
add_filter('redirect_canonical', 'civerse_no_trailing_slash_for_assets', 10, 2);

function civerse_no_trailing_slash_for_assets($redirect_url, $requested_url) {
    // Wenn es eine ci-verse Asset-Anfrage ist (endet mit .js, .css, etc.)
    if (preg_match('/\/ci-verse\/_app\/.*\.(js|css|json|map)$/i', $requested_url)) {
        return false; // Keine Umleitung!
    }
    return $redirect_url;
}

// Query Vars registrieren
add_filter('query_vars', function($vars) {
    $vars[] = 'civerse_app';
    $vars[] = 'civerse_path';
    return $vars;
});

// Template für die App
add_action('template_redirect', 'civerse_app_template');

function civerse_app_template() {
    $is_app = get_query_var('civerse_app');
    if (!$is_app) return;
    
    $path = get_query_var('civerse_path', '');
    
    // WICHTIG: WordPress fügt trailing slashes hinzu - entfernen!
    // Wenn die URL mit / endet UND eine Datei-Extension hat, umleiten
    if (!empty($path) && substr($path, -1) === '/' && preg_match('/\.[a-zA-Z0-9]+\/$/', $path)) {
        $clean_path = rtrim($path, '/');
        wp_redirect(home_url('/ci-verse/' . $clean_path), 301);
        exit;
    }
    
    $path = rtrim($path, '/'); // Entferne trailing slash für Verarbeitung
    $build_dir = plugin_dir_path(__FILE__) . 'build/';
    $build_url = plugin_dir_url(__FILE__) . 'build/';
    
    // Statische Assets direkt ausliefern (_app/, assets/, root-level files)
    if (preg_match('/^_app\//', $path) || preg_match('/^assets\//', $path) || preg_match('/^(config\.json|robots\.txt|404\.html)$/', $path)) {
        $file_path = $build_dir . $path;
        
        if (file_exists($file_path) && is_file($file_path)) {
            civerse_serve_static_file($file_path);
            exit;
        } else {
            // Debug: Asset nicht gefunden
            status_header(404);
            header('Content-Type: text/plain');
            echo "Asset not found: " . esc_html($path) . "\n";
            echo "Looking for: " . esc_html($file_path) . "\n";
            echo "Exists: " . (file_exists($file_path) ? 'yes' : 'no') . "\n";
            echo "Is file: " . (is_file($file_path) ? 'yes' : 'no');
            exit;
        }
    }
    
    // Für alle anderen Routen: index.html ausliefern (SPA-Routing)
    $index_file = $build_dir . 'index.html';
    if (file_exists($index_file)) {
        // Base-Path in der HTML anpassen
        $html = file_get_contents($index_file);
        
        // Relativen Pfad zu absolutem WordPress-Pfad ändern
        $html = str_replace('href="./', 'href="' . $build_url, $html);
        $html = str_replace('src="./', 'src="' . $build_url, $html);
        $html = str_replace('href="_app/', 'href="' . $build_url . '_app/', $html);
        $html = str_replace('src="_app/', 'src="' . $build_url . '_app/', $html);
        
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }
    
    // Fallback: 404
    status_header(404);
    echo '<h1>CI-Verse App nicht gefunden</h1>';
    echo '<p>Bitte den Build-Ordner in das Plugin-Verzeichnis kopieren.</p>';
    echo '<p>Erwartet: <code>' . esc_html($build_dir) . '</code></p>';
    exit;
}

// Statische Dateien mit korrektem MIME-Type ausliefern
function civerse_serve_static_file($file_path) {
    $extension = pathinfo($file_path, PATHINFO_EXTENSION);
    
    $mime_types = [
        'js' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'ico' => 'image/x-icon',
        'webmanifest' => 'application/manifest+json',
    ];
    
    $content_type = $mime_types[$extension] ?? 'application/octet-stream';
    
    header('Content-Type: ' . $content_type);
    header('Content-Length: ' . filesize($file_path));
    header('Cache-Control: public, max-age=31536000, immutable'); // 1 Jahr Cache für immutable Assets
    
    readfile($file_path);
}

// Flush Rewrite Rules bei Plugin-Aktivierung
register_activation_hook(__FILE__, function() {
    civerse_add_rewrite_rules();
    flush_rewrite_rules();
});

// Flush Rewrite Rules bei Plugin-Deaktivierung
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
