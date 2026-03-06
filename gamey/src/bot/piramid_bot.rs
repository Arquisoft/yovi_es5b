use crate::core::{Coordinates, GameY};
use crate::YBot;
use rand::prelude::IndexedRandom;
use std::sync::Mutex;

// Definimos las 3 direcciones posibles en las que el bot puede decidir "bajar".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Path {
    DescendX,
    DescendY,
    DescendZ,
}

// Esta es la "memoria" del bot. 
// Guarda qué camino eligió y en qué piso de la pirámide está trabajando.
#[derive(Debug, Clone, Copy)]
struct BotStatus {
    path: Path,      // La dirección elegida (X, Y o Z).
    target_level: i32, // El nivel (fila) donde quiere poner la ficha ahora.
}

// Estructura principal del Bot.
#[derive(Debug, Default)]
pub struct PiramidBot {
    // El "Mutex" es como una caja fuerte. Permite que el bot modifique su memoria
    // (el nivel y la ruta) de forma segura mientras el juego consulta su movimiento.
    state: Mutex<Option<BotStatus>>,
}

impl YBot for PiramidBot {
    // El nombre con el que el sistema reconoce a este bot.
    fn name(&self) -> &str {
        "piramid_bot"
    }

    // Aquí es donde el bot decide su próximo movimiento cada turno.
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        // 1. Mirar qué huecos hay libres en el tablero.
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None; // Si no hay sitio, no puede mover.
        }

        let board_size = board.board_size();
        let mut rng = rand::rng();

        // 2. Abrir la "caja fuerte" de la memoria.
        let mut state_lock = self.state.lock().unwrap();
        
        // 3. Si es la primera vez que juega, elige una ruta al azar y apunta a la cima.
        let current_state = state_lock.get_or_insert_with(|| {
            let paths = [Path::DescendX, Path::DescendY, Path::DescendZ];
            BotStatus {
                path: *paths.choose(&mut rng).unwrap(),
                target_level: (board_size as i32) - 1, // Empezar en la pica más alta.
            }
        });

        // 4. Traducir los huecos libres a coordenadas espaciales (X, Y, Z).
        let available_coords: Vec<Coordinates> = available_cells
            .iter()
            .map(|&idx| Coordinates::from_index(idx, board_size as u32))
            .collect();

        let mut move_to_make = None;
        let mut level_to_check = current_state.target_level;

        // 5. LÓGICA DE DESCENSO:
        // Intentamos encontrar un hueco en el nivel que nos toca.
        // Si ese nivel está lleno, bajamos al siguiente inmediatamente.
        let mut attempts = 0;
        while move_to_make.is_none() && attempts < board_size {
            // Filtramos las casillas libres que coinciden con nuestro "piso" actual.
            let candidates: Vec<Coordinates> = match current_state.path {
                Path::DescendX => available_coords.iter().filter(|c| c.x() as i32 == level_to_check).copied().collect(),
                Path::DescendY => available_coords.iter().filter(|c| c.y() as i32 == level_to_check).copied().collect(),
                Path::DescendZ => available_coords.iter().filter(|c| c.z() as i32 == level_to_check).copied().collect(),
            };

            if !candidates.is_empty() {
                // Si hay huecos en este nivel, elegimos uno al azar.
                move_to_make = candidates.choose(&mut rng).copied();
                
                // Preparamos la memoria para el PRÓXIMO turno: bajar un escalón.
                current_state.target_level = level_to_check - 1;
                
                // Si ya estábamos en el suelo (nivel 0), volvemos a la cima.
                if current_state.target_level < 0 {
                    current_state.target_level = (board_size as i32) - 1;
                }
            } else {
                // Si el nivel está bloqueado o lleno, bajamos un piso y volvemos a intentar.
                level_to_check -= 1;
                if level_to_check < 0 {
                    level_to_check = (board_size as i32) - 1;
                }
                attempts += 1; // Contador para no buscar eternamente si el tablero se llena.
            }
        }

        // 6. Entregar la coordenada elegida al motor del juego.
        move_to_make
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Movement, GameY};
    use crate::PlayerId; // Importación sugerida por el compilador

    #[test]
    fn test_piramid_bot_name() {
        let bot = PiramidBot::default();
        assert_eq!(bot.name(), "piramid_bot");
    }

    #[test]
    fn test_chooses_a_valid_move_on_non_empty_board() {
        let bot = PiramidBot::default();
        let mut game = GameY::new(5);

        // Oponente hace un movimiento
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 1, 2),
        })
        .unwrap();

        // El bot debe elegir un movimiento válido
        let chosen_move = bot.choose_move(&game).unwrap();
        let is_available = game
            .available_cells()
            .contains(&chosen_move.to_index(game.board_size()));
        assert!(is_available, "El bot eligió una casilla no disponible.");
    }

    #[test]
    fn test_piramid_bot_returns_none_on_full_board() {
        let bot = PiramidBot::default();
        let mut game = GameY::new(1); // Tablero de 1 celda

        // Llenar el tablero
        game.add_move(Movement::Placement { 
            player: PlayerId::new(0), 
            coords: Coordinates::new(0, 0, 0) 
        }).unwrap();

        assert!(game.available_cells().is_empty());
        let chosen_move = bot.choose_move(&game);
        assert!(chosen_move.is_none());
    }

    #[test]
    fn test_first_move_starts_at_peak() {
        let bot = PiramidBot::default();
        let board_size = 4;
        let game = GameY::new(board_size);
        
        let chosen_move = bot.choose_move(&game).expect("Debe elegir un movimiento en un tablero vacío");
        let state = bot.state.lock().unwrap().unwrap();
        let expected_peak = 3;
        
        match state.path {
            Path::DescendX => assert_eq!(chosen_move.x() as i32, expected_peak, "Debe empezar en X máximo"),
            Path::DescendY => assert_eq!(chosen_move.y() as i32, expected_peak, "Debe empezar en Y máximo"),
            Path::DescendZ => assert_eq!(chosen_move.z() as i32, expected_peak, "Debe empezar en Z máximo"),
        }
    }

    #[test]
    fn test_descends_level_by_level_and_wraps_around() {
        let bot = PiramidBot::default();
        let board_size = 3;
        let game = GameY::new(board_size); 
        
        let move1 = bot.choose_move(&game).unwrap();
        let path = bot.state.lock().unwrap().unwrap().path;
        assert_coordinate_level(&move1, path, 2);
        
        let move2 = bot.choose_move(&game).unwrap();
        assert_coordinate_level(&move2, path, 1);
        
        let move3 = bot.choose_move(&game).unwrap();
        assert_coordinate_level(&move3, path, 0);
        
        let move4 = bot.choose_move(&game).unwrap();
        assert_coordinate_level(&move4, path, 2);
    }

    fn assert_coordinate_level(coords: &Coordinates, path: Path, expected_level: i32) {
        let actual_level = match path {
            Path::DescendX => coords.x() as i32,
            Path::DescendY => coords.y() as i32,
            Path::DescendZ => coords.z() as i32,
        };
        assert_eq!(
            actual_level, expected_level, 
            "El bot eligió el nivel {}, pero se esperaba el {}", 
            actual_level, expected_level
        );
    }
}