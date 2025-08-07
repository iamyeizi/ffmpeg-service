import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';

export interface AudioProcessingOptions {
    bitrate?: string;
    removeMinSilence?: number; // minimum silence duration to remove in seconds
    silenceThreshold?: string; // silence threshold (default: -50dB)
}

/**
 * Process audio file: remove silences and convert to MP3
 * @param inputPath Path to input .oga file
 * @param outputPath Path for output .mp3 file
 * @param options Processing options
 * @returns Promise that resolves to the output file path
 */
export async function processAudio(
    inputPath: string,
    outputPath: string,
    options: AudioProcessingOptions = {}
): Promise<string> {
    const {
        bitrate = '128k',
        removeMinSilence = 0.5, // Remove silences longer than 0.5 seconds
        silenceThreshold = '-50dB'
    } = options;

    return new Promise((resolve, reject) => {
        // First, check if input file exists
        if (!fs.existsSync(inputPath)) {
            reject(new Error(`Input file does not exist: ${inputPath}`));
            return;
        }

        console.log(`Processing audio: ${inputPath} -> ${outputPath}`);
        console.log(`Options: bitrate=${bitrate}, minSilence=${removeMinSilence}s, threshold=${silenceThreshold}`);

        // Create FFmpeg command
        const command = ffmpeg(inputPath)
            // Remove silences using the silenceremove filter
            .audioFilters([
                {
                    filter: 'silenceremove',
                    options: [
                        `start_periods=1`,                    // Remove silence at the start
                        `start_duration=${removeMinSilence}`, // Minimum duration to consider as silence
                        `start_threshold=${silenceThreshold}`, // Threshold for silence detection
                        `stop_periods=-1`,                    // Remove all silences (not just at the end)
                        `stop_duration=${removeMinSilence}`,  // Minimum duration to consider as silence
                        `stop_threshold=${silenceThreshold}`   // Threshold for silence detection
                    ]
                }
            ])
            // Set audio codec and bitrate
            .audioCodec('libmp3lame')
            .audioBitrate(bitrate)
            // Set output format
            .format('mp3')
            // Ensure we overwrite output file if it exists
            .outputOptions('-y')
            // Set output path
            .output(outputPath);

        // Handle events
        command
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`Processing: ${Math.round(progress.percent)}% done`);
                }
            })
            .on('end', () => {
                console.log('Audio processing completed successfully');
                resolve(outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('FFmpeg error:', err.message);
                console.error('FFmpeg stderr:', stderr);
                reject(new Error(`FFmpeg processing failed: ${err.message}`));
            });

        // Start processing
        command.run();
    });
}

/**
 * Get audio file information
 * @param filePath Path to audio file
 * @returns Promise with audio metadata
 */
export async function getAudioInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata);
            }
        });
    });
}
