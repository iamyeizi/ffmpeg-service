# FFmpeg Audio Processing Service

Servicio en TypeScript con Fastify para procesar archivos de audio (.oga) eliminando silencios y convirtiéndolos a MP3.

## Características

- Recibe archivos de audio .oga vía HTTP POST
- Elimina silencios automáticamente
- Convierte a MP3 con bitrate configurable (default: 128k)
- Diseñado para integrarse con n8n
- API RESTful con manejo de errores

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
```bash
npm install
```

3. Asegúrate de tener FFmpeg instalado en tu sistema:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# MacOS
brew install ffmpeg

# Windows
# Descarga desde https://ffmpeg.org/download.html
```

## Configuración

Edita el archivo `.env` para configurar:

```env
PORT=3000
HOST=0.0.0.0
# Audio processing settings
AUDIO_BITRATE=128k
MIN_SILENCE_DURATION=0.5
SILENCE_THRESHOLD=-50dB
```

## Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### API Endpoints

#### POST /process-audio
Procesa un archivo de audio eliminando silencios y convirtiendo a MP3.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Archivo de audio (.oga)

**Response:**
- Content-Type: `audio/mpeg`
- Body: Archivo MP3 procesado

**Ejemplo con curl:**
```bash
curl -X POST \
  -F "file=@audio.oga" \
  http://localhost:3000/process-audio \
  --output processed_audio.mp3
```

#### GET /health
Verifica el estado del servicio.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Integración con n8n

### Configuración del nodo HTTP Request en n8n:

1. **URL:** `http://tu-servidor:3000/process-audio`
2. **Method:** `POST`
3. **Body:** `Form-Data`
4. **Attach:** El archivo de audio .oga
5. **Response:** `File`

### Ejemplo de flujo n8n:

1. **Trigger:** Webhook o Telegram Bot
2. **HTTP Request:** Envía el audio a este servicio
3. **Set:** Procesa la respuesta
4. **HTTP Request:** Envía el audio procesado de vuelta

## Parámetros de procesamiento

El servicio utiliza los siguientes parámetros por defecto para eliminar silencios:

- **Bitrate:** 128k (óptimo para voz)
- **Duración mínima de silencio:** 0.5 segundos
- **Umbral de silencio:** -50dB

Estos valores están optimizados para grabaciones de voz de Telegram, pero pueden ajustarse en el código si es necesario.

## Límites

- Tamaño máximo de archivo: 50MB
- Formatos soportados: .oga, y otros formatos de audio
- Timeout: Sin límite específico (depende del tamaño del archivo)

## Logs

El servicio incluye logging detallado que muestra:
- Archivos recibidos
- Progreso de procesamiento
- Comandos FFmpeg ejecutados
- Errores y detalles

## Troubleshooting

### Error: FFmpeg not found
- Asegúrate de que FFmpeg esté instalado y en el PATH
- Verifica con: `ffmpeg -version`

### Error: File too large
- Ajusta el límite en `bodyLimit` y `limits.fileSize`

### Error: Processing failed
- Revisa los logs para ver el comando FFmpeg específico
- Verifica que el archivo de entrada sea válido
