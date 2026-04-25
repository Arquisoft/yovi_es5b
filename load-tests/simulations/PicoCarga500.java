package yovi;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * 500 usuarios a la vez
 *
 * Objetivo: comprobar el comportamiento bajo una carga puntual muy alta.
 * Se busca encontrar el punto exacto donde la aplicación comienza a fallar
 *
 * Perfil:
 *   - 500 usuarios a la vez: atOnceUsers(500)
 */
public class PicoCarga500 extends FlujoBasico {
  {
    setUp(
      scn.injectOpen(
        atOnceUsers(500)  // 500 usuarios a la vez
      )
    ).protocols(httpProtocol);
  }
}
