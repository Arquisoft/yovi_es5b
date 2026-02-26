CREATE TABLE Players (
    id_player INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('usuario', 'robot') NOT NULL
);

CREATE TABLE Usuario (
    id_player INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nom_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    
    CONSTRAINT fk_usuario_player 
      FOREIGN KEY (id_player) REFERENCES Players(id_player) 
      ON DELETE CASCADE
);

CREATE TABLE Robot (
    id_player INT PRIMARY KEY,
    behaviour_type VARCHAR(100) NOT NULL,
    
    CONSTRAINT fk_robot_player 
      FOREIGN KEY (id_player) REFERENCES Players(id_player) 
      ON DELETE CASCADE
);

CREATE TABLE Partida (
    id_partida INT AUTO_INCREMENT PRIMARY KEY,
    puntuacion INT DEFAULT 0,
    turnos INT DEFAULT 0,
    
    jugador1 INT NOT NULL,
    jugador2 INT NOT NULL,
    
    CONSTRAINT fk_partida_jugador1 
      FOREIGN KEY (jugador1) REFERENCES Players(id_player),
      
    CONSTRAINT fk_partida_jugador2 
      FOREIGN KEY (jugador2) REFERENCES Players(id_player)
);