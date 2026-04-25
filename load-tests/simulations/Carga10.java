package yovi;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * CARGA NORMAL — 10 usuarios
 *
 * Objetivo: verificar que la aplicación funciona correctamente
 * con una carga baja. Sirve como línea base para comparar
 * con los tests de mayor carga.
 *
 * Perfil:
 *   - 10 usuarios entran en rampa durante 10 segundos
 *   - Todos ejecutan el flujo completo una vez
 */
public class Carga10 extends FlujoBasico {
  {
    setUp(
      scn.injectOpen(
        rampUsers(10).during(10)  // 1 usuario nuevo por segundo durante 10s
      )
    ).protocols(httpProtocol);
  }
}
