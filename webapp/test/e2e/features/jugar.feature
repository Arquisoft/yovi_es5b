Feature: Jugar una partida
  Jugar partidas del juego Y contra el bot

  Scenario: Iniciar una partida correctamente
    Given Me he registrado con nombre "Ana", usuario "ana_test" y contraseña "test123..." y accedo al lobby
    When Selecciono la estrategia "Bot Aleatorio" y pulso en JUGAR
    Then Debería ver el tablero de juego con el mensaje de turno

  Scenario: Hacer un movimiento en el tablero
    Given Estoy en una partida en curso como "ana_test"
    When Hago clic en una casilla vacía del tablero
    Then Debería aparecer mi pieza en azul en esa casilla y el bot debería responder

  Scenario: Abandonar una partida y volver al lobby
    Given Estoy en una partida en curso como "ana_test"
    When Pulso el botón de Abandonar Partida
    Then Debería volver al lobby con el botón JUGAR visible

  Scenario: Detectar la victoria del jugador
    Given Estoy en una partida en curso como "ana_test" con el servidor de juego simulado que devuelve victoria
    When Hago clic en una casilla vacía del tablero
    Then Debería mostrarse el mensaje de victoria y el botón de volver a jugar

  Scenario: Intentar seleccionar una casilla ya ocupada
    Given Estoy en una partida en curso como "ana_test" con el servidor de juego simulado que devuelve victoria
    When Hago clic en una casilla vacía del tablero
    And Intento hacer clic de nuevo en esa misma casilla
    Then El número de piezas azules en el tablero no debería haber aumentado