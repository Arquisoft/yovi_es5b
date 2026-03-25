use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use gamey::{YBotRegistry, YEN, create_default_state, create_router, state::AppState, RandomBot, MoveResponse, ErrorResponse};
use http_body_util::BodyExt;
use std::sync::Arc;
use tower::ServiceExt;

/// Helper to create a test app with the default state
fn test_app() -> axum::Router {
    create_router(create_default_state())
}

/// Helper to create a test app with a custom state
fn test_app_with_state(state: AppState) -> axum::Router {
    create_router(state)
}

// ============================================================================
// Status endpoint tests
// ============================================================================

#[tokio::test]
async fn test_status_endpoint_returns_ok() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(&body[..], b"OK");
}

// ============================================================================
// Choose endpoint tests - Success cases
// ============================================================================

#[tokio::test]
async fn test_choose_endpoint_with_valid_request() {
    let app = test_app();

    // Create a valid YEN (Y-game Exchange Notation) for a size 3 board
    // Layout: empty board with 3 rows (size 3): row1=1cell, row2=2cells, row3=3cells
    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
    // Coordinates should be valid (we can't predict exactly which one the random bot picks)
}

#[tokio::test]
async fn test_choose_endpoint_with_partially_filled_board() {
    let app = test_app();

    // Board with some cells already filled: B in first cell, R in second
    let yen = YEN::new(3, 2, vec!['B', 'R'], "B/R./.B.".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
}

// ============================================================================
// Choose endpoint tests - Error cases
// ============================================================================

#[tokio::test]
async fn test_choose_endpoint_with_invalid_api_version() {
    let app = test_app();

    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v2/ybot/choose/random_bot") // v2 is not supported
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK); // Axum returns 200 with error JSON

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Unsupported API version"));
    assert_eq!(error_response.api_version, Some("v2".to_string()));
}

#[tokio::test]
async fn test_choose_endpoint_with_unknown_bot() {
    let app = test_app();

    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/unknown_bot")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Bot not found"));
    assert!(error_response.message.contains("unknown_bot"));
    assert_eq!(error_response.bot_id, Some("unknown_bot".to_string()));
}

#[tokio::test]
async fn test_choose_endpoint_with_invalid_json() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                .header("content-type", "application/json")
                .body(Body::from("{ invalid json }"))
                .unwrap(),
        )
        .await
        .unwrap();

    // Invalid JSON should return a 4xx error
    assert!(response.status().is_client_error());
}

#[tokio::test]
async fn test_choose_endpoint_with_missing_content_type() {
    let app = test_app();

    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                // No content-type header
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    // Missing content-type should return an error
    assert!(response.status().is_client_error());
}

// ============================================================================
// Play endpoint tests - Success cases
// ============================================================================

/// Prueba: Petición de juego válida a random bot
#[tokio::test]
async fn test_play_endpoint_with_valid_request() {
    let app = test_app();

    // Posición codificada para URL: { "size": 3, "turn": 0, "players": ["B", "R"], "layout": "./../..." }
    let query_params = format!("?bot_id=random_bot&strategy=normal&position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%200%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22.%2F..%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
    // Coordinates should be valid (we can't predict exactly which one the random bot picks)
}

/// Prueba: peticion de juego con un juego a medias
#[tokio::test]
async fn test_play_endpoint_with_partially_filled_board() {
    let app = test_app();

    // Juego a medias codificado para URL:
    let query_params = format!("?bot_id=random_bot&strategy=normal&position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%201%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22B%2FR.%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
}

/// Prueba: omitir parámetro strategy
#[tokio::test]
async fn test_play_endpoint_withoyt_strategy_param() {
    let app = test_app();

    // Juego a medias codificado para URL:
    let query_params = format!("?bot_id=random_bot&position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%201%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22B%2FR.%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
}

/// Prueba: omitir parámetro bot_id (random_bot por defecto
#[tokio::test]
async fn test_play_endpoint_without_bot_id_param() {
    let app = test_app();

    // Juego a medias codificado para URL:
    let query_params = format!("?position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%201%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22B%2FR.%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let move_response: MoveResponse = serde_json::from_slice(&body).unwrap();

    assert_eq!(move_response.api_version, "v1");
    assert_eq!(move_response.bot_id, "random_bot");
}

// ============================================================================
// Play endpoint tests - Error cases
// ============================================================================


/// Prueba: versión de API no válida (v2 en vez de v1)
#[tokio::test]
async fn test_play_endpoint_with_invalid_api_version() {
    let app = test_app();

    // Posición codificada para URL: { "size": 3, "turn": 0, "players": ["B", "R"], "layout": "./../..." }
    let query_params = format!("?bot_id=random_bot&strategy=normal&position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%200%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22.%2F..%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v2/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK); // Axum returns 200 with error JSON

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Unsupported API version"));
    assert_eq!(error_response.api_version, Some("v2".to_string()));
}

/// Prueba: bot no existente (unknown_bot en vez de random_bot)
#[tokio::test]
async fn test_play_endpoint_with_unknown_bot() {
    let app = test_app();

    // Posición codificada para URL: { "size": 3, "turn": 0, "players": ["B", "R"], "layout": "./../..." }
    let query_params = format!("?bot_id=unknown_bot&strategy=normal&position={}", "%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%200%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22.%2F..%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Bot not found"));
    assert!(error_response.message.contains("unknown_bot"));
    assert_eq!(error_response.bot_id, Some("unknown_bot".to_string()));
}

/// Prueba: JSON no válido en parámetro position
#[tokio::test]
async fn test_play_endpoint_with_invalid_json() {
    let app = test_app();
    //
    // Posición codificada para URL: {{ "size": 3, "turn": 0, "players": ["B", "R"], "layout": "./../..." }
    let query_params = format!("?bot_id=unknown_bot&strategy=normal&position={}", "%7B%7B%20%22size%22%3A%203%2C%20%22turn%22%3A%200%2C%20%22players%22%3A%20%5B%22B%22%2C%20%22R%22%5D%2C%20%22layout%22%3A%20%22.%2F..%2F...%22%20%7D%0A");

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // Devuelve 200 con JSON de error
    assert!(response.status().is_success());
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Invalid YEN format"));
}

/// Prueba: omitir parámetro position
#[tokio::test]
async fn test_play_endpoint_without_position_param() {
    let app = test_app();

    let query_params = "?bot_id=unknown_bot&strategy=normal";

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/play".to_owned() + &query_params)
                .header("content-type", "application/json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // Devuelve 400
    assert!(response.status().is_client_error());
}


// ============================================================================
// Custom state tests
// ============================================================================

#[tokio::test]
async fn test_choose_with_custom_bot_registry() {
    // Create a custom registry with only the random bot
    let bots = YBotRegistry::new().with_bot(Arc::new(RandomBot));
    let state = AppState::new(bots);
    let app = test_app_with_state(state);

    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_choose_with_empty_bot_registry() {
    // Create an empty registry
    let bots = YBotRegistry::new();
    let state = AppState::new(bots);
    let app = test_app_with_state(state);

    let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/ybot/choose/random_bot")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_string(&yen).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();

    assert!(error_response.message.contains("Bot not found"));
}

// ============================================================================
// Route not found tests
// ============================================================================

#[tokio::test]
async fn test_unknown_route_returns_404() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/unknown/route")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_wrong_method_on_status_endpoint() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // POST to a GET-only endpoint should return 405 Method Not Allowed
    assert_eq!(response.status(), StatusCode::METHOD_NOT_ALLOWED);
}

#[tokio::test]
async fn test_get_on_choose_endpoint_returns_method_not_allowed() {
    let app = test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/ybot/choose/random_bot")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::METHOD_NOT_ALLOWED);
}
