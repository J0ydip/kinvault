CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR NOT NULL,
  original_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  size INTEGER NOT NULL,
  status VARCHAR DEFAULT 'ready',
  thumbnail VARCHAR,
  is_favorite BOOLEAN DEFAULT FALSE,
  exif_make VARCHAR,
  exif_model VARCHAR,
  exif_lens_model VARCHAR,
  exif_date_taken TIMESTAMP,
  exif_latitude FLOAT,
  exif_longitude FLOAT,
  exif_width INTEGER,
  exif_height INTEGER,
  exif_iso INTEGER,
  exif_aperture FLOAT,
  exif_shutter_speed VARCHAR,
  exif_focal_length FLOAT,
  duration FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE albums (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE album_media (
  album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
  media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (album_id, media_id)
);
