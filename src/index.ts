import 'dotenv/config';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { processAudio } from './audio-processor.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024 // 50MB limit for audio files
});

// Register multipart plugin for file uploads
fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Audio processing endpoint
fastify.post('/process-audio', async (request, reply) => {
    try {
        const data = await request.file();

        if (!data) {
            return reply.code(400).send({ error: 'No audio file provided' });
        }

        // Validate file type
        if (!data.mimetype?.includes('audio') && !data.filename?.endsWith('.oga')) {
            return reply.code(400).send({ error: 'Invalid file type. Expected audio file or .oga format' });
        }

        fastify.log.info(`Processing audio file: ${data.filename}, type: ${data.mimetype}`);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        await fs.ensureDir(tempDir);

        // Generate unique filename for temp files
        const timestamp = Date.now();
        const inputPath = path.join(tempDir, `input_${timestamp}.oga`);
        const outputPath = path.join(tempDir, `output_${timestamp}.mp3`);

    try {
      // Save uploaded file to temp directory
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(inputPath, buffer);

      // Process the audio
      const processedAudioPath = await processAudio(inputPath, outputPath);            // Read the processed file
            const processedAudio = await fs.readFile(processedAudioPath);

            // Set response headers
            reply.header('Content-Type', 'audio/mpeg');
            reply.header('Content-Disposition', 'attachment; filename="processed_audio.mp3"');

            // Clean up temp files
            await fs.remove(inputPath);
            await fs.remove(outputPath);

            return reply.send(processedAudio);

        } catch (processingError) {
            // Clean up temp files in case of error
            await fs.remove(inputPath).catch(() => { });
            await fs.remove(outputPath).catch(() => { });
            throw processingError;
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error(`Error processing audio: ${errorMessage}`);
        return reply.code(500).send({
            error: 'Failed to process audio',
            details: errorMessage
        });
    }
});

// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000');
        const host = process.env.HOST || '0.0.0.0';

        await fastify.listen({ port, host });
        fastify.log.info(`FFmpeg Audio Processing Service started on http://${host}:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
