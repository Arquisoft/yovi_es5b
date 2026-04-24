/// Clase de utilidad para funciones relacionadas con la programación de los bots.
use crate::core::{Coordinates, PlayerId, GameY};

// Estructura de datos que contiene información básica común relativa a una partida.
pub struct GameData<'a> {
    // Vector con los índices de las celdas disponibles.
    pub available_cells:  &'a Vec<u32>,
    // Vector con las coordenadas de las celdas rivales.
    pub rival_cells: Vec<Coordinates>,
    // ID del bot durante la partida.
    pub player_bot_id: PlayerId
}

// Devuelve la información básica de la partida asociada al tablero, de tipo Option<GameData>.
// Si no se puede obtener esta información parcial o totalmente, devuelve None.
pub fn get_basic_game_data(board: &GameY) -> Option<GameData<'_>> {

    // 1) Obtener celdas libres
    let available_cells = board.available_cells();
    if available_cells.is_empty() {
        return None;
    }

    // 2) Obtener el ID de jugador del bot
    let board_size = board.board_size();
    let our_player_id = match board.next_player() {
        Some(id) => id,
        None => return None,
    };

    // 3) Obtener las celdas del rival
    let mut rival_cells = Vec::new();
    for idx in 0..board.total_cells() {
        let coords = Coordinates::from_index(idx, board_size);
        if let Some(player_id) = board.player_at(&coords) {
            if player_id != our_player_id {
                rival_cells.push(coords);
            } 
        }
    }

    return Some(GameData {available_cells, rival_cells, player_bot_id: our_player_id});
}
