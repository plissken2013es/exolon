import game from "./engine/game.js";
import audio from "./engine/audio.js";
import ExplosionParticleEntity from "./entities/ExplosionParticleEntity.js";

const explosion = {
  create(x, y, particlesCount) {
    for (let i = 0; i < particlesCount; ++i) {
      const particle = new ExplosionParticleEntity(x, y);
      game.add(particle, 10);
    }

    game.sort();
    audio.play("explosion");
  },
};

export default explosion;
