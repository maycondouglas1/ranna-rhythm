# Ranna Rhythm ♡

Jogo de ritmo personalizado para Ranna, Maycon e Cebolinha. Duas telas inspiradas em um portátil, palco 3D em Three.js e quatro pistas de ritmo. Interface em português, feita para teclado e celular.

## Jogar

Requer Node.js 22.12 ou mais recente.

```sh
npm install
npm run dev
```

Abra o endereço local indicado pelo Vite. Não abra `index.html` diretamente. Por padrão, o servidor atende somente ao próprio computador.

Para permitir acesso pelo celular, é preciso autorizar a exposição do jogo na rede local. A revisão automática bloqueou essa abertura nesta sessão. Após autorizar, use `npm run dev -- --host 0.0.0.0` e, no mesmo Wi-Fi, abra o endereço **Network** exibido pelo Vite. O computador precisa continuar ligado e o servidor aberto.

- Escolha uma das três músicas e uma dificuldade.
- Use **D, F, J, K**, ou toque nos quatro botões da tela quando as notas alcançarem os círculos.
- **Esc** ou **Ⅱ** pausa. Trocar de aba ou aplicativo também pausa a partida.
- Em **⚙**, ajuste volume, sincronização de −300 a +300 ms e movimento reduzido.
- Recordes por música/dificuldade e ajustes são guardados no navegador. Não há conta ou backend.

As músicas são arquivos locais. As fontes do Google Fonts são opcionais: o jogo usa fontes do sistema se estiver sem conexão.

## Produção e verificações

```sh
npm test
npm run build
npm run preview
```

Publique o conteúdo de `dist/` em qualquer hospedagem estática HTTPS para jogar fora do Wi-Fi local. Este projeto não foi publicado automaticamente.

### Deploy automático na Netlify

Envie este repositório para o GitHub e importe-o na Netlify em **Add new project → Import an existing project → GitHub**. Selecione a branch `main`. O arquivo `netlify.toml` configura Node.js 22, o comando `npm run build` e a publicação da pasta `dist`.

Após conectar o repositório, cada push em `main` dispara um novo build e deploy. Não é necessário versionar nem enviar `dist` manualmente.

Testes automatizados cobrem janelas de acerto, pistas erradas, consumo único de notas, combo, pontuação, precisão, mapas nas três dificuldades e relógio/pausa/carregamento do áudio com um contexto simulado. O build verifica os tipos TypeScript. As três gravações também foram decodificadas e conferidas com FFmpeg. A revisão de interface foi inspecionada no navegador em desktop e em tamanhos de celular, incluindo orientação horizontal. Não houve validação em aparelho físico. Latência real de áudio/toque precisa ser ajustada no celular usado para jogar.

## Organização

- `src/rhythm.ts`: músicas, mapas determinísticos e regras de pontuação.
- `src/audio.ts`: relógio Web Audio, carregamento, pausa e efeitos. Mantém só a última música decodificada em memória.
- `src/stage.ts`: cenário e personagens Three.js, carregados separadamente da interface.
- `src/main.ts`: telas, interação e desenho das pistas em Canvas 2D.
- `src/style.css`: console, interface e layouts para celular vertical e horizontal.
- `public/music/`: três edições arcade de 90 segundos.
- `public/art/`: sprites WebP com transparência.
- `assets/`: arte original gerada e proveniência.

O ritmo usa o relógio de saída de áudio, com compensação manual de latência; a animação não controla a pontuação. Os mapas seguem frases regulares e subdivisões de batida, sem análise automática em tempo de execução. Não há gamepad, notas longas ou upload de músicas nesta versão.

## Créditos

“Pixel Peeker Polka - faster”, “Cipher” e “Pamgaea”, de **Kevin MacLeod** ([incompetech.com](https://incompetech.com)), sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). As faixas foram recortadas em 90 segundos, com fade de saída e codificação MP3 160 kbps. Links das obras, fontes e alterações em `assets/manifest.json` e dentro do jogo.

Ilustrações criadas com a ferramenta integrada de geração de imagens a partir das referências fornecidas pelo usuário. O projeto é independente, sem vínculo com Nintendo, Hatsune Miku ou Michael Jackson.
