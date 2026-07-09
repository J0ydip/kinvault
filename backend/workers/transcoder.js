const { Worker } = require('bullmq');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
const path = require('path');
const fs = require('fs');
const db = require('../db');
require('dotenv').config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const processMedia = async (job) => {
  const { mediaId, userId, filename } = job.data;
  
  const userDir = path.join(__dirname, '../../uploads', `user_${userId}`);
  const inputPath = path.join(userDir, filename);
  
  // Create output filenames
  const baseName = path.parse(filename).name;
  const outputFilename = `${baseName}_transcoded.mp4`;
  const outputPath = path.join(userDir, outputFilename);
  const thumbFilename = `${baseName}_thumb.jpg`;
  const thumbPath = path.join(userDir, thumbFilename);

  return new Promise((resolve, reject) => {
    // Analyze video codecs first
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      let canStreamCopy = false;

      if (!err && metadata && metadata.streams) {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const hasCompatibleVideo = videoStream && (videoStream.codec_name === 'h264' || videoStream.codec_name === 'hevc');
        const hasCompatibleAudio = !audioStream || audioStream.codec_name === 'aac';
        
        canStreamCopy = hasCompatibleVideo && hasCompatibleAudio;
      } else if (err) {
        console.warn(`Could not probe video ${filename}:`, err.message);
      }

      runTranscode(canStreamCopy);
    });

    function runTranscode(canStreamCopy) {
      // Step 1: Generate Thumbnail
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['00:00:01.000'],
          filename: thumbFilename,
          folder: userDir,
          size: '320x240'
        })
        .on('end', () => {
          // Step 2: Transcode Video
          const cmd = ffmpeg(inputPath);
          
          if (canStreamCopy) {
            console.log(`[Smart Transcode] Stream copying ${filename}...`);
            cmd.outputOptions([
              '-c copy',
              '-movflags +faststart'
            ]);
          } else {
            console.log(`[Smart Transcode] Re-encoding ${filename}...`);
            cmd.outputOptions([
              '-c:v libx264',
              '-preset fast',
              '-crf 22',
              '-pix_fmt yuv420p',
              '-c:a aac',
              '-b:a 128k',
              '-movflags +faststart'
            ]);
          }

          cmd.output(outputPath)
            .on('end', async () => {
              try {
                // Video transcoding finished
                setTimeout(() => {
                  try {
                    if (fs.existsSync(inputPath)) {
                      fs.unlinkSync(inputPath);
                    }
                  } catch (err) {
                    console.warn('Could not delete original file:', err.message);
                  }
                }, 2000);

                // Update DB record
                await db.query(
                  "UPDATE media SET filename = $1, thumbnail = $2, file_type = 'video/mp4', status = 'ready' WHERE id = $3",
                  [outputFilename, thumbFilename, mediaId]
                );

                resolve({ mediaId, userId, status: 'ready' });
              } catch (error) {
                reject(error);
              }
            })
            .on('error', (err) => {
              console.error(`Error transcoding media ${mediaId}:`, err);
              reject(err);
            })
            .run();
        })
        .on('error', (err) => {
          console.error(`Error generating thumbnail for media ${mediaId}:`, err);
          // Even if thumbnail fails, try to transcode the video
          reject(err);
        });
    }
  });
};

const worker = new Worker('media-transcoding', processMedia, { connection });

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

console.log('Transcoder worker started');

module.exports = worker;
