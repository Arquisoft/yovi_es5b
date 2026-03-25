use crate::{
    MoveResponse, check_api_version, error::ErrorResponse,
    next_move::NextMove, next_move::choose_next_move, state::AppState,
};
use axum::{
    Json,
    extract::{Path, Query, State},
};
use serde::{Deserialize};

// Parámetros de consulta de la URL para play
#[derive(Deserialize)]
pub struct PlayQueryParams {
    // Formato YEN para el turno del juego codificado como URL
    position: String,
    // ID del bot contra el que jugar
    bot_id: Option<String>,
    // Estrategia del bot a utiliazr
    strategy: Option<String>,
}

// Parámetros de ruta  de la URL para play
#[derive(Deserialize)]
pub struct PlayPathParams {
    // Versión de la API que utilizar
    api_version: String,
}

/// Endpoint play para bots
///
/// Este endpoint recibe la jugada como parámetro de consulta position en formato YEN y devuelve la 
/// siguiente jugada en formato YEN.
///
/// # Route
/// `GET /{api_version}/play
///
/// # Parámetros
/// - position: jugada en formato YEN codificada como URL.
/// - bot_id: opcional, bot contra el que jugar (por defecto: random_bot)
/// - strategy: opcional, estrategia del bot contra el que jugar.
///
/// # Response
/// On success, returns a `MoveResponse` with the chosen coordinates.
/// On failure, returns an `ErrorResponse` with details about what went wrong.
#[axum::debug_handler]
pub async fn play(
    State(state): State<AppState>,
    Query(params): Query<PlayQueryParams>,
    Path(path): Path<PlayPathParams>,
) -> Result<Json<MoveResponse>, Json<ErrorResponse>> {
    check_api_version(&path.api_version)?;
    let yen = match serde_json::from_str(&params.position) {
        Ok(yen) => Ok(yen),
        Err(err) => 
            Err(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                Some(path.api_version.to_owned()),
                Some(params.bot_id.to_owned().unwrap_or(String::from("random_bot")))
            ))
        
    }?;

    // TODO implementar selector de estrategia
    println!("Estrategia seleccionada: {}", params.strategy.unwrap_or(String::from("normal")));

    // Calcular el siguiente movimiento y devolverlo como JSON
    let next_move = NextMove {
        api_version: path.api_version.to_owned(),
        bot_id: params.bot_id.to_owned().unwrap_or(String::from("random_bot")),
        yen: yen,
        state: &state,
    };
    let move_result = choose_next_move(next_move);
    return move_result.map(|r| Json(r)).map_err(|r| Json(r));
}

