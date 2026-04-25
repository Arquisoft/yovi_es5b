use crate::core::{Coordinates, GameStatus, GameY, PlayerId, Movement};
use crate::YBot;
use rand::prelude::*;

// BridgeBot aplica una estrategia por prioridades estrictas.
// 1) Victoria inmediata.
// 2) Bloqueo de derrota inmediata.
// 3) Reparación de puentes cortados.
//    Modo saltos hasta tocar las 3 paredes.
//    Modo rellenar puentes cuando ya tocó las 3 paredes.
#[derive(Debug, Default)]
pub struct BridgeBot {
    // Si se habilita, el bot no priorizará tanto el reparar puentes cortados
    lax_repair: bool
}

impl BridgeBot {
    // Devuelve una instancia de BridgeBot con la variante de reparación de puentes laxa
    pub fn lax_repair_mode() -> BridgeBot {
        Self {lax_repair: true}
    }
}

// Distancia hexagonal entre dos celdas del tablero.
// Distancia 1 = adyacente, distancia 2 = salto de puente.
fn hex_distance(c1: &Coordinates, c2: &Coordinates) -> i32 {
    // En coordenadas cúbicas de hexágonos, la distancia se calcula
    // como (|dx| + |dy| + |dz|) / 2.
    let dx = (c1.x() as i32 - c2.x() as i32).abs();
    let dy = (c1.y() as i32 - c2.y() as i32).abs();
    let dz = (c1.z() as i32 - c2.z() as i32).abs();
    (dx + dy + dz) / 2
}

// Cuenta cuántas intermedias libres existen entre dos fichas a distancia 2.
// 2 = puente fuerte, 1 = puente cortado, 0 = puente imposible.
fn count_bridge_paths(piece1: &Coordinates, piece2: &Coordinates, board: &GameY) -> i32 {
    let mut bridge_count = 0;
    for idx in 0..board.total_cells() {
        let candidate = Coordinates::from_index(idx, board.board_size());
        // Solo nos importan intermedias vacías: una ocupada no sirve como paso.
        if board.player_at(&candidate).is_some() { continue; }
        // Una intermedia válida debe tocar a ambas piezas a distancia 1.
        if hex_distance(piece1, &candidate) == 1 && hex_distance(&candidate, piece2) == 1 {
            bridge_count += 1;
        }
    }
    bridge_count
}

// Métrica de centralidad para desempatar candidatas.
fn center_metric(c: &Coordinates) -> i32 {
    // Cuanto más equilibradas son (x,y,z), más cerca del centro está la celda.
    // Restamos a 1000 para que "más central" sea "más puntuación".
    1000 - ((c.x() as i32 - c.y() as i32).abs()
        + (c.y() as i32 - c.z() as i32).abs()
        + (c.z() as i32 - c.x() as i32).abs())
}

// Indica qué paredes toca un conjunto de fichas y cuántas son en total.
fn touches_all_sides(pieces: &[Coordinates]) -> (bool, bool, bool, i32) {
    // En Y, tocar una pared equivale a tener al menos una ficha con esa coordenada en 0.
    let tx = pieces.iter().any(|c| c.x() == 0);
    let ty = pieces.iter().any(|c| c.y() == 0);
    let tz = pieces.iter().any(|c| c.z() == 0);
    let count = (tx as i32) + (ty as i32) + (tz as i32);
    (tx, ty, tz, count)
}

// Heurística para avanzar hacia paredes que aún no se tocaron.
fn border_progress(cell: &Coordinates, tx: bool, ty: bool, tz: bool) -> i32 {
    let mut score = 0;
    // Premio grande por tocar inmediatamente una pared aún pendiente.
    if !tx && cell.x() == 0 {
        score += 10_000;
    }
    if !ty && cell.y() == 0 {
        score += 10_000;
    }
    if !tz && cell.z() == 0 {
        score += 10_000;
    }

    // Premio suave por acercarse a paredes faltantes aunque todavía no se toquen.
    // Cuanto más pequeña la coordenada, más cerca de la pared.
    if !tx {
        score += (1_000 - cell.x() as i32 * 10).max(0);
    }
    if !ty {
        score += (1_000 - cell.y() as i32 * 10).max(0);
    }
    if !tz {
        score += (1_000 - cell.z() as i32 * 10).max(0);
    }
    score
}

// Desempata entre candidatas por centralidad y luego por índice de la celda.
fn pick_best_with_tie_break(candidates: Vec<Coordinates>, board_size: u32) -> Option<Coordinates> {
    if candidates.is_empty() {
        return None;
    }
    let mut rng = rand::rng();

    // 1) Mantener solo las más centrales.
    let best_score = candidates
        .iter()
        .map(center_metric)
        .max()
        .unwrap_or(-1);

    let best: Vec<Coordinates> = candidates
        .into_iter()
        .filter(|c| center_metric(c) == best_score)
        .collect();

    if best.len() == 1 {
        return best.first().copied();
    }

    // 2) Si aún hay empate, escoger el índice más bajo para estabilidad.
    let min_index = best
        .iter()
        .map(|c| c.to_index(board_size))
        .min()
        .unwrap_or(0);

    let stable: Vec<Coordinates> = best
        .into_iter()
        .filter(|c| c.to_index(board_size) == min_index)
        .collect();

    // 3) Si persistiera empate (caso raro), elegir aleatorio entre equivalentes exactos.
    stable.choose(&mut rng).copied()
}

// Simula una jugada y comprueba si gana inmediatamente.
fn is_immediate_winning_move(board: &GameY, player: crate::PlayerId, cell: Coordinates) -> bool {
    let mut simulated = board.clone();
    let movement = Movement::Placement {
        player,
        coords: cell,
    };

    if simulated.add_move(movement).is_err() {
        return false;
    }

    match simulated.status() {
        GameStatus::Finished { winner } => *winner == player,
        GameStatus::Ongoing { .. } => false,
    }
}

// Devuelve todas las casillas legales que son victoria inmediata.
fn immediate_winning_moves(board: &GameY, player: crate::PlayerId, available: &[Coordinates]) -> Vec<Coordinates> {
    // Recorremos el tablero real para no depender de posibles desfases
    // entre el estado y la lista `available` recibida.
    let mut winning = Vec::new();
    for idx in 0..board.total_cells() {
        let cell = Coordinates::from_index(idx, board.board_size());
        if board.player_at(&cell).is_some() {
            continue;
        }
        if is_immediate_winning_move(board, player, cell) {
            winning.push(cell);
        }
    }

    // Conservamos el orden sugerido por `available` para mantener estabilidad en desempates.
    if available.is_empty() {
        return winning;
    }
    available
        .iter()
        .copied()
        .filter(|cell| winning.contains(cell))
        .collect()
}

fn calculate_bridge_repairs(my_pieces: &Vec<Coordinates>, available_coords: &Vec<Coordinates>, bridge_repairs: &mut Vec<Coordinates>, board: &GameY, enemy_id: PlayerId) {
    let board_size = board.board_size();
    for i in 0..my_pieces.len() {
        for j in (i + 1)..my_pieces.len() {
            let p1 = my_pieces[i];
            let p2 = my_pieces[j];
            // Un "puente" solo se analiza entre piezas a distancia exacta 2.
            if hex_distance(&p1, &p2) != 2 {
                continue;
            }

            let mut free_intermediates = Vec::new();
            let mut enemy_blocks = 0;
            for cell in available_coords {
                if hex_distance(&p1, cell) == 1 && hex_distance(cell, &p2) == 1 {
                    free_intermediates.push(*cell);
                }
            }

            // Revisamos la(s) intermedia(s) ocupada(s): solo cuenta como amenaza si la ocupa el rival.
            for idx in 0..board.total_cells() {
                let cell = Coordinates::from_index(idx, board_size);
                if hex_distance(&p1, &cell) == 1
                    && hex_distance(&cell, &p2) == 1
                    && !free_intermediates.contains(&cell)
                    && board.player_at(&cell) == Some(enemy_id)
                {
                    enemy_blocks += 1;
                }
            }

            // Reparar solo si queda una única intermedia libre y la otra está tomada por el rival.
            if free_intermediates.len() == 1 && enemy_blocks > 0 {
                bridge_repairs.push(free_intermediates[0]);
            }
        }
    }
}

impl YBot for BridgeBot {
    fn name(&self) -> &str {
        if self.lax_repair {
            return "bridgebot_lax";
        }
        "bridgebot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let mut rng = rand::rng();

        // Recolectamos celdas libres en formato índice y validamos salida rápida.
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None;
        }

        // Datos base para todas las heurísticas.
        let board_size = board.board_size();
        let my_id = board.next_player()?;

        // Separamos fichas propias y enemigas para evaluar el estado.
        let mut my_pieces = Vec::new();
        let mut enemy_pieces = Vec::new();

        for idx in 0..board.total_cells() {
            let coords = Coordinates::from_index(idx, board_size);
            if let Some(player) = board.player_at(&coords) {
                if player == my_id {
                    my_pieces.push(coords);
                } else {
                    enemy_pieces.push(coords);
                }
            }
        }

        let available_coords: Vec<Coordinates> = available_cells
            .iter()
            .map(|&idx| Coordinates::from_index(idx, board_size))
            .collect();

        // Apertura: si no hay fichas propias, jugar al centro.
        if my_pieces.is_empty() {
            // Apertura determinista: mejor centralidad posible.
            let best_center = available_coords
                .iter()
                .max_by_key(|c| center_metric(c))
                .copied();
            return best_center;
        }

        let (my_tx, my_ty, my_tz, my_borders) = touches_all_sides(&my_pieces);

        // Prioridad 1: ganar ya si existe jugada ganadora.
        let winning_now = immediate_winning_moves(board, my_id, &available_coords);
        if !winning_now.is_empty() {
            // Si se puede cerrar partida, no se evalúa nada más.
            return pick_best_with_tie_break(winning_now, board_size);
        }

        // Prioridad 2: bloquear derrota inmediata si el rival puede ganar ahora.
        let enemy_id = crate::PlayerId::new(1 - my_id.id());
        let enemy_winning_now = immediate_winning_moves(board, enemy_id, &available_coords);
        if !enemy_winning_now.is_empty() {
            // Defensa táctica obligatoria: neutralizar mate en 1 rival.
            return pick_best_with_tie_break(enemy_winning_now, board_size);
        }

        // Prioridad 3: reparar puentes cortados con una sola intermedia libre.
        let mut bridge_repairs = Vec::new();
        if !self.lax_repair || (self.lax_repair && rng.random::<bool>()) {
            calculate_bridge_repairs(&my_pieces, &available_coords, &mut bridge_repairs, board, enemy_id);
        }
        if !bridge_repairs.is_empty() {
            return pick_best_with_tie_break(bridge_repairs, board_size);
        }

        // Prioridad 4: modo saltos hasta tocar las 3 paredes.
        // Solo crea puentes nuevos si las dos intermedias están libres.
        if my_borders < 3 {
            let mut jump_best_score = i32::MIN;
            let mut jump_candidates = Vec::new();

            for cell in &available_coords {
                // has_safe_jump: existe al menos un salto de puente totalmente abierto.
                let mut has_safe_jump = false;
                // safe_jump_count: cuántos saltos fuertes soporta esta celda.
                let mut safe_jump_count = 0;

                for piece in &my_pieces {
                    if hex_distance(cell, piece) == 2 {
                        // Salto válido solo con puente totalmente abierto.
                        if count_bridge_paths(cell, piece, board) == 2 {
                            has_safe_jump = true;
                            safe_jump_count += 1;
                        }
                    }
                }

                if !has_safe_jump {
                    // Si no aporta saltos seguros, no se considera en esta fase.
                    continue;
                }

                // Base de puntuación: progreso a paredes faltantes.
                let mut score = border_progress(cell, my_tx, my_ty, my_tz);
                // Reforzar nodos con más conexiones de salto disponibles.
                score += safe_jump_count * 500;
                // Preferencia secundaria por mantener masa central.
                score += center_metric(cell) / 2;

                // Si toca una pared faltante, subir prioridad
                if !my_tx && cell.x() == 0 || !my_ty && cell.y() == 0 || !my_tz && cell.z() == 0 {
                    score += 2_000 ;
                }

                if score > jump_best_score {
                    jump_best_score = score;
                    jump_candidates.clear();
                    jump_candidates.push(*cell);
                } else if score == jump_best_score {
                    jump_candidates.push(*cell);
                }
            }

            if !jump_candidates.is_empty() {
                return pick_best_with_tie_break(jump_candidates, board_size);
            }

            // FASE 2: Si no hay ningún puente,
            // jugar una casilla contigua a la red propia.
            let mut contiguous_best = i32::MIN;
            let mut contiguous = Vec::new();
            for cell in &available_coords {
                let is_contiguous = my_pieces.iter().any(|p| hex_distance(cell, p) == 1);
                if !is_contiguous {
                    continue;
                }

                let mut score = border_progress(cell, my_tx, my_ty, my_tz) + center_metric(cell);

                if !my_tx && cell.x() == 0 || !my_ty && cell.y() == 0 || !my_tz && cell.z() == 0 {
                    score += 3_000 ;
                }

                if score > contiguous_best {
                    contiguous_best = score;
                    contiguous.clear();
                    contiguous.push(*cell);
                } else if score == contiguous_best {
                    contiguous.push(*cell);
                }
            }

            if !contiguous.is_empty() {
                return pick_best_with_tie_break(contiguous, board_size);
            }

            // Emergencia: si no hay contiguas disponibles, usar cualquier celda legal.
            return pick_best_with_tie_break(available_coords.clone(), board_size);
        }

        // Prioridad 5: al tocar las 3 paredes, reforzar red y consolidar conexión.
        let mut best_score = i32::MIN;
        let mut candidates = Vec::new();
        for cell in &available_coords {
            // Vecinos propios directos: conectividad local inmediata.
            let touching: Vec<Coordinates> = my_pieces
                .iter()
                .copied()
                .filter(|p| hex_distance(cell, p) == 1)
                .collect();

            let mut score = 0;
            // Premio por densidad: más vecinos propios = red más robusta.
            score += touching.len() as i32 * 800;

            for i in 0..touching.len() {
                for j in (i + 1)..touching.len() {
                    let p1 = touching[i];
                    let p2 = touching[j];
                    if hex_distance(&p1, &p2) == 2 {
                        let paths = count_bridge_paths(&p1, &p2, board);
                        // En esta fase solo se premian puentes nuevos totalmente abiertos.
                        if paths == 2 {
                            score += 1_500;
                        }
                    }
                }
            }

            let enemy_adj = enemy_pieces
                .iter()
                .filter(|p| hex_distance(cell, p) == 1)
                .count() as i32;
            // Ligero sesgo táctico: disputar zonas cercanas al rival puede cortar su expansión.
            score += enemy_adj * 120;
            // Mantener cohesión global para no dispersar la estructura.
            score += center_metric(cell) / 3;

            if score > best_score {
                best_score = score;
                candidates.clear();
                candidates.push(*cell);
            } else if score == best_score {
                candidates.push(*cell);
            }
        }

        pick_best_with_tie_break(candidates, board_size)
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

    // ==========================================================
    // NIVEL 1: REGLAS BÁSICAS Y ROBUSTEZ
    // ==========================================================

    #[test]
    // Verificamos que el bot se identifica correctamente.
    fn test_bridgebot_identity() {
        assert_eq!(BridgeBot::default().name(), "bridgebot");
    }

    #[test]
    // En la apertura, el bot debería elegir una de las posiciones centrales para maximizar flexibilidad.
    fn test_first_move_is_always_center() {
        let bot = BridgeBot::default();
        let game = GameY::new(5);
        let chosen = bot.choose_move(&game).expect("Debe mover");
        let valid_centers = [4, 7, 8];
        assert!(valid_centers.contains(&chosen.to_index(5)), "El bot debería abrir en el centro (4, 7 u 8)");
    }

    #[test]
    // El bot no debería intentar mover en un tablero lleno, debe retornar None.
    fn test_handles_full_board_gracefully() {
        let bot = BridgeBot::default();
        let board_map = "
             0
            1 0
        ";
        let game = setup_test_board(2, board_map);
        assert!(bot.choose_move(&game).is_none(), "No debería mover en tablero lleno");
    }

    // ==========================================================
    // NIVEL 2: PRIORIDADES TÁCTICAS (MATAR / BLOQUEAR)
    // ==========================================================

    #[test]
    // El Jugador (1) tiene una jugada ganadora inmediata en el índice 10 (hay que bloquearla).
    fn test_priority_block_enemy_win() {
        let bot = BridgeBot::default();
        let board_map = "
            1
           1 .
          1 . .
         1 0 . .
        . 0 . 0 .
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover").to_index(5);

        assert_eq!(chosen, 10, "FALLO: El bot no bloqueó la victoria inminente del humano");
    }

    #[test]
    // El Bot (0) tiene una jugada ganadora inmediata en el índice 10.
    fn test_priority_immediate_win_for_bot() {
        let bot = BridgeBot::default();
        let board_map = "
            0
           0 .
          0 . .
         0 1 . .
        . 1 . 1 .
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover");

        assert!(
            is_immediate_winning_move(&game, PlayerId::new(0), chosen),
            "FALLO: Si existe victoria inmediata propia, debe jugarla, opciones válidas: [10], eligió: {}", chosen
        );
    }

    #[test]
    // En una situación donde tanto el bot como el enemigo tienen jugadas ganadoras inmediatas, el bot debe priorizar su victoria.
    fn test_priority_level_1_over_level_2() {
        let bot = BridgeBot::default();
        let board_map = "
            0
           0 .
          0 . .
         0 . . .
        . 1 1 1 1
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover");
        assert!(
            is_immediate_winning_move(&game, PlayerId::new(0), chosen),
            "FALLO: Debe priorizar victoria propia inmediata sobre bloqueo"
        );
    }

    // ==========================================================
    // NIVEL 3: GESTIÓN DE PUENTES Y REDUNDANCIA
    // ==========================================================

    #[test]
    // El Bot (0) tiene un puente cortado por el rival (1) con una sola intermedia libre. Debería no reparar ese puente (inutil).
    fn test_intelligent_ignoring_useless_bridges() {
        let bot = BridgeBot::default();
        // El Bot (0) ya tiene una estructura sólida arriba.
        // Un puente abajo (cerca del índice 8) no aporta nada a su victoria.
        let board_map = "
            0
           0 .
          . 0 .
         1 . 1 0
        1 1 . . 1
        ";
        let game = setup_test_board(5, board_map);
        let chosen = bot.choose_move(&game).expect("Debe mover").to_index(5);

        assert_ne!(chosen, 8, "FALLO: El bot gastó un turno en un puente que no aporta progreso");
    }

    #[test]
    // El Bot (0) debería saltar a distancia 2 hacia un borde libre para expandir su red, en lugar de jugar adyacente.
    fn test_expansion_via_safe_jumps() {
        let bot = BridgeBot::default();
        let board_map = "
            1
           . 1
          . . .
         . . 0 .
        . . . . .
        ";
        let game = setup_test_board(5, board_map);
        let center = Coordinates::from_index(8, 5);
        let chosen = bot.choose_move(&game).expect("Debe mover");
        let chosen_idx = chosen.to_index(5);
        
        let valid_jumps = [3, 11, 14];
        assert!(
            valid_jumps.contains(&chosen_idx) && hex_distance(&chosen, &center) == 2,
            "FALLO: El bot debería expandirse mediante saltos (distancia 2), opciones válidas: [3, 11, 14], eligió: {}", chosen_idx
        );
    }

    #[test]
    // El Bot (0) tiene un puente cortado por el rival (1) con una sola intermedia libre. Debería reparar ese puente para no perderlo.
    fn test_compromised_bridge() {
        // Puente comprometido
        let bot = BridgeBot::default();
        let board_map = "
            .
           . 0
          . 1 .
         . . 0 .
        . . . . .
        ";
        let game = setup_test_board(5, board_map);
        let center = Coordinates::from_index(8, 5);
        let chosen = bot.choose_move(&game).expect("Debe mover");
        let chosen_idx = chosen.to_index(5);
        
        let valid_jumps = [6];
        assert!(
            valid_jumps.contains(&chosen_idx) && hex_distance(&chosen, &center) == 2,
            "FALLO: El bot debería elegir la posición 6 para el puente comprometido, eligió {}", chosen_idx
        );
    }

    #[test]
    // Si el bloqueador del puente es una ficha propia, el bot no debería intentar "reparar" ese puente, ya que no está realmente comprometido.
    fn test_does_not_repair_bridge_if_block_is_own_piece() {
        let bot = BridgeBot::default();
        let board_map = "
            .
           . 0
          . 0 .
         . . 0 .
        . . . . .
        ";
        let game = setup_test_board(5, board_map);
        let chosen_idx = bot.choose_move(&game).expect("Debe mover").to_index(5);

        assert_ne!(
        chosen_idx, 5,
        "FALLO: no debería reparar puente comprometido cuando el bloqueo es de una ficha propia"
        );
    }


    // ==========================================================
    // NIVEL 4: AVANCE ESTRATÉGICO HACIA PAREDES
    // ==========================================================
    #[test]
    // Bajo presión de un puente cortado, el bot debería optar por un movimiento de avance hacia la pared faltante, incluso si no es un salto, para no perder progreso.
    fn test_improvised_wall_bridge_when_under_pressure() {
        let bot = BridgeBot::default();
        let board_map = "
            1
           1 1
          . 1 .
         . . . .
        . 0 0 0 .
        ";
        let game = setup_test_board(5, board_map);

        let chosen = bot.choose_move(&game).expect("Debe mover");
        let chosen_idx = chosen.to_index(5);

        assert!(
            [6, 9, 10, 14].contains(&chosen_idx),
            "FALLO: Bajo presión en pared faltante, debería jugar puente improvisado en la pared, opciones válidas: [10, 14], eligió: {}", chosen_idx
        );
        assert_eq!(
            hex_distance(&chosen, &Coordinates::from_index(7, 5)),
            1,
            "FALLO: El puente improvisado debe ser adyacente a una pieza propia"
        );
    }

    #[test]
    // En empate por puntuación y centralidad, el bot debería elegir la celda con el índice más bajo para mantener estabilidad en su comportamiento.
    fn test_tiebreak_prefers_lowest_index_after_score_and_centrality() {
        let size = 5;
        let c1 = Coordinates::from_index(1, size);
        let c2 = Coordinates::from_index(2, size);

        let candidates = vec![c1, c2];
        let chosen = pick_best_with_tie_break(candidates, size).expect("Debe elegir un candidato");

        assert_eq!(
            chosen.to_index(size),
            1,
            "FALLO: En empate por puntuación y centralidad, debe elegir menor índice"
        );
    }

    #[test]
    // Inicializar bot con variante laxa
    fn test_initialize_lax_mode() {
        let bot = BridgeBot::lax_repair_mode();
        assert!(bot.lax_repair);
    }


}
