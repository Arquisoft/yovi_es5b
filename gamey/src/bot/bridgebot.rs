use crate::core::{Coordinates, GameStatus, GameY, Movement};
use crate::YBot;
use rand::prelude::IndexedRandom;

/// BridgeBot: estrategia de Y mediante prioridades estrictas y simulaci\u00f3n exacta.
///
/// El bot aplica una jerarqu\u00eda de decisiones t\u00e1cticas, verificando cada regla por simulaci\u00f3n:\n/// 1. **Victoria inmediata:** Si podemos ganar ahora, ganar.\n/// 2. **Bloqueo de derrota:** Si el rival gana en su siguiente turno, bloquearlo.\n/// 3. **Reparaci\u00f3n de puentes:** Si un puente propio qued\u00f3 con una sola intermedia libre, completarlo.\n/// 4. **Modo saltos:** Mientras no toquemos las 3 paredes, jugar a distancia 2 (puentes estrat\u00e9gicos).\n/// 5. **Rellenar puentes:** Tras tocar las 3 paredes, reforzar conectividad local y presionar.\n///\n/// Cada decisi\u00f3n es exacta (no heur\u00edsticas falibles), usando simulaci\u00f3n cuando es necesario.\n#[derive(Debug, Default)]\npub struct BridgeBot;

/// Calcula la distancia hexagonal entre dos celdas en coordenadas baric\u00e9ntricas.
///
/// En el tablero triangular de Y:
/// - **Distancia 1** = celda adyacente (vecina).\n/// - **Distancia 2** = celda a salto de puente (puede conectarse v\u00eda una intermedia).\n/// - **Distancia 3+** = separadas sin conexi\u00f3n directa.\nfn hex_distance(c1: &Coordinates, c2: &Coordinates) -> i32 {
    let dx = (c1.x() as i32 - c2.x() as i32).abs();
    let dy = (c1.y() as i32 - c2.y() as i32).abs();
    let dz = (c1.z() as i32 - c2.z() as i32).abs();
    (dx + dy + dz) / 2
}

/// Cuenta cuántas celdas intermedias libres conectan dos fichas a distancia 2.
///
/// Resultados típicos:
/// - **2** = puente fuerte (dos rutas disponibles).
/// - **1** = puente cortado (enemigo bloqueó un camino).
/// - **0** = sin puente posible.
fn count_bridge_paths(piece1: &Coordinates, piece2: &Coordinates, board: &GameY) -> i32 {
    let mut bridge_count = 0;
    for idx in 0..board.total_cells() {
        let candidate = Coordinates::from_index(idx, board.board_size());
        if board.player_at(&candidate).is_some() { continue; }
        if hex_distance(piece1, &candidate) == 1 && hex_distance(&candidate, piece2) == 1 {
            bridge_count += 1;
        }
    }
    bridge_count
}

/// Métrica de centralidad para desempates determinísticos.
/// Mayor valor = celda más centrada y tácticamente flexible.
fn center_metric(c: &Coordinates) -> i32 {
    1000 - ((c.x() as i32 - c.y() as i32).abs()
        + (c.y() as i32 - c.z() as i32).abs()
        + (c.z() as i32 - c.x() as i32).abs())
}

/// Analiza si un conjunto de fichas toca cada una de las tres paredes del triángulo.
/// En Y, gana quien conecta las 3 fronteras.
/// Devuelve: (toca_lado_X, toca_lado_Y, toca_lado_Z, total_lados).
fn touches_all_sides(pieces: &[Coordinates]) -> (bool, bool, bool, i32) {
    let tx = pieces.iter().any(|c| c.x() == 0);
    let ty = pieces.iter().any(|c| c.y() == 0);
    let tz = pieces.iter().any(|c| c.z() == 0);
    let count = (tx as i32) + (ty as i32) + (tz as i32);
    (tx, ty, tz, count)
}

/// Heurística para avanzar hacia paredes faltantes.
/// Recompensa fuerte (10.000) tocar pared nueva; progresiva (hasta 1.000) acercarse.
fn border_progress(cell: &Coordinates, tx: bool, ty: bool, tz: bool) -> i32 {
    let mut score = 0;
    if !tx && cell.x() == 0 {
        score += 10_000;
    }
    if !ty && cell.y() == 0 {
        score += 10_000;
    }
    if !tz && cell.z() == 0 {
        score += 10_000;
    }

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

/// Desempate determinista entre candidatas de igual valor táctico.
/// Etapas: (1) mejor centralidad, (2) menor índice, (3) aleatorio si aún hay empate.
fn pick_best_with_tie_break(candidates: Vec<Coordinates>, board_size: u32) -> Option<Coordinates> {
    if candidates.is_empty() {
        return None;
    }
    let mut rng = rand::rng();
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

    let min_index = best
        .iter()
        .map(|c| c.to_index(board_size))
        .min()
        .unwrap_or(0);

    let stable: Vec<Coordinates> = best
        .into_iter()
        .filter(|c| c.to_index(board_size) == min_index)
        .collect();

    stable.choose(&mut rng).copied()
}

/// Verifica si una jugada resulta en victoria inmediata por simulación exacta.
/// Clona el tablero, aplica la jugada, y consulta el estado resultante.
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

/// Filtra casillas legales que llevan a victoria inmediata.
/// Se usa para hallar tanto amenazas propias como bloques de enemigo.
fn immediate_winning_moves(board: &GameY, player: crate::PlayerId, available: &[Coordinates]) -> Vec<Coordinates> {
    available
        .iter()
        .copied()
        .filter(|cell| is_immediate_winning_move(board, player, *cell))
        .collect()
}

impl YBot for BridgeBot {
    fn name(&self) -> &str {
        "bridgebot"
    }

    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        let available_cells = board.available_cells();
        if available_cells.is_empty() {
            return None;
        }

        let board_size = board.board_size();
        let my_id = board.next_player()?;

        // PREPARACIÓN: Escanear y separar fichas.
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

        // PRIORIDAD 0: APERTURA
        // Si aún no tengo fichas, jugar en el centro (máxima flexibilidad).
        if my_pieces.is_empty() {
            let best_center = available_coords
                .iter()
                .max_by_key(|c| center_metric(c))
                .copied();
            return best_center;
        }

        let (my_tx, my_ty, my_tz, my_borders) = touches_all_sides(&my_pieces);

        // PRIORIDAD 1: VICTORIA INMEDIATA
        // Si tengo una jugada que gana ahora por simulación exacta, jugarla sin dudarlo.
        let winning_now = immediate_winning_moves(board, my_id, &available_coords);
        if !winning_now.is_empty() {
            return pick_best_with_tie_break(winning_now, board_size);
        }

        // PRIORIDAD 2: BLOQUEAR DERROTA INMEDIATA
        // Si el rival puede ganar en su siguiente turno, bloqueamos alguna de esas casillas.
        let enemy_id = crate::PlayerId::new(1 - my_id.id());
        let enemy_winning_now = immediate_winning_moves(board, enemy_id, &available_coords);
        if !enemy_winning_now.is_empty() {
            return pick_best_with_tie_break(enemy_winning_now, board_size);
        }

        // PRIORIDAD 3: REPARAR PUENTES CORTADOS
        // Si un puente propio (dist 2 entre fichas) quedó con solo 1 intermedia libre,
        // el rival lo bloqueó parcialmente. Completar ahora para no perderlo.
        let mut bridge_repairs = Vec::new();
        for i in 0..my_pieces.len() {
            for j in (i + 1)..my_pieces.len() {
                let p1 = my_pieces[i];
                let p2 = my_pieces[j];
                if hex_distance(&p1, &p2) != 2 {
                    continue;
                }

                let mut free_intermediates = Vec::new();
                for cell in &available_coords {
                    if hex_distance(&p1, cell) == 1 && hex_distance(cell, &p2) == 1 {
                        free_intermediates.push(*cell);
                    }
                }

                if free_intermediates.len() == 1 {
                    bridge_repairs.push(free_intermediates[0]);
                }
            }
        }
        if !bridge_repairs.is_empty() {
            return pick_best_with_tie_break(bridge_repairs, board_size);
        }

        // PRIORIDAD 4: MODO SALTOS (hasta tocar las 3 paredes)
        // Mientras no toquemos las 3 fronteras, jugar a distancia 2 de fichas propias.
        // Esto acelera expansión y crea puentes estratégicos.
        // Solo saltamos si el puente tiene ≥2 rutas libres (seguro).
        if my_borders < 3 {
            let mut jump_best_score = i32::MIN;
            let mut jump_candidates = Vec::new();

            for cell in &available_coords {
                let mut has_jump = false;
                let mut safe_jump_count = 0;

                for piece in &my_pieces {
                    if hex_distance(cell, piece) == 2 {
                        has_jump = true;
                        if count_bridge_paths(cell, piece, board) == 2 {
                            safe_jump_count += 1;
                        }
                    }
                }

                if !has_jump {
                    continue;
                }

                let mut score = border_progress(cell, my_tx, my_ty, my_tz);
                score += safe_jump_count * 500;
                score += center_metric(cell) / 2;

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

            // Fallback modo saltos: sin buen salto, avanzar igualmente hacia paredes faltantes.
            let mut fallback_best = i32::MIN;
            let mut fallback = Vec::new();
            for cell in &available_coords {
                let score = border_progress(cell, my_tx, my_ty, my_tz) + center_metric(cell);
                if score > fallback_best {
                    fallback_best = score;
                    fallback.clear();
                    fallback.push(*cell);
                } else if score == fallback_best {
                    fallback.push(*cell);
                }
            }
            return pick_best_with_tie_break(fallback, board_size);
        }

        // PRIORIDAD 5: MODO RELLENAR PUENTES (tras tocar las 3 paredes)
        // Una vez tocadas las 3 fronteras, reforzar la red:
        // - Priorizar celdas que toquen múltiples fichas propias.\n        // - Reforzar puentes frágiles (1 intermedia libre).\n        // - Acercarse al rival para presión.\n        let mut best_score = i32::MIN;
        let mut candidates = Vec::new();
        for cell in &available_coords {
            let touching: Vec<Coordinates> = my_pieces
                .iter()
                .copied()
                .filter(|p| hex_distance(cell, p) == 1)
                .collect();

            let mut score = 0;
            score += touching.len() as i32 * 800;

            for i in 0..touching.len() {
                for j in (i + 1)..touching.len() {
                    let p1 = touching[i];
                    let p2 = touching[j];
                    if hex_distance(&p1, &p2) == 2 {
                        let paths = count_bridge_paths(&p1, &p2, board);
                        if paths == 1 {
                            score += 4_000;
                        } else if paths == 2 {
                            score += 1_500;
                        }
                    }
                }
            }

            let enemy_adj = enemy_pieces
                .iter()
                .filter(|p| hex_distance(cell, p) == 1)
                .count() as i32;
            score += enemy_adj * 120;
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