# Direção de arte

Escolha delegada pelo usuário: portátil rosa, duas telas, jardim noturno e banda chibi. Referências: cabelo preto cacheado e vestido floral de Ranna; óculos e barba de Maycon; gato branco com cabeça/cauda tigradas e olhos amarelo-esverdeados; jardim de flores e lua da ilustração do casal.

## Quadro técnico

- Web, TypeScript, Three.js 0.180; palco 2.5D com sprites transparentes em cenário 3D.
- Palco enquadrado por câmera em perspectiva fixa, sem controles de órbita no produto.
- Interface responsiva até 320 px. Partida ocupa 100dvh no celular, área segura e botões de 66 px. Em paisagem baixa, telas lado a lado.
- Portátil central com largura máxima de 640 px. Tela superior se ajusta à altura disponível; menu e pistas compartilham a tela inferior. Em paisagem baixa, as telas ficam lado a lado.
- DPR limitado a 1.5 no palco, 2 nas pistas. Palco a 30 FPS, pistas via requestAnimationFrame.
- Sprites WebP de 640 px de altura, sRGB, alpha, filtragem linear, um quadro por personagem. Movimento por rotação/posição e pulso, sem interpolar imagens geradas.
- Cena com iluminação hemisférica e direcional; sombras dispensadas. Sprites sem iluminação adicional, profundidade sem escrita.

## Sistema visual

Contorno ameixa, formas arredondadas, olhos expressivos e sombreamento em blocos. Rosa para o console, creme para os menus e ameixa escuro para texto e contornos. Amarelo marca Jogar; cada música selecionada usa sua cor, contorno e seta. As quatro pistas têm símbolos diferentes além das cores. Textos permanecem em HTML/Canvas e não fazem parte da arte.

As notas seguem movimento linear porque o tempo até o alvo deve ser previsível. Acertos dão som curto, brilho na pista e reação breve dos personagens. Nenhum hit-stop interrompe a música. Movimento reduzido respeita a configuração do sistema e a opção do jogo.

## Arte e validação

Fonte gerada: `assets/band-source.png`, 1536 × 1024 RGBA. Recortes x=0..587, 588..1095 e 1096..1535, preservando a altura; redimensionados e codificados em WebP. Os limites foram escolhidos a partir da imagem retornada pela ferramenta. Alpha original verificado (mínimo 0, máximo 254). Identidades e silhuetas inspecionadas no retorno da geração.

## Revisão de interface — 28/09/2026

O menu passou a fazer parte do portátil. Foram removidos o cabeçalho externo, a chamada promocional, a coluna lateral e o rodapé de slogans. As três músicas, dificuldade, recorde e Jogar ficam na tela inferior. A dedicatória fica no álbum. Personagens maiores e câmera mais próxima dão destaque à banda; a reação de acerto existente também é usada na seleção de música e no resultado.

Referências consultadas:
- [Friday Night Funkin’](https://ninja-muffin24.itch.io/funkin): escala dos personagens, contornos e hierarquia dos indicadores.
- [Doodle Champion Island](https://doodles.google/doodle/doodle-champion-island-games-begin/): identidade dos personagens ligada ao mundo do jogo.
- [A Dance of Fire and Ice](https://fizzd.itch.io/a-dance-of-fire-and-ice): foco em uma ação por momento.

Inspeção no navegador em 1280 × 720, 390 × 844, 320 × 568 e 844 × 390. Conferidos seleção, dificuldade, início, pausa, retorno ao menu, configurações e álbum. Em telas curtas, os extras podem exigir rolagem; o botão Jogar permanece na área inicial. Validação em aparelho físico continua pendente.
