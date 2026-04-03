Feature: Registrar usuario
  Registrar un usuario correctamente

  Scenario: Registro correcto como usuario
    Given Acceso a la página de registro
    When Relleno el formulario nombre de usuario como "Pedro", nombre "pepe", contraseña "test123..." y pulso en Registrar
    Then Debería haber creado mi cuenta de "Pedro" y tener acceso a la pantalla de selección de juego
