import React, { useCallback } from 'react'; // Importamos o useCallback
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim'; // MUITO IMPORTANTE: importamos loadSlim
import particlesConfig from '../../particles-config';
import './SplashScreen.css';

const SplashScreen = () => {
  const logoText = 'VOOUD'.split('');

  // Usamos useCallback para garantir que a função de inicialização não seja recriada a cada renderização.
  // É uma otimização e boa prática em React.
  const particlesInit = useCallback(async (engine) => {
    // A mágica está aqui: usamos o loadSlim que importamos.
    await loadSlim(engine);
  }, []);

  return (
    <div className="splash-screen">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesConfig}
      />

      <div className="logo-container animate-fade-out">
        <div className="ring ring1"></div>
        <div className="ring ring2"></div>
        <div className="black-circle"></div>

        <div className="logo-text">
          {logoText.map((char, index) => (
            <span
              key={index}
              className="char"
              style={{ animationDelay: `${1.5 + index * 0.15}s` }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;