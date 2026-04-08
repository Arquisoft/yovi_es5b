use crate::{Coordinates, GameStatus, YEN, check_api_version, error::ErrorResponse, state::AppState, next_move::choose_next_move, next_move::NextMove};
use axum::{
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};

/// Path parameters extracted from the choose endpoint URL.
#[derive(Deserialize)]
pub struct ChooseParams {
    /// The API version (e.g., "v1").
    api_version: String,
    /// The identifier of the bot to use for move selection.
    bot_id: String,
}

/// Response returned by the choose endpoint on success.
///
/// Contains the bot's chosen move coordinates along with context
/// about which API version and bot were used.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct MoveResponse {
    /// The API version used for this request.
    pub api_version: String,
    /// The bot that selected this move.
    pub bot_id: String,
    /// The coordinates where the bot chooses to place its piece.
    pub coords: Coordinates,
    /// The status of the current game.
    pub status: GameStatus,
}

/// Handler for the bot move selection endpoint.
///
/// This endpoint accepts a game state in YEN format and returns the
/// coordinates of the bot's chosen move.
///
/// # Route
/// `POST /{api_version}/ybot/choose/{bot_id}`
///
/// # Request Body
/// A JSON object in YEN format representing the current game state.
///
/// # Response
/// On success, returns a `MoveResponse` with the chosen coordinates.
/// On failure, returns an `ErrorResponse` with details about what went wrong.
#[axum::debug_handler]
pub async fn choose(
    State(state): State<AppState>,
    Path(params): Path<ChooseParams>,
    Json(yen): Json<YEN>,
) -> Result<Json<MoveResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version)?;

    // Calcular el siguiente movimiento y devolverlo como JSON
    let next_move = NextMove {
        api_version: params.api_version.to_owned(),
        bot_id: params.bot_id.to_owned(),
        yen: yen.to_owned(),
        state: &state
    };
    let move_result = choose_next_move(next_move);
    return move_result.map(|r| Json(r)).map_err(|r| Json(r));

}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::GameY;

    #[test]
    fn test_move_response_creation() {
        let response = MoveResponse {
            api_version: "v1".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(1, 2, 3),
            status: GameY::new(3).status().to_owned()
        };
        assert_eq!(response.api_version, "v1");
        assert_eq!(response.bot_id, "random");
        assert_eq!(response.coords, Coordinates::new(1, 2, 3));
    }

    #[test]
    fn test_move_response_serialize() {
        let response = MoveResponse {
            api_version: "v1".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(1, 2, 3),
            status: GameY::new(3).status().to_owned()
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"api_version\":\"v1\""));
        assert!(json.contains("\"bot_id\":\"random\""));
    }

    #[test]
    fn test_move_response_deserialize() {
        let json = r#"{"api_version":"v1","bot_id":"test","coords":{"x":0,"y":1,"z":2}, "status": {"Ongoing": {"next_player": 1}}}"#;
        let response: MoveResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.api_version, "v1");
        assert_eq!(response.bot_id, "test");
    }

    #[test]
    fn test_move_response_clone() {
        let response = MoveResponse {
            api_version: "v1".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(0, 0, 0),
            status: GameY::new(3).status().to_owned()
        };
        let cloned = response.clone();
        assert_eq!(response, cloned);
    }

    #[test]
    fn test_move_response_equality() {
        let r1 = MoveResponse {
            api_version: "v1".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(1, 1, 1),
            status: GameY::new(3).status().to_owned()
        };
        let r2 = MoveResponse {
            api_version: "v1".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(1, 1, 1),
            status: GameY::new(3).status().to_owned()
        };
        let r3 = MoveResponse {
            api_version: "v2".to_string(),
            bot_id: "random".to_string(),
            coords: Coordinates::new(1, 1, 1),
            status: GameY::new(3).status().to_owned()
        };
        assert_eq!(r1, r2);
        assert_ne!(r1, r3);
    }
}
