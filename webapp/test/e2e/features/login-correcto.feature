Feature: Iniciar sesión correctamente
  Iniciar sesión introduciendo correctamente los datos

  Scenario: Inicio de sesión correcta
    Given Me he registrado con nombre "Prueba", usuario "_usuario_test_" y contraseña "test123..." y accedo a la página de inicio de sesión
    When Relleno el formulario de inicio de sesión con las credenciales correctas "_usuario_test_" "test123..." y pulso en Iniciar sesión
    Then Debería mostrarme la página de juego para mi usuario "Prueba"
