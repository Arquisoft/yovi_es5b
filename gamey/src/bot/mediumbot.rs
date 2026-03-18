use crate::core::{Coordinates, GameY};
use crate::YBot;
use rand::prelude::IndexedRandom;

#[derive(Debug, Default)]
pub struct MediumBot;

fn are_neighbors(c1: &Coordinates, c2: &Coordinates) -> bool {
    let dx = (c1.x() as i32 - c2.x() as i32).abs();
    let dy = (c1.y() as i32 - c2.y() as i32).abs();
    let dz = (c1.z() as i32 - c2.z() as i32).abs();
    dx + dy + dz == 2
}

impl YBot for MediumBot {
    fn name(&self) -> &str {
        "mediumbot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None;
        }

        let board_size = board.board_size();
        let mut rng = rand::rng();

        let my_player_id = match board.next_player() {
            Some(id) => id,
            None => return None,
        };

        let mut my_pieces = Vec::new();
        for idx in 0..board.total_cells() {
            let coords = Coordinates::from_index(idx, board_size);
            if board.player_at(&coords) == Some(my_player_id) {
                my_pieces.push(coords);
            }
        }

        // Deducir qué lados nos faltan por tocar
        let touched_x = my_pieces.iter().any(|c| c.x() == 0);
        let touched_y = my_pieces.iter().any(|c| c.y() == 0);
        let touched_z = my_pieces.iter().any(|c| c.z() == 0);

        let mut best_score = -1;
        let mut best_candidates: Vec<Coordinates> = Vec::new();

        // Evaluar absolutamente todas las celdas disponibles
        for &idx in available_cells {
            let cell = Coordinates::from_index(idx, board_size);
            
            // 1. PUNTUACIÓN BASE: Centralidad matemática
            let unbalance = (cell.x() as i32 - cell.y() as i32).abs()
                          + (cell.y() as i32 - cell.z() as i32).abs()
                          + (cell.z() as i32 - cell.x() as i32).abs();
            
            let mut score = 1000 - unbalance;

            // 2. PUNTUACIÓN TÁCTICA: Proximidad a los bordes objetivo
            if !touched_x { score += (board_size - cell.x()) as i32 * 10; }
            if !touched_y { score += (board_size - cell.y()) as i32 * 10; }
            if !touched_z { score += (board_size - cell.z()) as i32 * 10; }

            // 3. MULTIPLICADOR DE CONEXIÓN: Prioridad absoluta
            let is_adj = my_pieces.iter().any(|p| are_neighbors(&cell, p));
            if is_adj {
                score += 5000;
            }

            // Actualizar el ranking
            if score > best_score {
                best_score = score;
                best_candidates.clear();
                best_candidates.push(cell);
            } else if score == best_score {
                best_candidates.push(cell);
            }
        }

        best_candidates.choose(&mut rng).copied()
    }
}