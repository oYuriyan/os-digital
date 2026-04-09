# Integração de Câmera e Visão Computacional (YOLO + OCR) para Busca no GLPI

O objetivo desta etapa é permitir que o aplicativo ou PWA do técnico capture a foto real de uma etiqueta de patrimônio e, através de visão computacional, identifique o ID na moldura fina, processe através de OCR, e busque automaticamente no banco do GLPI os dados completos do equipamento correspondente. Isso centraliza o esforço da máquina, evita falha humana (por erro de digitação), e acelera fluxos repetitivos e cadenciais de manutenção e chamados.

## User Review Required

A arquitetura que você desenhou faz **total sentido** e é a abordagem padrão-ouro na engenharia de software contemporânea aplicada para projetos de visão computacional desse tipo. A separação entre *O Cão de Guarda* (YOLO para detecção da região de interesse) e *A Tesoura/Leitor* (Recorte + OCR focado num espaço limpo) eleva drasticamente a precisão contra fundos complexos (sujeira, reflexos, cabos envolta).

> [!IMPORTANT]
> **Hospedagem do Backend** 
> Processamentos com redes neurais (como o YOLO) e OCR exigem da CPU/Memória. Você já previu essa carga na hospedagem/servidor atual do projeto?
> 
> **GLPI Tokens**
> Para o "reverso do importador", precisaremos garantir que o backend da aplicação possua o `App-Token` e o método de autenticação por *User Token* habilitados via REST API do seu servidor GLPI.
>
> **Preparação do Dataset**
> O treinamento inicial depende de você: Precisaremos que você provisione essa coleta das 100-200 fotos variadas antes que o pipeline de software possa identificar confiavelmente as etiquetas reais no seu ambiente de produção.

## Componentes da Arquitetura

O ecossistema é quebrado em três macro-componentes, agindo de forma síncrona.

---

### 1. Modelo de Inteligência Artificial (O Dataset local e Roboflow)
Nesta fase criaremos e treinaremos a "inteligência" que será instalada e embarcada dentro da aplicação.

#### [NEW] `dataset_treinamento/` (Pasta Local / Roboflow)
- **Coleta:** Você irá capturar pelo menos 100-200 fotos das etiquetas de patrimônio contidas nas máquinas em campo. Variando intencionalmente: flash, sombra, rasuras, perto, inclinado.
- **Anotação:** Subir no *Roboflow*, fazer as bounding boxes ao redor de todas essas *molduras finas com os números do ID*.
- **Exportação e Treinamento:** Realizar via Google Colab ou localmente a importação de `ultralytics` para aplicar a inteligência (YOLOv8) em cima do dataset do Roboflow; com menos de 20 linhas geraremos o arquivo base de pesos final (algo como `yolov8n-custom.pt`), que será "o cérebro".

---

### 2. O Backend e Controlador Principal ("O Cérebro")
Idealizado ser construído em **FastAPI** (Python), por sua tipagem, alta performance e capacidade excelente de dialogar com bibliotecas de AI e array-manipulation (`numpy`, `cv2`).

#### [NEW] `backend/routes/vision.py`
Endpoints POST que processarão requisições binárias enviadas do PWA do técnico.
- Responsável por expor a rota principal: `POST /api/identify-asset`. 

#### [NEW] `backend/services/detector_service.py`
Fará três tarefas cruciais sob o frame recebido pelo endpoint e armazenado em memória:
- **Detecção YOLO:** Irá carregar o modelo treinado (`best.pt`). Ele recebe um frame JPG/PNG inteiro (a foto do técnico), analisa e retorna coordenadas `[X, Y, Width, Height]`.
- **Recorte (OpenCV):** Com as coordenadas, usará um array slicing do `cv2` para cortar a foto enorme, extraindo apenas (literalmente o retângulo limpo focado apenas no número).
- **OCR (Tesseract/EasyOCR):** Pega esse pedacinho recortado (já sem artefatos ou distrações de fundo), aplica thresholding/limpeza de grãos se necessário, converte em texto (string) e filtra os dígitos, devolvendo — *Exemplo: `1492`*.

#### [NEW] `backend/services/glpi_service.py`
Consumirá o dado devolvido do OCR para conectar com seu GLPI ativo.
- Criará requisição HTTP contra `/apirest.php/Computer/?searchText={id_detectado}` informando os devidos tokens de cabeçalho.
- Fatiará o JSON retornado do seu banco e trará campos estruturados: `modelo`, `localização do ativo`, `nome do usuário ativo`, `status`.

---

### 3. Front-end PWA ("O Ponto de Contato Móvel")
Onde o técnico aciona tudo via navegador Mobile.

#### [NEW] `frontend/src/components/CameraUploader.tsx` (ou equivalente no ecossistema Vite/React)
- Usará a web API padrão HTML5: `<video>` associado ao `navigator.mediaDevices.getUserMedia` para invocar as lentes do celular (priorizando `"environment"` na config para acionar a câmera ou flash traseiro).
- Um botão de _"Tirar Foto"_, que congela o canvas (vídeo), extrai o frame em Base64/Blob, e lança pela rede (Axios ou fetch) até nosso Backend.

#### [MODIFY] As Views e Lógica do Front-end
- Terá loading states (exibindo ao usuário interações amigáveis como: `"Localizando Equipamento..."` -> `"Consultando Base GLPI..."`).
- Receberá o JSON enriquecido do Backend para pré-preencher inputs das *Ordens de Serviço* e fichas técnicas diretamente na UI, removendo todo o atrito mecânico do profissional.

## 💡 Ideias para Agregar Valor (Sugestões de Arquitetura)

Pensando em ganho tecnológico e usabilidade extrema, aqui vão refinos que transformarão um "bom projeto" num "case de sucesso":

1. **"Edge Computing" (Cortar no Celular, não no Servidor)**
   - *O problema:* Enviar foto de 12MP (4K) de câmera de celular por 3G/4G para o servidor processar gasta muita banda (pode demorar segundos preciosos) e pesa para o servidor recarregar a imagem.
   - *A solução:* Exportar seu modelo YOLO para rodar **no próprio navegador do celular** (usando *Tensorflow.js* ou *ONNX Runtime Web*). O celular acha a moldura na tela "ao vivo", recorta o canvas, e envia para o backend **apenas** aquele pedacinho mínimo da imagem. O payload que viajaria 8MB viaja com 15KB. Rápido e instantâneo.

2. **Feedback Loop (Aprendizado Contínuo Automático)**
   - O que acontece quando o OCR erra (ex: Lê `1402` mas era `14O2` ou a foto tava embaçada)? O técnico terá o botão para corrigir o ID na tela, certo?
   - Quando o técnico "sobrescreve" esse input apontando o valor correto, o frontend enviará silenciosamente a foto que deu errado + o novo valor num endpoint `POST /api/feedback`. 
   - Essa foto vai para uma pasta separada, e todo mês o modelo fará re-treinamento com os "falsos positivos", tornando o modelo cada vez melhor *sozinho*, sem você precisar ficar tirando foto manualmente depois do "Dia 1".

3. **Pré-Filtros de OCR (Regras de Negócio e Regex)**
   - O ID tem um padrão forte? (ex: tem sempre 5 números).
   - Se aplicarmos expressões regulares (Regex) de padronização assim que ele lê o OCR e testarmos checksums e lógicas, você pode evitar um hit desnecessário na API do GLPI por sabermos matematicamente que o código extraído está quebrado.

### 🚀 Otimização Extrema: A Arquitetura "Serverless" (100% no Celular)
Se você me pede para **enxugar ao máximo**, podemos **deletar a necessidade do Backend em Python inteiro**. E construir a seguinte arquitetura:

- **Passo 1:** Treinamos o YOLO normalmente.
- **Passo 2:** Exportamos ele de Python para Javascript (ONNX ou TensorFlow.js).
- **Passo 3:** Instalamos o `Tesseract.js` (isso mesmo, o motor de OCR completo mas rodando dento do navegador do celular do cliente!).
- **Fluxo Mágico:** O usuário abre o celular (onde o `.js` e o YOLO ficam cacheados no browser em Offline). A própria antena do celular processa o *feed* da câmera a 30fps usando o seu processador Snapdragon/Apple local, o browser enxerga a etiqueta, o Canvas usa JavaScript para recortá-la, passa a imagem via `Tesseract.js` ali mesmo na memória do Chrome e extrai o ID "1492" sem utilizar a internet.
- A única requisição à internet que o sistema precisará fazer em toda a vida é do celular direto para a sua API do GLPI buscar os dados finais num `fetch()`.
- *Por que essa é a otimização final?* Porque você zera seus custos com infraestrutura pesada (servidores pra rodar python, fila, memória RAM pra imagem). Tudo roda de graça no poder de processamento do smartphone do técnico!

## Verificação do Plano

### Testes e Execução
1. **Ambiente Local Inicial:** Faremos testes unitários apenas mandando arquivos estáticos criados no PC (ex: `postman / curl post asset_233.jpg`), validando do YOLO ao OCR, até o GLPI retornar o JSON com um token de dev.
2. **Teste WebCamera:** Habilitar integração frontXback testando via câmera num localhost, focando a câmera num ID mockado na tela ou papel impresso.
3. **Teste PWA/Rede Local:** Pelo celular, garantir o acesso do aplicativo acessando a Câmera e efetuando com sucesso uma chamada para backend rodando no PC na mesma via de tráfego, assegurando performance responsiva.
