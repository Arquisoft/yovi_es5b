package yovi;

import java.time.Duration;
import java.util.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
* Clase generada automáticamente por el recorder de Gatling.
* Esta clase incluye las acciones que llevará a cabo cada usuario simulado.
* 
* La secuencia sigue los siguientes pasos:
* - Un nuevo usuario accede a la página por primera vez
* - Se registra en la aplicación
* - Juega una partida
* - Vuelve al menú principal
* - Consulta sus estadísticas
* - Cierra sesión
*/
public class FlujoBasico extends Simulation {

  /**
  * Métodos auxiliares
  */
  
  // Protocolo HTTP
  protected HttpProtocolBuilder httpProtocol = http
    .baseUrl("http://20.199.9.107:4000") // URL de la aplicación desplegada en Azure
    .inferHtmlResources(AllowList(), DenyList(
      ".*\\.js", ".*\\.css", ".*\\.gif", ".*\\.jpeg", ".*\\.jpg",
      ".*\\.ico", ".*\\.woff", ".*\\.woff2", ".*\\.(t|o)tf",
      ".*\\.png", ".*\\.svg", ".*detectportal\\.firefox\\.com.*"
    ))
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate, br")
    .acceptLanguageHeader("es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7")
    .originHeader("http://20.199.9.107")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0");

  // Para GET sin body
  private Map<CharSequence, String> headersGet = Map.ofEntries(
    Map.entry("Priority", "u=4"),
    Map.entry("Sec-Fetch-Dest", "empty"),
    Map.entry("Sec-Fetch-Mode", "cors"),
    Map.entry("Sec-Fetch-Site", "same-site")
  );

  // Para POST con JSON (acciones de partida y registro)
  private Map<CharSequence, String> headersPostJson = Map.ofEntries(
    Map.entry("Content-Type", "application/json"),
    Map.entry("Priority", "u=0"),
    Map.entry("Sec-Fetch-Dest", "empty"),
    Map.entry("Sec-Fetch-Mode", "cors"),
    Map.entry("Sec-Fetch-Site", "same-site")
  );

  // Para POST con JSON de baja prioridad (guardar partida)
  private Map<CharSequence, String> headersPostJsonLow = Map.ofEntries(
    Map.entry("Content-Type", "application/json"),
    Map.entry("Priority", "u=4"),
    Map.entry("Sec-Fetch-Dest", "empty"),
    Map.entry("Sec-Fetch-Mode", "cors"),
    Map.entry("Sec-Fetch-Site", "same-site")
  );

  // Para GET de alta prioridad (stats)
  private Map<CharSequence, String> headersGetHigh = Map.ofEntries(
    Map.entry("Priority", "u=0"),
    Map.entry("Sec-Fetch-Dest", "empty"),
    Map.entry("Sec-Fetch-Mode", "cors"),
    Map.entry("Sec-Fetch-Site", "same-site")
  );

  /**
  * FEEDER
  * Lee fichero de usuarios (.csv) y asigna uno distinto a cada usuario simulado
  */
  FeederBuilder<String> feeder = csv("usuarios_500.csv");

  /**
  * Secuencia simulada
  */
  protected ScenarioBuilder scn = scenario("FlujoBasico")

    // Asignar un usuario del CSV a este usuario virtual
    .feed(feeder)

    /**
    * 1. COMPROBACIÓN INICIAL DE SESIÓN
    * El frontend comprueba si hay sesión activa al cargar la app.
    * Esperamos 403 porque el usuario aún no se ha registrado.
    */
    .exec(
      http("Sesión inicial - no autenticado")
        .get("http://20.199.9.107:3000/getuser")
        .headers(headersGet)
        .check(status().is(403))
    )
    .pause(12) // El usuario tarda en rellenar el formulario de registro

    /**
    * 2. REGISTRO
    * El usuario introduce los datos necesarios para registrarse (obtenidos del feeder).
	* Se obtiene una respuesta con código 200 si todo va bien
    */
    .exec(
      http("Registro")
        .post("http://20.199.9.107:3000/register")
        .headers(headersPostJson)
        .body(StringBody(
          "{\"nombre\":\"#{nombre}\",\"nom_usuario\":\"#{nom_usuario}\",\"contrasena\":\"#{contrasena}\"}"
        ))
        .check(status().is(200))
    )
    .pause(5)

    /**
    * 3. COMPROBACIÓN DE SESIÓN TRAS REGISTRO
    * El frontend verifica que la sesión se ha establecido correctamente.
    */
    .exec(
      http("Sesión activa tras registro")
        .get("/status")
        .headers(headersGet)
    )
    .pause(5) // El usuario decide qué hacer, navega al juego

    /**
    * 4. PARTIDA
    * Los JSON de movimientos no contienen datos del usuario,
    * así que se reutilizan tal cual para todos los usuarios virtuales.
    */
    .exec(
      http("Partida - Movimiento 1")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0007_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 2")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0008_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 3")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0010_request.json"))
    )
    .pause(2)
    .exec(
      http("Partida - Movimiento 4")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0012_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 5")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0013_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 6")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0015_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 7")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0016_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 8")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0017_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 9")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0019_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 10")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0021_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 11")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0022_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 12")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0023_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 13")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0024_request.json"))
    )
    .pause(1)
    .exec(
      http("Partida - Movimiento 14")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0026_request.json"))
    )
    .pause(2)
    .exec(
      http("Partida - Movimiento final")
        .post("/v1/ybot/choose/random_bot")
        .headers(headersPostJson)
        .body(RawFileBody("yovi/flujobasico/0028_request.json"))
    )
    .pause(1)

    /**
    * 5. GUARDAR PARTIDA
	* Se hace la petición para guardar el resultado de la partida en la base de datos
    */
    .exec(
      http("Guardar partida")
        .post("http://20.199.9.107:3000/guardar-partida")
        .headers(headersPostJsonLow)
        .body(RawFileBody("yovi/flujobasico/0030_request.json"))
        .check(status().is(200))
    )
    .pause(2)

    /**
    * 6. NAVEGAR AL MENÚ
    * Se simulan las peticiones que se hacen al navegar por el menú.
    */
    .exec(
      http("Sesión activa - menú principal")
        .get("/status")
        .headers(headersGet)
    )
    .pause(5)
    .exec(
      http("Sesión activa - navegando a stats")
        .get("/status")
        .headers(headersGet)
    )
    .pause(5)

    /**
    * 7. CONSULTAR ESTADÍSTICAS
    * El endpoint acepta nom_usuario (no el id numérico).
    * nom_usuario ya lo tenemos del feeder, no hay que capturarlo.
    */
    .exec(
      http("Consultar estadísticas")
        .get("http://20.199.9.107:3000/stats/#{nom_usuario}")
        .headers(headersGetHigh)
        .check(status().is(200))
    )
    .pause(3)

    /**
    * 8. SESIÓN ACTIVA ANTES DE LOGOUT
    */
    .exec(
      http("Sesión activa - antes de logout")
        .get("/status")
        .headers(headersGet)
    )
    .pause(4)

    /**
    * 9. LOGOUT
    * El frontend hace logout borrando la cookie JSESSIONID en el cliente:
    *   document.cookie = "JSESSIONID="
    * No hay llamada al servidor. Simulamos esto vaciando el cookie jar
    * de Gatling con flushCookieJar(), y verificamos que sin cookie
    * el servidor responde 403.
    */
    .exec(flushCookieJar())
    .pause(2)
    .exec(
      http("Verificar cierre de sesión")
        .get("http://20.199.9.107:3000/getuser")
        .headers(headersGet)
        .check(status().is(403))
    );

  /*
  * INYECCIÓN DE CARGA
  * El setUp lo define cada subclase (Carga10, PicoCarga100...).
  */
  
  // Para ejecutar con 1 usuario de prueba, descomentar lo siguiente:
  // {
  //   setUp(
  //     scn.injectOpen(atOnceUsers(1))
  //   ).protocols(httpProtocol);
  // }

}
