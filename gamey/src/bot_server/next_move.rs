use crate::{
    Coordinates, ErrorResponse, GameY, MoveResponse, Movement, PlayerId, YEN, state::AppState,
};

/// Estructura de datos utilizada como entrada para choose_next_move.
/// Requiere la versión de la API del juego, el ID del bot contra el que se juega,
/// el estado actual del juego en formato YEN y el estado general de la aplicación.
pub struct NextMove<'a> {
    /// The API version used for this request.
    pub api_version: String,
    /// The bot that selected this move.
    pub bot_id: String,
    /// The coordinates where the bot chooses to place its piece.
    pub yen: YEN,
    /// The status of the current game.
    pub state: &'a AppState,
}

/// Función auxiliar para calcular el próximo movimiento de un juego.
/// Esta función se utiliza en endpoints que necesiten calcular el siguiente movimiento,
/// como *choose* o *play*.
///
/// # Returns
/// On success, returns a `MoveResponse` with the chosen coordinates.
/// On failure, returns an `ErrorResponse` with details about what went wrong.
pub fn choose_next_move(next_move: NextMove) -> Result<MoveResponse, ErrorResponse> {
    let api_version = next_move.api_version;
    let bot_id = next_move.bot_id;
    let yen = next_move.yen;
    let state = next_move.state;

    let mut game_y = match GameY::try_from(yen) {
        Ok(game) => game,
        Err(err) => {
            return Err(ErrorResponse::error(
                &format!("Invalid YEN format: {}", err),
                Some(api_version),
                Some(bot_id),
            ));
        }
    };
    let bot = match state.bots().find(&bot_id) {
        Some(bot) => bot,
        None => {
            let available_bots = state.bots().names().join(", ");
            return Err(ErrorResponse::error(
                &format!(
                    "Bot not found: {}, available bots: [{}]",
                    bot_id, available_bots
                ),
                Some(api_version),
                Some(bot_id),
            ));
        }
    };

    let coords = match bot.choose_move(&game_y) {
        Some(coords) => coords,
        None => {
            // El tablero está lleno: devolvemos el status actual del juego sin mover
            let response = MoveResponse {
                api_version: api_version,
                bot_id: bot_id,
                coords: Coordinates::new(0, 0, 0), // coords vacías, el frontend debe ignorarlas
                status: game_y.status().clone(),
            };
            return Ok(response);
        }
    };

    // Update the game state with the bot chosen move before returning the response
    let _ = game_y.add_move(Movement::Placement {
        player: PlayerId::new(1),
        coords,
    });

    let response = MoveResponse {
        api_version: api_version,
        bot_id: bot_id,
        coords,
        status: game_y.status().clone(),
    };

    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::GameStatus;
    use crate::PlayerId;
    use crate::RandomBot;
    use crate::YBotRegistry;
    use std::sync::Arc;

    // Prueba: utilizar estado no válido
    #[test]
    fn test_invalid_yen() {
        let yen = YEN::new(3, 0, vec!['B', 'R'], "./..x...".to_string());
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        let next_move = NextMove {
            api_version: "v1".to_string(),
            bot_id: "random_bot".to_string(),
            yen: yen,
            state: &state,
        };

        let response = super::choose_next_move(next_move);

        // Devuelve error tipo "Invalid YEN format"
        assert!(response.is_err());
        assert!(
            response
                .unwrap_err()
                .message
                .starts_with("Invalid YEN format")
        );
    }

    // Prueba: utilizar bot no existente
    #[test]
    fn test_invalid_bot() {
        let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        let next_move = NextMove {
            api_version: "v1".to_string(),
            bot_id: "nonexistent_bot".to_string(),
            yen: yen,
            state: &state,
        };

        let response = super::choose_next_move(next_move);

        // Devuelve error tipo "Bot not found"
        assert!(response.is_err());
        assert!(response.unwrap_err().message.starts_with("Bot not found"));
    }

    // Prueba: enviar siguiente movimiento válido
    #[test]
    fn test_valid_next_move() {
        let yen = YEN::new(3, 0, vec!['B', 'R'], "./../...".to_string());
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        let next_move = NextMove {
            api_version: "v1".to_string(),
            bot_id: "random_bot".to_string(),
            yen: yen,
            state: &state,
        };

        let response = super::choose_next_move(next_move);

        assert!(response.is_ok());

        let status = response.unwrap().status;
        match status {
            GameStatus::Ongoing { next_player } => {
                assert_eq!(next_player, PlayerId::new(0));
            }
            _ => panic!("El juego debería seguir en progreso."),
        }
    }

    // Prueba: enviar movimiento válido cuando el juego está terminado
    #[test]
    fn test_valid_move_game_finishded() {
        let yen = YEN::new(3, 0, vec!['B', 'R'], "R/BB/RBR".to_string());
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        let next_move = NextMove {
            api_version: "v1".to_string(),
            bot_id: "random_bot".to_string(),
            yen: yen,
            state: &state,
        };

        let response = super::choose_next_move(next_move);

        assert!(response.is_ok());

        let status = response.unwrap().status;
        match status {
            GameStatus::Finished { winner } => {
                assert_eq!(winner, PlayerId::new(0));
            }
            _ => panic!("El juego debería estar finalizado."),
        }
    }
}
