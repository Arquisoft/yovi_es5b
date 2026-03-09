use crate::core::{Coordinates, GameY};
use crate::YBot;
use rand::prelude::IndexedRandom;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Path {
    DescendX,
    DescendY,
    DescendZ,
}

// Estructura totalmente stateless (sin estado). 
// No hay Mutex ni memoria que se corrompa en partidas simultáneas web.
#[derive(Debug, Default)]
pub struct PiramidBot;

impl YBot for PiramidBot {
    fn name(&self) -> &str {
        "piramid_bot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None;
        }

        let board_size = board.board_size();
        let mut rng = rand::rng();

        // Identificar quiénes somos
        let my_player_id = match board.next_player() {
            Some(id) => id,
            None => return None,
        };

        // Escanear el tablero de forma eficiente usando el nuevo método
        let mut my_pieces = Vec::new();
        for idx in 0..board.total_cells() {
            let coords = Coordinates::from_index(idx, board_size);
            if board.player_at(&coords) == Some(my_player_id) {
                my_pieces.push(coords);
            }
        }

        // Deducir la estrategia en base a las piezas colocadas
        let path = if my_pieces.is_empty() {
            // Primer turno del bot: elige dirección al azar
            let paths = [Path::DescendX, Path::DescendY, Path::DescendZ];
            *paths.choose(&mut rng).unwrap()
        } else {
            // Analiza sus propias piezas para saber qué ruta está conquistando
            let max_x = my_pieces.iter().map(|c| c.x()).max().unwrap_or(0);
            let max_y = my_pieces.iter().map(|c| c.y()).max().unwrap_or(0);
            let max_z = my_pieces.iter().map(|c| c.z()).max().unwrap_or(0);

            if max_x >= max_y && max_x >= max_z {
                Path::DescendX
            } else if max_y >= max_x && max_y >= max_z {
                Path::DescendY
            } else {
                Path::DescendZ
            }
        };

        // Preparar coordenadas disponibles
        let available_coords: Vec<Coordinates> = available_cells
            .iter()
            .map(|&idx| Coordinates::from_index(idx, board_size))
            .collect();

        // Buscar nivel más alto libre e intentar colocar
        for level in (0..board_size).rev() {
            let candidates: Vec<Coordinates> = match path {
                Path::DescendX => available_coords.iter().filter(|c| c.x() == level).copied().collect(),
                Path::DescendY => available_coords.iter().filter(|c| c.y() == level).copied().collect(),
                Path::DescendZ => available_coords.iter().filter(|c| c.z() == level).copied().collect(),
            };

            if !candidates.is_empty() {
                return candidates.choose(&mut rng).copied();
            }
        }

        // Sistema de seguridad: si la ruta elegida se bloquea por completo,
        // coge cualquier celda libre para no colgar el servidor.
        available_coords.choose(&mut rng).copied()
    }
}