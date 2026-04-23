use crate::core::{Coordinates, GameY, PlayerId};
use crate::YBot;
use rand::prelude::IndexedRandom;

use std::cmp::Ordering;
use std::collections::BinaryHeap;

/// Bot "lapa": bot medio
/// Este bot siempre intenta colocar su ficha pegada a una ficha del rival.
/// Prioriza colocar sus fichas al lado de fichas rivales que tengan el menor número de fichas suyas
/// adyacentes, así que primero colocará al lado de fichas del rival sin nada alrededor.
#[derive(Debug, Default)]
pub struct LapaBot;

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
struct WeightedCell {
    coords: Coordinates,
    player_id: PlayerId,
    weight: u32
} 

impl WeightedCell {
    fn new(coords:Coordinates, player_id: PlayerId, weight: u32) -> WeightedCell {
        WeightedCell {coords, player_id, weight}
    }
}

impl Ord for WeightedCell {
    fn cmp(&self, other: &Self) -> Ordering {
        self.weight.cmp(&other.weight)
    }
}

impl PartialOrd for WeightedCell {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}


impl YBot for LapaBot {
    fn name(&self) -> &str {
        "lapabot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
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

        // 4) Puntuar las celdas del rival según el algoritmo descrito en weight_cell
        // y ordenarlas de más prioritarias a menos (más peso, más prioritaria)
        let mut heap = BinaryHeap::new();
        for rival_cell in rival_cells {
            let weighted_cell = weight_cell(rival_cell, board, our_player_id);
            heap.push(weighted_cell);
        }

        // 5) Buscamos la celda rival con más puntuación y que tenga alguna celda adyacente libre.
        // Si no existe ninguna, se hace un movimiento aleatorio.
        for rival_cell in heap {
            let adjacent_coords = rival_cell.coords.get_adjacent_coords();
            // Elegimos la primera celda adyacente libre que encontremos
            let adjacent_free_cell = adjacent_coords.iter().find(|&coord| board.player_at(coord).is_none());
            if let Some(adjacent_free_cords) = adjacent_free_cell {
                return Some(adjacent_free_cords.to_owned());
            }
        }

        // Si no se encontró ninguna celda adyacente libre, elegir una aleatoria
        let cell = available_cells.choose(&mut rand::rng())?;
        let coordinates = Coordinates::from_index(*cell, board.board_size());
        Some(coordinates)
    }
}

// Devuelve el peso de una celda para el algoritmo de LapaBot en una estructura
// WeightedCell.
// El algoritmo de peso es el siguiente:
// Obtener todas las celdas adyacentes válidas
// Empezar con un peso base de 1000 puntos, y restar 50 por cada casilla adyacente colocada por
// nosotros.
// A mayor peso, mejor casilla.
fn weight_cell(cell: Coordinates, board: &GameY, id: PlayerId) -> WeightedCell {
    let our_id = id;
    // Obtener todas las celdas adyacentes válidas
    // Empezamos con una base de 1000 puntos, y restamos 50 por cada casilla adyacente nuestra.
    let mut weight = 1000;
    let adjancet_cells = cell.get_adjacent_coords();
    for cell in adjancet_cells {
        if let Some(id) = board.player_at(&cell) {
            if id == our_id {
                weight -= 50;
            }
        }

    }

    WeightedCell::new(cell,id,weight)
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Movement, PlayerId};

    #[test]
    fn test_bot_name() {
        let bot = LapaBot;
        assert_eq!(bot.name(), "lapabot");
    }

    #[test]
    fn test_bot_returns_move_on_empty_board() {
        let bot = LapaBot;
        let game = GameY::new(5);

        let chosen_move = bot.choose_move(&game);
        assert!(chosen_move.is_some());
    }

    #[test]
    fn test_bot_returns_valid_coordinates() {
        let bot = LapaBot;
        let game = GameY::new(5);

        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());

        // Index should be within the valid range for a size-5 board
        // Total cells = (5 * 6) / 2 = 15
        assert!(index < 15);
    }

    #[test]
    fn test_bot_returns_none_on_full_board() {
        let bot = LapaBot;
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
        let bot = LapaBot;
        let mut game = GameY::new(3);

        // Make some moves to reduce available cells
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 0, 0),
        })
        .unwrap();

        let coords = bot.choose_move(&game).unwrap();
        let index = coords.to_index(game.board_size());

        // The chosen index should be in the available cells
        assert!(game.available_cells().contains(&index));
        // The chosen coords should be next to the player coordinates
        assert_eq!(coords.x(), 1);
        assert_eq!(coords.y(), 0);
        assert_eq!(coords.z(), 1);
    }

    #[test]
    fn test_bot_multiple_calls_return_valid_moves() {
        let bot = LapaBot;
        let game = GameY::new(7);

        for _ in 0..10 {
            let coords = bot.choose_move(&game).unwrap();
            let index = coords.to_index(game.board_size());

            assert!(index < 28);
            assert!(game.available_cells().contains(&index));
        }
    }

    #[test]
    fn test_weighted_cell_creation() {
        let weighted_cell  = WeightedCell::new(Coordinates::new(1,2,3), PlayerId::new(0), 25);
        assert_eq!(weighted_cell.coords.x(), 1);
        assert_eq!(weighted_cell.coords.y(), 2);
        assert_eq!(weighted_cell.coords.z(), 3);
        assert_eq!(weighted_cell.player_id, PlayerId::new(0));
        assert_eq!(weighted_cell.weight, 25);
    }

    #[test]
    fn test_weighted_cell_comparison() {
        let weighted_cell1  = WeightedCell::new(Coordinates::new(1,2,3), PlayerId::new(0), 25);
        let weighted_cell2  = WeightedCell::new(Coordinates::new(1,2,3), PlayerId::new(0), 50);
        assert_eq!(weighted_cell1.cmp(&weighted_cell2), Ordering::Less);
        assert_eq!(weighted_cell2.cmp(&weighted_cell1), Ordering::Greater);
    }
    
}
