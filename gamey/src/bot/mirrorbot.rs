use crate::core::{Coordinates, GameY};
use crate::bot::bot_helper;
use crate::YBot;
use rand::prelude::IndexedRandom;

/// Bot "espejo": bot fácil
/// Este bot intenta llenar el tablero espejando los movimientos del rival.
/// Si no hay ningún movimiento espejable, realiza un movimiento aleatorio.
#[derive(Debug, Default)]
pub struct MirrorBot;


impl YBot for MirrorBot {
    fn name(&self) -> &str {
        "mirrorbot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let game_data = match bot_helper::get_basic_game_data(board) {
            Some(data) => data,
            None => return None
        };

        let available_cells = game_data.available_cells;
        let rival_cells = game_data.rival_cells;

        // 4) Recorrer las celdas rivales y guardar las que no estén espejadas.
        let mut non_mirrored_cells = Vec::new();
        for rival_cell in rival_cells {
            let mirrored_coords = rival_cell.get_mirrored_coords();
            if board.player_at(&mirrored_coords).is_none() {
                non_mirrored_cells.push(mirrored_coords);
            }
        }

        // 5) Espejamos la primera celda que no esté espejada.
        // En caso de que no existan celdas sin espejar, realiza movimiento aleatorio.
        
        for cell in non_mirrored_cells {
            return Some(cell);
        }

        // Si no se encontró ninguna celda adyacente libre (que no debería ser el caso), elegir una aleatoria
        let cell = available_cells.choose(&mut rand::rng())?;
        let coordinates = Coordinates::from_index(*cell, board.board_size());
        Some(coordinates)
    }
}



#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Movement, PlayerId};

    #[test]
    fn test_bot_name() {
        let bot = MirrorBot;
        assert_eq!(bot.name(), "mirrorbot");
    }

    #[test]
    fn test_bot_returns_move_on_empty_board() {
        let bot = MirrorBot;
        let game = GameY::new(5);

        let chosen_move = bot.choose_move(&game);
        assert!(chosen_move.is_some());
    }

    #[test]
    fn test_bot_returns_valid_coordinates() {
        let bot = MirrorBot;
        let game = GameY::new(5);

        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());

        // Index should be within the valid range for a size-5 board
        // Total cells = (5 * 6) / 2 = 15
        assert!(index < 15);
    }

    #[test]
    fn test_bot_returns_none_on_full_board() {
        let bot = MirrorBot;
        let mut game = GameY::new(2);

        // Fill the board (size 2 has 3 cells)
        let moves = vec![
            Movement::Placement {
                player: PlayerId::new(0),
                coords: Coordinates::new(1, 0, 0),
            },
            Movement::Placement {
                player: PlayerId::new(1),
                coords: Coordinates::new(0, 1, 0),
            },
            Movement::Placement {
                player: PlayerId::new(0),
                coords: Coordinates::new(0, 0, 1),
            },
        ];

        for mv in moves {
            game.add_move(mv).unwrap();
        }

        // Board is now full
        assert!(game.available_cells().is_empty());
        let chosen_move = bot.choose_move(&game);
        assert!(chosen_move.is_none());
    }

    #[test]
    fn test_bot_chooses_from_available_cells() {
        let bot = MirrorBot;
        let mut game = GameY::new(5);

        // Make some moves to reduce available cells
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 2, 0),
        })
        .unwrap();

        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());

        // The chosen index should be in the available cells
        assert!(game.available_cells().contains(&index));
        // The chosen coords should be the mirrored coords
        assert_eq!(coords.x(), 2);
        assert_eq!(coords.y(), 0);
        assert_eq!(coords.z(), 2);
    }

    #[test]
    fn test_bot_multiple_calls_return_valid_moves() {
        let bot = MirrorBot;
        let game = GameY::new(7);

        for _ in 0..10 {
            let coords = bot.choose_move(&game).unwrap();
            let index = coords.to_index(game.board_size());

            assert!(index < 28);
            assert!(game.available_cells().contains(&index));
        }
    }
}
