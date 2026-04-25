package yovi;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * CARGA MUY ALTA — 1000 usuarios
 *
 * Objetivo: encontrar el punto de ruptura real de la aplicación.
 * La carga sube en escalones progresivos.
 *
 * Perfil de inyección (total: 1000 usuarios):
 *   Escalón 1:  50 usuarios en  20s  →  base
 *   Escalón 2: 100 usuarios en  30s  →  moderado
 *   Escalón 3: 200 usuarios en  40s  →  alto
 *   Escalón 4: 300 usuarios en  50s  →  muy alto
 *   Escalón 5: 350 usuarios en  60s  →  máximo
 */
public class Carga1000 extends FlujoBasico {
  {
    setUp(
      scn.injectOpen(
        rampUsers(50).during(20),    // Escalón 1:  50 usuarios
        rampUsers(100).during(30),   // Escalón 2: 100 usuarios
        rampUsers(200).during(40),   // Escalón 3: 200 usuarios
        rampUsers(300).during(50),   // Escalón 4: 300 usuarios
        rampUsers(350).during(60)    // Escalón 5: 350 usuarios
      )
    ).protocols(httpProtocol);
  }
}
