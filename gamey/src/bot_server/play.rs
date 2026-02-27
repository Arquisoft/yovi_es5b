use crate::{
    Coordinates, GameAction, GameStatus, GameY, Movement, YEN, PlayerId,
    bot_server::{check_api_version, error::ErrorResponse, state::AppState},
};
use axum::{
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct PlayParams {
    pub api_version: String,
    pub bot_id: String,
}

// El JSON que React le enviará a Rust
#[derive(Deserialize)]
pub struct PlayRequest {
    pub yen: YEN,
    pub player: u32,
    pub action: String, // "Place", "Resign" o "Swap"
    pub coords: Option<Coordinates>, // Solo obligatorio si la acción es "Place"
}

// El JSON que Rust le devolverá a React
#[derive(Serialize)]
pub struct PlayResponse {
    pub yen: YEN,
    pub status: String, // "Ongoing" o "Finished"
    pub winner: Option<u32>, // ID del jugador que ha ganado (si lo hay)
    pub bot_moved: Option<Coordinates>, // Dónde ha movido el bot (para animarlo en pantalla)
}

#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Path(params): Path<PlayParams>,
    Json(payload): Json<PlayRequest>,
) -> Result<Json<PlayResponse>, Json<ErrorResponse>> {
    check_api_version(&params.api_version)?;
    
    // 1. Reconstruimos el tablero de la partida actual
    let mut game = match GameY::try_from(payload.yen) {
        Ok(g) => g,
        Err(e) => {
            return Err(Json(ErrorResponse::error(
                &format!("Invalid YEN: {}", e),
                Some(params.api_version.clone()),
                Some(params.bot_id.clone()),
            )));
        }
    };

    // 2. Vemos a quién le toca
    let current_player = match game.next_player() {
        Some(p) => p,
        None => {
            return Err(Json(ErrorResponse::error(
                "Game is already finished",
                Some(params.api_version.clone()),
                Some(params.bot_id.clone()),
            )));
        }
    };

    // 3. Traducimos la jugada de React al sistema de Rust
    let human_player = PlayerId::new(0);    

    let human_move = match payload.action.as_str() {
        "Place" => {
            let coords = payload.coords.ok_or_else(|| {
                Json(ErrorResponse::error(
                    "Coords required for Place action",
                    Some(params.api_version.clone()),
                    Some(params.bot_id.clone()),
                ))
            })?;
            // Usamos human_player
            Movement::Placement { player: human_player, coords }
        },
        "Resign" => Movement::Action { player: human_player, action: GameAction::Resign },
        "Swap" => Movement::Action { player: human_player, action: GameAction::Swap },
        _ => {
            return Err(Json(ErrorResponse::error(
                "Invalid action",
                Some(params.api_version.clone()),
                Some(params.bot_id.clone()),
            )));
        }
    };

    // 4. Aplicamos el movimiento del jugador
    if let Err(e) = game.add_move(human_move) {
        return Err(Json(ErrorResponse::error(
            &format!("Invalid move: {}", e),
            Some(params.api_version.clone()),
            Some(params.bot_id.clone()),
        )));
    }

    let mut bot_moved = None;

    // 5. Si el juego no ha terminado, es el turno del bot
    if !game.check_game_over() {
        let bot = match state.bots().find(&params.bot_id) {
            Some(b) => b,
            None => {
                return Err(Json(ErrorResponse::error(
                    "Bot not found",
                    Some(params.api_version.clone()),
                    Some(params.bot_id.clone()),
                )));
            }
        };

        if let Some(bot_coords) = bot.choose_move(&game) {
            let bot_player = game.next_player().unwrap();
            let bot_player = PlayerId::new(1 - payload.player); // Asumimos que el bot es el jugador contrario
            let _ = game.add_move(Movement::Placement { player: bot_player, coords: bot_coords });
            bot_moved = Some(bot_coords);
        }
    }

    // 6. Evaluamos cómo ha quedado la partida tras los dos movimientos
    let (status_str, winner) = match game.status() {
        GameStatus::Ongoing { .. } => ("Ongoing", None),
        GameStatus::Finished { winner } => ("Finished", Some(winner.id())),
    };

    let new_yen = YEN::from(&game);

    // 7. Le devolvemos todo a React bien masticado
    Ok(Json(PlayResponse {
        yen: new_yen,
        status: status_str.to_string(),
        winner,
        bot_moved,
    }))
}