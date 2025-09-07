// Este objeto contém todas as regras para o visual e comportamento das partículas.
const particlesConfig = {
  background: {
    color: {
      value: '#0d1117', // Um tom de preto/azul profundo, mais rico que o preto puro
    },
  },
  fpsLimit: 60, // Limita o FPS para não sobrecarregar o hardware do usuário
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: 'repulse', // As partículas se afastam do mouse, criando interatividade
      },
      resize: true,
    },
    modes: {
      repulse: {
        distance: 80,
        duration: 0.4,
      },
    },
  },
  particles: {
    color: {
      value: '#ffffff',
    },
    links: {
      color: '#ffffff',
      distance: 150,
      enable: false, // Desabilitamos as linhas entre as partículas para um look mais limpo
      opacity: 0.5,
      width: 1,
    },
    collisions: {
      enable: false,
    },
    move: {
      direction: 'none',
      enable: true,
      outModes: {
        default: 'out',
      },
      random: true, // Movimento aleatório e natural
      speed: 0.5, // Velocidade bem lenta para um efeito sutil e elegante
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 80, // Quantidade de partículas na tela
    },
    opacity: {
      value: 0.5,
      // Animação de piscar (twinkle)
      animation: {
        enable: true,
        speed: 1,
        minimumValue: 0.1,
        sync: false,
      },
    },
    shape: {
      type: 'circle',
    },
    size: {
      value: { min: 1, max: 2 },
      // Animação de tamanho para dar mais dinamismo
      animation: {
        enable: true,
        speed: 2,
        minimumValue: 0.5,
        sync: false,
      },
    },
  },
  detectRetina: true,
};

export default particlesConfig;