<?php
/**
 * Plugin Name: CI-Verse Data
 * Description: Custom Post Types und REST API für die CI-Verse 3D-Bildungslandschaft
 * Version: 1.0.0
 * Author: Comenius-Institut
 * Text Domain: ci-verse
 */

if (!defined('ABSPATH')) exit;

// ACF Felder laden
require_once plugin_dir_path(__FILE__) . 'acf-fields.php';

// ============================================================================
// CUSTOM POST TYPES
// ============================================================================

add_action('init', 'civerse_register_post_types');

function civerse_register_post_types() {
    
    // CPT: Plattformen
    register_post_type('civerse_platform', [
        'labels' => [
            'name' => 'Plattformen',
            'singular_name' => 'Plattform',
            'add_new' => 'Neue Plattform',
            'add_new_item' => 'Neue Plattform hinzufügen',
            'edit_item' => 'Plattform bearbeiten',
            'menu_name' => 'Plattformen',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'civerse-settings',
        'show_in_rest' => true,
        'supports' => ['title'],
        'menu_icon' => 'dashicons-location',
    ]);

    // CPT: Projekte
    register_post_type('civerse_project', [
        'labels' => [
            'name' => 'Projekte',
            'singular_name' => 'Projekt',
            'add_new' => 'Neues Projekt',
            'add_new_item' => 'Neues Projekt hinzufügen',
            'edit_item' => 'Projekt bearbeiten',
            'menu_name' => 'Projekte',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'civerse-settings',
        'show_in_rest' => true,
        'supports' => ['title', 'thumbnail'],
        'menu_icon' => 'dashicons-portfolio',
    ]);

    // CPT: Personal
    register_post_type('civerse_staff', [
        'labels' => [
            'name' => 'Personal',
            'singular_name' => 'Mitarbeiter',
            'add_new' => 'Neue Person',
            'add_new_item' => 'Neue Person hinzufügen',
            'edit_item' => 'Person bearbeiten',
            'menu_name' => 'Personal',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'civerse-settings',
        'show_in_rest' => true,
        'supports' => ['title', 'thumbnail'],
        'menu_icon' => 'dashicons-groups',
    ]);
}

// ============================================================================
// ADMIN MENU
// ============================================================================

add_action('admin_menu', 'civerse_admin_menu');

function civerse_admin_menu() {
    add_menu_page(
        'CI-Verse',
        'CI-Verse',
        'manage_options',
        'civerse-settings',
        'civerse_settings_page',
        'dashicons-building',
        30
    );
    
    add_submenu_page(
        'civerse-settings',
        'API Export',
        'API Export',
        'manage_options',
        'civerse-api',
        'civerse_api_page'
    );
}

function civerse_settings_page() {
    $api_url = rest_url('civerse/v1/world');
    ?>
    <div class="wrap">
        <h1>CI-Verse Einstellungen</h1>
        <div class="card" style="max-width: 600px; padding: 20px;">
            <h2>Willkommen bei CI-Verse</h2>
            <p>Verwalten Sie hier die Inhalte für die 3D-Bildungslandschaft:</p>
            <ul>
                <li><strong>Plattformen</strong> - Die 6 Themen-Inseln (B1-B3, Q1-Q3)</li>
                <li><strong>Projekte</strong> - Alle Projekte und Initiativen</li>
                <li><strong>Personal</strong> - Mitarbeiter und Ansprechpartner</li>
                <li><strong>Marktplatz</strong> - Zentrale S-Plattform mit Institut, News, Events</li>
            </ul>
            <p><a href="<?php echo esc_url($api_url); ?>" target="_blank" class="button button-primary">API Endpoint testen</a></p>
        </div>
    </div>
    <?php
}

function civerse_api_page() {
    $api_url = rest_url('civerse/v1/world');
    ?>
    <div class="wrap">
        <h1>API Export</h1>
        <div class="card" style="max-width: 800px; padding: 20px;">
            <h2>REST API Endpoint</h2>
            <p><code style="background: #f0f0f0; padding: 10px; display: block;"><?php echo esc_url($api_url); ?></code></p>
            <p><a href="<?php echo esc_url($api_url); ?>" target="_blank" class="button">JSON anzeigen</a></p>
        </div>
    </div>
    <?php
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
}

function civerse_get_world_data() {
    return [
        'marketplace' => civerse_get_marketplace(),
        'platforms' => civerse_get_platforms(),
        'projects' => civerse_get_projects(),
        'staff' => civerse_get_staff(),
    ];
}

// ============================================================================
// DATA GETTERS
// ============================================================================

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
            return [
                'id' => 's-' . sanitize_title($stand['title']),
                'title' => $stand['title'],
                'type' => $stand['type'],
                'icon' => $stand['icon'],
                'description' => $stand['description'],
                'display' => [
                    'color' => $stand['color'],
                    'logoUrl' => $stand['logo']['url'] ?? '',
                    'bannerImage' => $stand['banner']['url'] ?? '',
                ],
                'chatWebhook' => !empty($stand['chat_webhook']) ? $stand['chat_webhook'] : null,
                'rssFeedUrls' => !empty($rss_feeds) ? $rss_feeds : null,
                'calendarUrl' => !empty($stand['calendar_url']) ? $stand['calendar_url'] : null,
                'externalUrl' => $stand['external_url'] ?? null,
            ];
        }, $stands),
        'wallPosters' => array_map(function($poster) {
            return [
                'id' => 'leitlinie-' . $poster['perspective'],
                'title' => $poster['title'],
                'imageUrl' => $poster['image']['url'] ?? '',
                'perspective' => $poster['perspective'],
            ];
        }, $wallPosters),
    ];
}

function civerse_get_platforms() {
    $platforms = [];
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
        $wall_posters = get_field('platform_wall_posters', $post->ID) ?: [];
        $booth_projects = get_field('platform_booth_projects', $post->ID) ?: [];
        
        $platforms[$id] = [
            'id' => $id,
            'title' => get_field('platform_title', $post->ID),
            'short' => get_field('platform_short', $post->ID),
            'description' => get_field('platform_description', $post->ID),
            'color' => get_field('platform_color', $post->ID) ?: '#64748b',
            'glowColor' => get_field('platform_glow_color', $post->ID) ?: '#94a3b8',
            'aspects' => array_map(function($aspect, $index) use ($id) {
                return [
                    'id' => strtolower($id) . '-a' . ($index + 1),
                    'title' => $aspect['title'],
                    'icon' => $aspect['icon'],
                    'description' => $aspect['description'],
                    'contentUrl' => $aspect['content_url'] ?? null,
                ];
            }, $aspects, array_keys($aspects)),
            'wallPosters' => array_map(function($p) {
                return get_field('project_id', $p->ID);
            }, $wall_posters),
            'boothProjects' => array_map(function($p) {
                return get_field('project_id', $p->ID);
            }, $booth_projects),
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
            'id' => get_field('project_id', $post->ID),
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'externalUrl' => get_field('project_external_url', $post->ID),
            'departments' => get_field('project_departments', $post->ID) ?: [],
            'perspectives' => get_field('project_perspectives', $post->ID) ?: [],
            'targetGroups' => get_field('project_target_groups', $post->ID) ?: [],
            'type' => get_field('project_type', $post->ID) ?: 'ground',
            'staff' => $staff_ids,
            'shortTeaser' => get_field('project_teaser', $post->ID),
            'display' => [
                'slogan' => get_field('project_slogan', $post->ID),
                'posterImage' => $poster_image['url'] ?? '',
                'logoUrl' => $logo['url'] ?? '',
                'color' => get_field('project_color', $post->ID) ?: '#3b82f6',
                'screenshotUrl' => $screenshot['url'] ?? '',
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
            'id' => get_field('staff_id', $post->ID),
            'name' => $post->post_title,
            'avatarUrl' => get_the_post_thumbnail_url($post->ID, 'thumbnail') ?: '',
            'role' => get_field('staff_role', $post->ID),
            'email' => get_field('staff_email', $post->ID),
        ];
    }
    
    return $staff;
}

// ============================================================================
// ACF OPTIONS PAGE
// ============================================================================

add_action('acf/init', 'civerse_acf_options_page');

function civerse_acf_options_page() {
    if (!function_exists('acf_add_options_page')) return;
    
    acf_add_options_page([
        'page_title' => 'Marktplatz Einstellungen',
        'menu_title' => 'Marktplatz',
        'menu_slug' => 'civerse-marketplace-settings',
        'parent_slug' => 'civerse-settings',
        'post_id' => 'civerse_marketplace',
        'capability' => 'manage_options',
    ]);
}

// ============================================================================
// CORS HEADER (für lokale Entwicklung)
// ============================================================================

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type');
        return $value;
    });
}, 15);
