<div align="center">
  <img src="assets/icons/logo1024.svg" alt="CalmWrite" width="120" height="120">
  <h1 align="center">CalmWrite</h1>
  <p align="center">
    Leitura focada e relaxante — um trecho por vez, sem pressa, sem distrações.
    <br />
    <a href="https://github.com/MaelllDev/CalmWrite"><strong>Repositório oficial »</strong></a>
  </p>
  <br />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/status-ativo-brightgreen?style=flat-square" alt="Status: Ativo">
</p>

---

## ✨ Sobre

**CalmWrite** é uma ferramenta web minimalista para **leitura focada**. O objetivo é permitir que você copie textos para um caderno (físico ou digital) sem ficar sobrecarregado visualmente por blocos enormes de texto.

Cole qualquer texto, e o CalmWrite divide inteligentemente em blocos confortáveis — um de cada vez. A interface é limpa, relaxante e inspirada em estéticas como *Study With Me*, *lo-fi*, *cozy* e minimalismo moderno.

Ideal para:
- 📚 Estudar e copiar resumos
- 📝 Transcrição de textos longos
- 🧘 Leitura sem distrações
- 🎧 Estudar com música ambiente ou Spotify

---

## 🚀 Como usar

1. **Abra o `index.html`** em qualquer navegador moderno (ou sirva com Live Server)
2. Clique em **"Começar"**
3. Cole ou digite seu texto no modal
4. Clique em **"Começar"** novamente
5. Leia um bloco por vez, navegando com:
   - `→` `Espaço` `Enter` — próximo bloco
   - `←` `Backspace` — bloco anterior
   - `Esc` — sair da leitura
   - Clique nas laterais da tela para navegar

---

## 🎯 Funcionalidades

### 📖 Leitura inteligente
- Divisão automática do texto em parágrafos
- Quebras inteligentes respeitando pontuação (`. ! ? ;`)
- **Nunca** corta palavras no meio
- Modo de **palavras por bloco** (limite manual, atualiza em tempo real)

### 🎨 Personalização
- **3 temas:** Escuro, Claro e Sépia
- **4 fontes:** Atkinson Hyperlegible, Inter, Nunito e IBM Plex Sans
- Ajuste de **tamanho da fonte** e **espaçamento entre linhas**
- **4 animações** de transição: Fade, Slide, Scale e Blur
- Velocidade das animações ajustável
- Opção de **alto contraste** e **ocultar cursor**

### 🔊 Som e música
- **Sons de navegação:** Papel, Click e Máquina de escrever
- **Música ambiente** gerada por Web Audio API:
  - 🌧️ Chuva • 🌲 Floresta • 📚 Biblioteca • ☕ Cafeteria
  - 🎹 Piano • 🎧 Lo-fi • 💨 Vento • 🔥 Lareira
- Volumes **independentes** para música e efeitos

### 🎵 Integração com Spotify
- Cole o link de qualquer playlist do Spotify
- Player compacto flutuando no canto inferior esquerdo
- Controles nativos (play/pause/pular/volume)
- Volumes independentes da música ambiente

### 📄 Importação de PDF
- Importe arquivos PDF diretamente no navegador (via pdf.js)
- O texto é extraído automaticamente e pode ser lido como qualquer outro
- Funciona 100% offline depois do primeiro carregamento

### 💾 Salvamento automático
- Progresso salvo no **LocalStorage**
- Ao reabrir, pergunta se deseja **continuar de onde parou**
- Sessões expiram após 24h

### ♿ Acessibilidade
- Navegação completa por teclado
- Suporte a alto contraste
- Fontes de alta legibilidade (Atkinson Hyperlegible)
- `aria-live`, `aria-label` e semântica HTML

### 🎉 Parabéns ao final
- Modal comemorativo ao terminar a leitura
- Botão para voltar ao início

---

## 🗂️ Estrutura do projeto

```
CalmWrite/
├── index.html              # Página principal
├── README.md               # Este arquivo
├── assets/
│   ├── audio/              # (reservado para áudios futuros)
│   ├── fonts/              # (reservado para fontes locais)
│   ├── icons/              # Logos e ícones do projeto
│   │   ├── logo512.svg
│   │   ├── logo512.png
│   │   ├── logo1024.svg
│   │   └── logo1024.png
│   └── images/             # (reservado para imagens)
├── css/
│   └── style.css           # Design system e estilos completos
└── js/
    ├── app.js              # Orquestrador principal
    ├── storage.js          # Persistência (LocalStorage)
    ├── textProcessor.js    # Processamento inteligente de texto
    ├── ui.js               # Componentes de interface (modais, toasts, etc.)
    ├── navigation.js       # Navegação entre blocos (teclado + clique)
    ├── audio.js            # Web Audio API (sons + música ambiente)
    ├── spotify.js          # Integração com Spotify (iframe embed)
    └── settings.js         # Painel de configurações
```

---

## 🛠️ Como modificar

O CalmWrite é feito em **HTML, CSS e JavaScript puros** — sem frameworks, sem bundlers, sem dependências. Basta abrir no navegador e começar a editar.

### Pré-requisitos
- Um navegador moderno (Chrome, Firefox, Edge, etc.)
- Opcional: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code para recarregamento automático

### Para editar
1. Clone o repositório:
   ```bash
   git clone https://github.com/MaelllDev/CalmWrite.git
   ```
2. Edite os arquivos desejados:
   - **`index.html`** — estrutura da página
   - **`css/style.css`** — design system e estilos
   - **`js/*.js`** — funcionalidades (cada arquivo é um módulo)
3. Abra o `index.html` no navegador (ou com Live Server)

### Adicionar novo som ambiente
Em `js/audio.js`, crie um método `_createSeuSom()` seguindo o padrão dos existentes e adicione o case no método `startAmbient()`.

### Adicionar nova fonte
1. Importe no `<head>` do `index.html` (Google Fonts)
2. Adicione o CSS para a fonte no `:root`
3. Adicione a opção no `<select id="font-select">` em `index.html`
4. Adicione o mapeamento no método `_applyFont()` em `js/settings.js`

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Sinta-se à vontade para usar, modificar e distribuir, mas **mantenha os créditos** ao projeto original.

```
MIT License

Copyright (c) 2026 MaelllDev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Créditos

Criado por [**MaelllDev**](https://github.com/MaelllDev)

- 🌐 Site: [CalmWrite](https://maellldev.github.io/CalmWrite/)
- 🐙 GitHub: [@MaelllDev](https://github.com/MaelllDev)

### 💡 Agradecimentos

- **@amb3rkai** — pela sugestão de importação de PDF, que elevou o CalmWrite a outro nível 🚀
- **@harem4** — pela sugestão dos temas azuis Navy e Sky 🌊✨

---

<p align="center">
  <sub>Feito com ☕, 🎧 lo-fi e 🧘 calma.</sub>
  <br />
  <sub>Se você modificar ou distribuir, <strong>mantenha os créditos</strong> 🤝</sub>
</p>
