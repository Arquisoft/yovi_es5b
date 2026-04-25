package yovi;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * PICO DE CARGA — 100 usuarios simultáneos
 *
 * Objetivo: comprobar el comportamiento ante un pico brusco de tráfico.
 *
 * Los 100 usuarios entran al mismo tiempo.
 *
 * Perfil:
 *   - 100 usuarios de golpe (atOnceUsers)
 *   - Todos ejecutan el flujo completo una vez
 */
public class PicoCarga100 extends FlujoBasico {
  {
    setUp(
      scn.injectOpen(
        atOnceUsers(100)  // los 100 usuarios entran en el mismo instante
      )
    ).protocols(httpProtocol);
  }
}
