use crate::core::{Coordinates, GameY};
use crate::YBot;
use rand::prelude::IndexedRandom;

// Bot intermedio orientado a expansion directa:
// abre en centro y luego crece por frontera hacia paredes faltantes.
#[derive(Debug, Default)]
pub struct MediumBot;

// Representa las tres paredes objetivo del tablero triangular.
#[derive(Clone, Copy)]
enum Side {
    X,
    Y,
    Z,
}

// En coordenadas cubicas, dos celdas son vecinas si |dx|+|dy|+|dz| = 2.
fn are_neighbors(c1: &Coordinates, c2: &Coordinates) -> bool {
    let dx = (c1.x() as i32 - c2.x() as i32).abs();
    let dy = (c1.y() as i32 - c2.y() as i32).abs();
    let dz = (c1.z() as i32 - c2.z() as i32).abs();
    dx + dy + dz == 2
}

// Puntua que tan centrada esta una celda; se usa solo en la apertura.
fn center_metric(c: &Coordinates) -> i32 {
    1000 - ((c.x() as i32 - c.y() as i32).abs()
        + (c.y() as i32 - c.z() as i32).abs()
        + (c.z() as i32 - c.x() as i32).abs())
}

// Distancia directa de una celda a la pared indicada.
fn distance_to_side(cell: &Coordinates, side: Side) -> i32 {
    match side {
        Side::X => cell.x() as i32,
        Side::Y => cell.y() as i32,
        Side::Z => cell.z() as i32,
    }
}

// Mide cuan recto es el avance hacia una pared concreta.
// Menor valor implica menos desvio lateral.
fn straightness_to_side(cell: &Coordinates, side: Side) -> i32 {
    match side {
        Side::X => (cell.y() as i32 - cell.z() as i32).abs(),
        Side::Y => (cell.x() as i32 - cell.z() as i32).abs(),
        Side::Z => (cell.x() as i32 - cell.y() as i32).abs(),
    }
}

// Obtiene la mejor puntuacion hacia cualquier pared faltante.
// Prioriza acercarse a la pared y, en empate, mantener linea recta.
fn best_missing_side_score(cell: &Coordinates, missing_sides: &[Side]) -> i32 {
    missing_sides
        .iter()
        .map(|&side| {
            let dist = distance_to_side(cell, side);
            let line = straightness_to_side(cell, side);
            // Primero cercania a pared faltante; luego trayectoria recta.
            -(dist * 100 + line * 10)
        })
        .max()
        .unwrap_or(i32::MIN)
}

impl YBot for MediumBot {
    fn name(&self) -> &str {
        "mediumbot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        // 1) Obtener celdas libres; sin jugadas legales no hay movimiento.
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None;
        }

        let board_size = board.board_size();

        // 2) Identificar al jugador activo del turno.
        let my_player_id = match board.next_player() {
            Some(id) => id,
            None => return None,
        };

        // 3) Recolectar todas las fichas propias para construir la frontera.
        let mut my_pieces = Vec::new();
        for idx in 0..board.total_cells() {
            let coords = Coordinates::from_index(idx, board_size);
            if board.player_at(&coords) == Some(my_player_id) {
                my_pieces.push(coords);
            }
        }

        // 4) Apertura: primer turno siempre al centro disponible.
        if my_pieces.is_empty() {
            let best_center_score = available_cells
                .iter()
                .map(|&idx| {
                    let c = Coordinates::from_index(idx, board_size);
                    center_metric(&c)
                })
                .max()
                .unwrap_or(i32::MIN);

            return available_cells
                .iter()
                .map(|&idx| Coordinates::from_index(idx, board_size))
                .filter(|c| center_metric(c) == best_center_score)
                .min_by_key(|c| c.to_index(board_size));
        }

        // 5) Calcular paredes ya tocadas y pendientes.
        let touched_x = my_pieces.iter().any(|c| c.x() == 0);
        let touched_y = my_pieces.iter().any(|c| c.y() == 0);
        let touched_z = my_pieces.iter().any(|c| c.z() == 0);

        let mut missing_sides = Vec::new();
        if !touched_x {
            missing_sides.push(Side::X);
        }
        if !touched_y {
            missing_sides.push(Side::Y);
        }
        if !touched_z {
            missing_sides.push(Side::Z);
        }

        // Si ya se tocan las 3 paredes, mantener crecimiento contiguo estable.
        if missing_sides.is_empty() {
            let best_neighbor = available_cells
                .iter()
                .map(|&idx| Coordinates::from_index(idx, board_size))
                .filter(|cell| my_pieces.iter().any(|p| are_neighbors(cell, p)))
                .min_by_key(|c| c.to_index(board_size));

            if best_neighbor.is_some() {
                return best_neighbor;
            }

            // Respaldo raro: si no hay vecinos detectables, elegir cualquier libre.
            let mut rng = rand::rng();
            let non_neighbors: Vec<Coordinates> = available_cells
                .iter()
                .map(|&idx| Coordinates::from_index(idx, board_size))
                .filter(|cell| !my_pieces.iter().any(|p| are_neighbors(cell, p)))
                .collect();

            if !non_neighbors.is_empty() {
                return non_neighbors.choose(&mut rng).copied();
            }

            return available_cells
                .iter()
                .map(|&idx| Coordinates::from_index(idx, board_size))
                .collect::<Vec<_>>()
                .choose(&mut rng)
                .copied();
        }

        // 6) Frontera: solo se evalua expansion en celdas contiguas a la red.
        let frontier: Vec<Coordinates> = available_cells
            .iter()
            .map(|&idx| Coordinates::from_index(idx, board_size))
            .filter(|cell| my_pieces.iter().any(|p| are_neighbors(cell, p)))
            .collect();

        let candidates: Vec<Coordinates> = if frontier.is_empty() {
            // Respaldo raro: si no hay frontera detectable, evaluar todo libre.
            available_cells
                .iter()
                .map(|&idx| Coordinates::from_index(idx, board_size))
                .collect()
        } else {
            frontier
        };

        let mut best_score = i32::MIN;
        let mut best_candidates: Vec<Coordinates> = Vec::new();

        for cell in candidates {
            // 7) Score final: direccion a pared faltante + soporte contiguo.
            let side_score = best_missing_side_score(&cell, &missing_sides);
            let contiguous_support = my_pieces.iter().filter(|p| are_neighbors(&cell, p)).count() as i32;
            let score = side_score + contiguous_support * 3;

            // Actualizar el ranking
            if score > best_score {
                best_score = score;
                best_candidates.clear();
                best_candidates.push(cell);
            } else if score == best_score {
                best_candidates.push(cell);
            }
        }

        best_candidates
            .into_iter()
            // Desempate estable para que el bot no sea aleatorio en igualdad.
            .min_by_key(|c| c.to_index(board_size))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Movement, PlayerId};

    /* GUÍA VISUAL DE ÍNDICES (Tamaño 5)
       Para facilitar la lectura de los tests:
               0
             1   2
           3   4   5
         6   7   8   9
       10  11  12  13  14
    */

    /// Genera tableros mediante un mapa visual ASCII.
    /// '0' = Bot, '1' = Humano, '.' = Vacío
    fn setup_test_board(size: u32, map: &str) -> GameY {
        let mut game = GameY::new(size);
        let clean_map: String = map.chars().filter(|c| !c.is_whitespace()).collect();
        for (i, char) in clean_map.chars().enumerate() {
            if i >= game.total_cells() as usize { break; }
            let coords = Coordinates::from_index(i as u32, size);
            let player = match char {
                '0' => Some(PlayerId::new(0)),
                '1' => Some(PlayerId::new(1)),
                _ => None,
            };
            if let Some(p) = player {
                game.add_move(Movement::Placement { player: p, coords }).expect("Error inyectando ficha");
            }
        }
        game
    }

    // Prueba: nombre del bot
    #[test]
    fn test_medium_bot_name() {
        let bot = MediumBot;
        assert_eq!(bot.name(), "mediumbot");
    }

    // Prueba: bot elige casilla central al estar el tablero vacío
    #[test]
    fn test_medium_bot_pick_center_on_empty_board() {
        let bot = MediumBot;
        let board_map = "
            .
           . .
          . . .
         . . . .
        . . . . .
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover").to_index(5);

        let valid_chosen = [4, 7, 8];
        assert!(
            valid_chosen.contains(&chosen),
            "FALLO: El bot debería escoger una casilla central para empezar, pero eligió: {}", chosen
        );
    }

    // Prueba: bot elige casilla unida al centro cuando ya tiene el centro seleccionado
    #[test]
    fn test_medium_bot_pick_touching_center_on_not_empty_board() {
        let bot = MediumBot;
        let board_map = "
            .
           . .
          . 0 .
         . . . .
        . . . . .
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover").to_index(5);

        let valid_chosen = [1, 2, 3, 5, 7, 8];
        assert!(
            valid_chosen.contains(&chosen),
            "FALLO: El bot debería escoger una casilla unida al centro, pero eligió: {}", chosen
        );
    }

    // Prueba: bot elige casilla cercana a pared faltante cuando ya tiene piezas en el tablero
    #[test]
    fn test_medium_bot_pick_near_missing_wall_on_not_empty_board() {
        let bot = MediumBot;
        let board_map = "
              .
             . .
            . . .
           . 0 . .
          . . 0 . .
         . . . . . .
        . . . . 1 1 1
        ";
        let game = setup_test_board(7, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover").to_index(7);

        let valid_chosen = [3, 6];
        assert!(
            valid_chosen.contains(&chosen),
            "FALLO: El bot debería escoger una casilla colindante a las ya tomadas, lo mas cercanas al borde, pero eligió: {}", chosen
        );
    }

    // Prueba: bot elige casilla random cuando no tiene ninguna colindante a las ya tomadas
    #[test]
    fn test_medium_bot_pick_random_when_no_adjacent_cells() {
        let bot = MediumBot;
        let board_map = "
              .
             . .
            . . .
           . 1 1 .
          . 1 0 1 .
         . . 1 1 . .
        . . . . . . .
        ";
        let game = setup_test_board(7, board_map);
        let chosen = bot.choose_move(&game);

        assert!(chosen.is_some(), "FALLO: El bot debería escoger una casilla, pero no eligió ninguna");
    }

    // Prueba: bot no elige movimiento cuando el tablero está lleno
    #[test]
    fn test_medium_bot_returns_none_on_full_board() {
        let bot = MediumBot;
        let board_map = "
         1
        0 0
        ";
        let game = setup_test_board(2, board_map);

        assert!(game.available_cells().is_empty());
        let chosen_move = bot.choose_move(&game);
        assert!(chosen_move.is_none());
    }
}
