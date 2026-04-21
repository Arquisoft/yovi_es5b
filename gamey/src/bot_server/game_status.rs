use crate::{GameStatus, GameY, YEN, check_api_version, error::ErrorResponse};
use axum::{
    Json,
    extract::Path,
};
use serde::{Deserialize, Serialize};

/// Parámetros de ruta extraídos de la URL del endpoint de estado.
#[derive(Deserialize)]
pub struct StatusCheckParams {
    /// La versión de la API (p.ej., "v1").
    api_version: String,
}

/// Respuesta devuelta por el endpoint de estado.
///
/// Contiene únicamente el estado actual de la partida, sin ningún movimiento de bot.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct StatusResponse {
    /// La versión de la API utilizada en la petición.
    pub api_version: String,
    /// El estado actual de la partida.
    pub status: GameStatus,
}

/// Handler del endpoint de estado de la partida.
///
/// Este endpoint recibe el estado del juego en formato YEN y devuelve únicamente
/// el estado actual de la partida, sin invocar ningún bot.
/// Está pensado para el modo jugador contra jugador, donde no se necesita ningún movimiento de IA.
///
/// # Ruta
/// `POST /{api_version}/ybot/status`
///
/// # Cuerpo de la petición
/// Un objeto JSON en formato YEN que representa el estado actual de la partida.
///
/// # Respuesta
/// En caso de éxito, devuelve un `StatusResponse` con el estado actual de la partida.
/// En caso de error, devuelve un `ErrorResponse` con detalles sobre el fallo.
#[axum::debug_handler]
pub async fn game_status(
    Path(params): Path<StatusCheckParams>,
    Json(yen): Json<YEN>,
) -> Result<Json<StatusResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version)?;

    let game_y = match GameY::try_from(yen) {
        Ok(game) => game,
        Err(err) => {
            return Err(Json(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                Some(params.api_version),
                None,
            )));
        }
    };

    Ok(Json(StatusResponse {
        api_version: params.api_version,
        status: game_y.status().clone(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::GameY;

    #[test]
    fn test_status_response_creation() {
        let response = StatusResponse {
            api_version: "v1".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        assert_eq!(response.api_version, "v1");
    }

    #[test]
    fn test_status_response_serialize() {
        let response = StatusResponse {
            api_version: "v1".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"api_version\":\"v1\""));
    }

    #[test]
    fn test_status_response_deserialize() {
        let json = r#"{"api_version":"v1","status":{"Ongoing":{"next_player":0}}}"#;
        let response: StatusResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.api_version, "v1");
    }

    #[test]
    fn test_status_response_clone() {
        let response = StatusResponse {
            api_version: "v1".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        let cloned = response.clone();
        assert_eq!(response, cloned);
    }

    #[test]
    fn test_status_response_equality() {
        let r1 = StatusResponse {
            api_version: "v1".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        let r2 = StatusResponse {
            api_version: "v1".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        let r3 = StatusResponse {
            api_version: "v2".to_string(),
            status: GameY::new(3).status().to_owned(),
        };
        assert_eq!(r1, r2);
        assert_ne!(r1, r3);
    }
}