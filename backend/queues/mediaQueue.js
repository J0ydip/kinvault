const { Queue } = require('bullmq');
require('dotenv').config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const mediaQueue = new Queue('media-transcoding', { connection });

module.exports = mediaQueue;
