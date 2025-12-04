<?php
/**
 * Plugin Name: CI-Verse Data
 * Description: REST API für die CI-Verse 3D-Bildungslandschaft. CPTs und Fields werden über ACF Pro verwaltet.
 * Version: 2.0.0
 * Author: Comenius-Institut
 * Text Domain: ci-verse
 * Requires Plugins: advanced-custom-fields-pro
 */

if (!defined('ABSPATH')) exit;

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
            return [
                'id' => 's-' . sanitize_title($stand['title'] ?? 'stand'),
                'title' => $stand['title'] ?? '',
                'type' => $stand['type'] ?? 'info',
                'icon' => $stand['icon'] ?? '',
                'description' => $stand['description'] ?? '',
                'display' => [
                    'color' => $stand['color'] ?? '#64748b',
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
                'id' => 'leitlinie-' . ($poster['perspective'] ?? 'unknown'),
                'title' => $poster['title'] ?? '',
                'imageUrl' => $poster['image']['url'] ?? '',
                'perspective' => $poster['perspective'] ?? '',
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
            'display' => [
                'slogan' => get_field('project_slogan', $post->ID) ?: '',
                'posterImage' => $poster_image['url'] ?? '',
                'posterImageFormat' => get_field('project_poster_image_format', $post->ID) ?: 'portrait',
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
            'id' => get_field('staff_id', $post->ID) ?: 'm' . $post->ID,
            'name' => $post->post_title,
            'avatarUrl' => get_the_post_thumbnail_url($post->ID, 'thumbnail') ?: '',
            'role' => get_field('staff_role', $post->ID) ?: '',
            'email' => get_field('staff_email', $post->ID) ?: '',
        ];
    }
    
    return $staff;
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

// ============================================================================
// ADMIN HINWEISE
// ============================================================================

add_action('admin_notices', function() {
    if (!class_exists('ACF')) {
        echo '<div class="notice notice-error"><p><strong>CI-Verse Data:</strong> Dieses Plugin benötigt ACF Pro. Bitte installieren und aktivieren Sie ACF Pro.</p></div>';
    }
});
