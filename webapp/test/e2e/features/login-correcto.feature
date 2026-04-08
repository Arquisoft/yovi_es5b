Feature: Iniciar sesión correctamente
  Iniciar sesión introduciendo correctamente los datos

  Scenario: Inicio de sesión correcta
    Given Me he registrado con nombre "María", usuario "maria" y contraseña "test123..." y accedo a la página de inicio de sesión
    When Relleno el formulario de inicio de sesión con las credenciales correctas "maria" "test123..." y pulso en Iniciar sesión
    Then Debería mostrarme la página de juego para mi usuario "María"
