Feature: Iniciar sesión fallida
  Iniciar sesión introduciendo incorrectamente los datos

  Scenario: Inicio de sesión fallida
    Given Acceso a la página de inicio de sesión
    When Relleno el formulario de inicio de sesión con credenciales no válidas como "pepe" "test12.." y pulso en Iniciar sesión
    Then Debería mostrarme un error que indique claramente que no he podido iniciar sesión porque los datos son incorrectos
