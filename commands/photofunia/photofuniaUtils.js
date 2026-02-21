import axios from 'axios';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const API_BASE = 'https://apis.xcasper.space/api/photofunia/generate';

const EFFECTS = {
  'smoke-flare': { effect: 'smoke-flare', name: 'Smoke Flare', type: 'image', emoji: '🌫️', category: 'halloween' },
  'nightmare-writing': { effect: 'nightmare-writing', name: 'Nightmare Writing', type: 'text', emoji: '👻', category: 'halloween' },
  'lightning': { effect: 'lightning', name: 'Lightning', type: 'image', emoji: '⚡', category: 'halloween' },
  'cemetery-gates': { effect: 'cemetery-gates', name: 'Cemetery Gates', type: 'text', emoji: '⚰️', category: 'halloween' },
  'summoning-spirits': { effect: 'summoning-spirits', name: 'Summoning Spirits', type: 'image', emoji: '👹', category: 'halloween' },
  'ghostwood': { effect: 'ghostwood', name: 'Ghostwood', type: 'image', emoji: '🎃', category: 'halloween' },

  'autumn': { effect: 'autumn', name: 'Autumn', type: 'image', emoji: '🍂', category: 'filters' },
  'jade': { effect: 'jade', name: 'Jade', type: 'image', emoji: '💚', category: 'filters' },
  'romantic': { effect: 'romantic', name: 'Romantic', type: 'image', emoji: '💕', category: 'filters' },
  'mystical': { effect: 'mystical', name: 'Mystical', type: 'image', emoji: '🔮', category: 'filters' },
  'lomography': { effect: 'lomography', name: 'Lomography', type: 'image', emoji: '📷', category: 'filters' },
  'sepia': { effect: 'sepia', name: 'Sepia', type: 'image', emoji: '🟤', category: 'filters' },

  'watercolour-text': { effect: 'watercolour-text', name: 'Watercolour Text', type: 'text', emoji: '🎨', category: 'lab', textParams: ['text', 'text2'] },
  'denim-emdroidery': { effect: 'denim-emdroidery', name: 'Denim Embroidery', type: 'text', emoji: '🧵', category: 'lab' },
  'cinema-ticket': { effect: 'cinema-ticket', name: 'Cinema Ticket', type: 'text', emoji: '🎬', category: 'lab', textParams: ['text1', 'text2'] },
  'arrow-signs': { effect: 'arrow-signs', name: 'Arrow Signs', type: 'text', emoji: '➡️', category: 'lab', textParams: ['text1', 'text2'] },
  'yacht': { effect: 'yacht', name: 'Yacht', type: 'text', emoji: '🛥️', category: 'lab' },
  'cloudy-filter': { effect: 'cloudy-filter', name: 'Cloudy Filter', type: 'image', emoji: '☁️', category: 'lab' },
  'light-graffiti': { effect: 'light-graffiti', name: 'Light Graffiti', type: 'text', emoji: '💡', category: 'lab' },
  'chalkboard': { effect: 'chalkboard', name: 'Chalkboard', type: 'text', emoji: '📝', category: 'lab', textParams: ['text', 'text2'] },
  'rusty-writing': { effect: 'rusty-writing', name: 'Rusty Writing', type: 'text', emoji: '🔩', category: 'lab' },
  'street-sign': { effect: 'street-sign', name: 'Street Sign', type: 'text', emoji: '🪧', category: 'lab' },
  'floral-wreath': { effect: 'floral-wreath', name: 'Floral Wreath', type: 'image', emoji: '💐', category: 'lab' },
  'retro-wave': { effect: 'retro-wave', name: 'Retro Wave', type: 'text', emoji: '🌊', category: 'lab', textParams: ['text1', 'text2', 'text3'] },
  'you-are-my-universe': { effect: 'you-are-my-universe', name: 'You Are My Universe', type: 'image', emoji: '🌌', category: 'lab' },
  'einstein': { effect: 'einstein', name: 'Einstein', type: 'text', emoji: '🧠', category: 'lab' },
  'rugby-ball': { effect: 'rugby-ball', name: 'Rugby Ball', type: 'text', emoji: '🏉', category: 'lab' },
  'red-and-blue': { effect: 'red-and-blue', name: 'Red and Blue', type: 'image', emoji: '🔴', category: 'lab' },
  'vhs': { effect: 'vhs', name: 'VHS', type: 'image', emoji: '📼', category: 'lab' },
  'typewriter': { effect: 'typewriter', name: 'Typewriter', type: 'text', emoji: '⌨️', category: 'lab' },
  'diptych': { effect: 'diptych', name: 'Diptych', type: 'image', emoji: '🖼️', category: 'lab' },
  'badges': { effect: 'badges', name: 'Badges', type: 'text+image', emoji: '🏅', category: 'lab' },
  'wanted': { effect: 'wanted', name: 'Wanted', type: 'text+image', emoji: '🤠', category: 'lab', textParams: ['text1', 'text2', 'name', 'reward', 'signed'] },
  'crown': { effect: 'crown', name: 'Crown', type: 'image', emoji: '👑', category: 'lab' },
  'anime': { effect: 'anime', name: 'Anime', type: 'image', emoji: '🎌', category: 'lab' },
  'popart': { effect: 'popart', name: 'Pop Art', type: 'image', emoji: '🎭', category: 'lab' },
  'puzzle': { effect: 'puzzle', name: 'Puzzle', type: 'image', emoji: '🧩', category: 'lab' },
  'glass': { effect: 'glass', name: 'Glass', type: 'image', emoji: '🪟', category: 'lab' },
  'animator': { effect: 'animator', name: 'Animator', type: 'image', emoji: '🎞️', category: 'lab' },

  'posters-on-the-wall': { effect: 'posters-on-the-wall', name: 'Posters On The Wall', type: 'image', emoji: '🖼️', category: 'posters' },
  'poster-wall': { effect: 'poster-wall', name: 'Poster Wall', type: 'image', emoji: '📌', category: 'posters' },
  'train-station-poster': { effect: 'train-station-poster', name: 'Train Station Poster', type: 'image', emoji: '🚂', category: 'posters' },
  'rainy-night': { effect: 'rainy-night', name: 'Rainy Night', type: 'image', emoji: '🌧️', category: 'posters' },
  'night-motion': { effect: 'night-motion', name: 'Night Motion', type: 'image', emoji: '🌃', category: 'posters' },
  'campaign': { effect: 'campaign', name: 'Campaign', type: 'image', emoji: '📢', category: 'posters' },
  'bicycle': { effect: 'bicycle', name: 'Bicycle', type: 'image', emoji: '🚲', category: 'posters' },
  'citylight': { effect: 'citylight', name: 'Citylight', type: 'image', emoji: '🏙️', category: 'posters' },
  'affiche': { effect: 'affiche', name: 'Affiche', type: 'text+image', emoji: '🎭', category: 'posters' },
  'sidewalk': { effect: 'sidewalk', name: 'Sidewalk', type: 'image', emoji: '🚶', category: 'posters' },
  'cyclist': { effect: 'cyclist', name: 'Cyclist', type: 'image', emoji: '🚴', category: 'posters' },
  'tulips': { effect: 'tulips', name: 'Tulips', type: 'image', emoji: '🌷', category: 'posters' },
  'cafe': { effect: 'cafe', name: 'Cafe', type: 'image', emoji: '☕', category: 'posters' },
  'underground': { effect: 'underground', name: 'Underground', type: 'image', emoji: '🚇', category: 'posters' },
  'reconstruction': { effect: 'reconstruction', name: 'Reconstruction', type: 'image', emoji: '🏗️', category: 'posters' },
  'posters': { effect: 'posters', name: 'Posters', type: 'image', emoji: '📜', category: 'posters' },

  'melbourne-gallery': { effect: 'melbourne-gallery', name: 'Melbourne Gallery', type: 'image', emoji: '🏛️', category: 'galleries' },
  'art-admirer': { effect: 'art-admirer', name: 'Art Admirer', type: 'image', emoji: '🧐', category: 'galleries' },
  'national-gallery-in-london': { effect: 'national-gallery-in-london', name: 'National Gallery London', type: 'image', emoji: '🇬🇧', category: 'galleries' },
  'black-white-gallery': { effect: 'black-white-gallery', name: 'Black White Gallery', type: 'image', emoji: '⬛', category: 'galleries' },
  'gallery-visitor': { effect: 'gallery-visitor', name: 'Gallery Visitor', type: 'image', emoji: '🚶‍♂️', category: 'galleries' },
  'painting-and-sketches': { effect: 'painting-and-sketches', name: 'Painting and Sketches', type: 'image', emoji: '🖌️', category: 'galleries' },
  'passing-by-the-painting': { effect: 'passing-by-the-painting', name: 'Passing By The Painting', type: 'image', emoji: '🚶', category: 'galleries' },
  'silhouettes': { effect: 'silhouettes', name: 'Silhouettes', type: 'image', emoji: '👤', category: 'galleries' },
  'rijskmuseum': { effect: 'rijskmuseum', name: 'Rijksmuseum', type: 'text+image', emoji: '🏰', category: 'galleries' },

  'old-camera': { effect: 'old-camera', name: 'Old Camera', type: 'image', emoji: '📸', category: 'photography' },
  'kitty-and-frame': { effect: 'kitty-and-frame', name: 'Kitty and Frame', type: 'image', emoji: '🐱', category: 'photography' },
  'frame': { effect: 'frame', name: 'Frame', type: 'image', emoji: '🖼️', category: 'photography' },

  'mirror': { effect: 'mirror', name: 'Mirror', type: 'image', emoji: '🪞', category: 'faces' },
  'formula-one-racer': { effect: 'formula-one-racer', name: 'Formula One Racer', type: 'image', emoji: '🏎️', category: 'faces' },
  'warrior': { effect: 'warrior', name: 'Warrior', type: 'image', emoji: '⚔️', category: 'faces' },
  'knight': { effect: 'knight', name: 'Knight', type: 'image', emoji: '🛡️', category: 'faces' },
  'biker': { effect: 'biker', name: 'Biker', type: 'image', emoji: '🏍️', category: 'faces' },
  'surfer': { effect: 'surfer', name: 'Surfer', type: 'image', emoji: '🏄', category: 'faces' },
  'snowboard': { effect: 'snowboard', name: 'Snowboard', type: 'image', emoji: '🏂', category: 'faces' },
  'dj': { effect: 'dj', name: 'DJ', type: 'image', emoji: '🎧', category: 'faces' },
  'bodybuilder': { effect: 'bodybuilder', name: 'Bodybuilder', type: 'image', emoji: '💪', category: 'faces' },
  'lulu': { effect: 'lulu', name: 'Lulu', type: 'image', emoji: '👧', category: 'faces' },
  'hockey': { effect: 'hockey', name: 'Hockey', type: 'image', emoji: '🏒', category: 'faces' },
  'ethanol': { effect: 'ethanol', name: 'Ethanol', type: 'image', emoji: '⛽', category: 'faces' },
  'godfather': { effect: 'godfather', name: 'Godfather', type: 'image', emoji: '🎩', category: 'faces' },
  'pirates': { effect: 'pirates', name: 'Pirates', type: 'image', emoji: '🏴‍☠️', category: 'faces' },
  'miss': { effect: 'miss', name: 'Miss', type: 'text+image', emoji: '👸', category: 'faces' },

  'concrete-jungle': { effect: 'concrete-jungle', name: 'Concrete Jungle', type: 'image', emoji: '🏙️', category: 'billboards' },
  'broadway-at-night': { effect: 'broadway-at-night', name: 'Broadway At Night', type: 'image', emoji: '🌃', category: 'billboards' },
  'new-york-at-night': { effect: 'new-york-at-night', name: 'New York At Night', type: 'image', emoji: '🗽', category: 'billboards' },
  'shopping-arcade': { effect: 'shopping-arcade', name: 'Shopping Arcade', type: 'image', emoji: '🛍️', category: 'billboards' },
  'old-tram': { effect: 'old-tram', name: 'Old Tram', type: 'image', emoji: '🚋', category: 'billboards' },
  'worker-by-the-billboard': { effect: 'worker-by-the-billboard', name: 'Worker By The Billboard', type: 'image', emoji: '👷', category: 'billboards' },
  'evening-billboard': { effect: 'evening-billboard', name: 'Evening Billboard', type: 'image', emoji: '🌆', category: 'billboards' },
  'pedestrian-crossing': { effect: 'pedestrian-crossing', name: 'Pedestrian Crossing', type: 'image', emoji: '🚸', category: 'billboards' },
  'cube': { effect: 'cube', name: 'Cube', type: 'image', emoji: '🧊', category: 'billboards' },
  'nyc': { effect: 'nyc', name: 'NYC', type: 'image', emoji: '🏢', category: 'billboards' },
  'city': { effect: 'city', name: 'City', type: 'image', emoji: '🌇', category: 'billboards' },
  'ax': { effect: 'ax', name: 'AX', type: 'image', emoji: '🪓', category: 'billboards' },

  'trump': { effect: 'trump', name: 'Trump', type: 'text+image', emoji: '🇺🇸', category: 'celebrities' },
  'obama': { effect: 'obama', name: 'Obama', type: 'image', emoji: '🎤', category: 'celebrities' },
  'madonna': { effect: 'madonna', name: 'Madonna', type: 'image', emoji: '🎶', category: 'celebrities' },
  'putin': { effect: 'putin', name: 'Putin', type: 'image', emoji: '🇷🇺', category: 'celebrities' },

  'the-frame': { effect: 'the-frame', name: 'The Frame', type: 'image', emoji: '🖼️', category: 'frames' },
  'at-the-beach': { effect: 'at-the-beach', name: 'At The Beach', type: 'image', emoji: '🏖️', category: 'frames' },
  'lavander': { effect: 'lavander', name: 'Lavender', type: 'image', emoji: '💜', category: 'frames' },
  'reproduction': { effect: 'reproduction', name: 'Reproduction', type: 'image', emoji: '🎨', category: 'frames' },
  'daffodils': { effect: 'daffodils', name: 'Daffodils', type: 'text+image', emoji: '🌼', category: 'frames' },

  'painter': { effect: 'painter', name: 'Painter', type: 'image', emoji: '🎨', category: 'drawings' },
  'explorer-drawing': { effect: 'explorer-drawing', name: 'Explorer Drawing', type: 'image', emoji: '🗺️', category: 'drawings' },
  'artist-in-a-hat': { effect: 'artist-in-a-hat', name: 'Artist In A Hat', type: 'image', emoji: '🎩', category: 'drawings' },
  'drawing-lesson': { effect: 'drawing-lesson', name: 'Drawing Lesson', type: 'image', emoji: '✏️', category: 'drawings' },
  'brugge': { effect: 'brugge', name: 'Brugge', type: 'image', emoji: '🏘️', category: 'drawings' },
  'watercolours': { effect: 'watercolours', name: 'Watercolours', type: 'image', emoji: '🎨', category: 'drawings' },
  'truck': { effect: 'truck', name: 'Truck', type: 'image', emoji: '🚚', category: 'drawings' },
  'portrait': { effect: 'portrait', name: 'Portrait', type: 'image', emoji: '🖌️', category: 'drawings' },

  'quill': { effect: 'quill', name: 'Quill', type: 'text+image', emoji: '🪶', category: 'vintage' },
  'stamps': { effect: 'stamps', name: 'Stamps', type: 'image', emoji: '📮', category: 'vintage' },

  'magic-card': { effect: 'magic-card', name: 'Magic Card', type: 'image', emoji: '🃏', category: 'misc' },
  'postage-stamp': { effect: 'postage-stamp', name: 'Postage Stamp', type: 'image', emoji: '📬', category: 'misc' },
  'truck-advert': { effect: 'truck-advert', name: 'Truck Advert', type: 'image', emoji: '🚛', category: 'misc' },
  'tablet': { effect: 'tablet', name: 'Tablet', type: 'image', emoji: '📱', category: 'misc' },
  'art-on-the-brick-wall': { effect: 'art-on-the-brick-wall', name: 'Art On The Brick Wall', type: 'image', emoji: '🧱', category: 'misc' },
  'toasts': { effect: 'toasts', name: 'Toasts', type: 'image', emoji: '🍞', category: 'misc' },
  'photowall': { effect: 'photowall', name: 'Photowall', type: 'image', emoji: '📸', category: 'misc' },
  'lego': { effect: 'lego', name: 'Lego', type: 'image', emoji: '🧱', category: 'misc' },
  'wall': { effect: 'wall', name: 'Wall', type: 'image', emoji: '🏠', category: 'misc' },
  'eye': { effect: 'eye', name: 'Eye', type: 'image', emoji: '👁️', category: 'misc' },
  'morning-mug': { effect: 'morning-mug', name: 'Morning Mug', type: 'text+image', emoji: '☕', category: 'misc' },
  'top-secret': { effect: 'top-secret', name: 'Top Secret', type: 'text+image', emoji: '🔒', category: 'misc', textParams: ['name', 'codename', 'birthdate', 'citizen', 'language', 'hair'] },
  'breaking-news': { effect: 'breaking-news', name: 'Breaking News', type: 'text+image', emoji: '📰', category: 'misc', textParams: ['channel', 'title1', 'title2'] },
  'vinyl-record': { effect: 'vinyl-record', name: 'Vinyl Record', type: 'text+image', emoji: '💿', category: 'misc', textParams: ['artist', 'album'] },
  'beer': { effect: 'beer', name: 'Beer', type: 'text+image', emoji: '🍺', category: 'misc' },
  'coin': { effect: 'coin', name: 'Coin', type: 'text+image', emoji: '🪙', category: 'misc' },

  'reading-magazine': { effect: 'reading-magazine', name: 'Reading Magazine', type: 'text+image', emoji: '📖', category: 'magazines', textParams: ['text', 'text2'] },
  'roses-and-marshmallows': { effect: 'roses-and-marshmallows', name: 'Roses and Marshmallows', type: 'image', emoji: '🌹', category: 'magazines' },
  'interview': { effect: 'interview', name: 'Interview', type: 'text+image', emoji: '🎙️', category: 'magazines', textParams: ['text1', 'text2', 'text3'] },
  'reading': { effect: 'reading', name: 'Reading', type: 'image', emoji: '📚', category: 'magazines' },
  'esquire': { effect: 'esquire', name: 'Esquire', type: 'image', emoji: '👔', category: 'magazines' },
  'vogue': { effect: 'vogue', name: 'Vogue', type: 'image', emoji: '👗', category: 'magazines' },

  'analogue-tv': { effect: 'analogue-tv', name: 'Analogue TV', type: 'image', emoji: '📺', category: 'tv' },

  'festive-reading': { effect: 'festive-reading', name: 'Festive Reading', type: 'text+image', emoji: '📖', category: 'books' },
  'the-book': { effect: 'the-book', name: 'The Book', type: 'text+image', emoji: '📕', category: 'books', textParams: ['text', 'text2'] },
  'very-old-book': { effect: 'very-old-book', name: 'Very Old Book', type: 'text+image', emoji: '📜', category: 'books', textParams: ['text', 'text2'] },

  'rose-vine': { effect: 'rose-vine', name: 'Rose Vine', type: 'text+image', emoji: '🌹', category: 'valentine', textParams: ['text', 'text2'] },
  'love-letter': { effect: 'love-letter', name: 'Love Letter', type: 'image', emoji: '💌', category: 'valentine' },
  'love-lock': { effect: 'love-lock', name: 'Love Lock', type: 'text', emoji: '🔐', category: 'valentine' },
  'wedding-day': { effect: 'wedding-day', name: 'Wedding Day', type: 'image', emoji: '💒', category: 'valentine' },
  'brooches': { effect: 'brooches', name: 'Brooches', type: 'image', emoji: '💎', category: 'valentine' },
  'valentine': { effect: 'valentine', name: 'Valentine', type: 'text+image', emoji: '❤️', category: 'valentine' },

  'easter-card': { effect: 'easter-card', name: 'Easter Card', type: 'text+image', emoji: '🐣', category: 'easter' },
  'bunnies': { effect: 'bunnies', name: 'Bunnies', type: 'image', emoji: '🐰', category: 'easter' },

  'snow-sign': { effect: 'snow-sign', name: 'Snow Sign', type: 'text', emoji: '❄️', category: 'christmas' },
  'christmas-writing': { effect: 'christmas-writing', name: 'Christmas Writing', type: 'text', emoji: '🎄', category: 'christmas' },
  'snow-globe': { effect: 'snow-globe', name: 'Snow Globe', type: 'text+image', emoji: '🔮', category: 'christmas', textParams: ['text1', 'text2'] },
  'frosty-window-writing': { effect: 'frosty-window-writing', name: 'Frosty Window Writing', type: 'text', emoji: '🪟', category: 'christmas' },
  'santa-snow-angel': { effect: 'santa-snow-angel', name: 'Santa Snow Angel', type: 'image', emoji: '🎅', category: 'christmas' },
  'santas-parcel-picture': { effect: 'santas-parcel-picture', name: "Santa's Parcel Picture", type: 'text+image', emoji: '🎁', category: 'christmas' },
  'new-year-frames': { effect: 'new-year-frames', name: 'New Year Frames', type: 'image', emoji: '🎆', category: 'christmas' },
};

const CATEGORY_META = {
  halloween: { emoji: '🎃', name: 'Halloween' },
  filters: { emoji: '🎨', name: 'Filters' },
  lab: { emoji: '🔬', name: 'Lab' },
  posters: { emoji: '📌', name: 'Posters' },
  galleries: { emoji: '🏛️', name: 'Galleries' },
  photography: { emoji: '📸', name: 'Photography' },
  faces: { emoji: '🎭', name: 'Faces' },
  billboards: { emoji: '🏙️', name: 'Billboards' },
  celebrities: { emoji: '⭐', name: 'Celebrities' },
  frames: { emoji: '🖼️', name: 'Frames' },
  drawings: { emoji: '✏️', name: 'Drawings' },
  vintage: { emoji: '📜', name: 'Vintage' },
  misc: { emoji: '🎲', name: 'Misc' },
  magazines: { emoji: '📰', name: 'Magazines' },
  tv: { emoji: '📺', name: 'TV' },
  books: { emoji: '📚', name: 'Books' },
  valentine: { emoji: '❤️', name: 'Valentine' },
  easter: { emoji: '🐣', name: 'Easter' },
  christmas: { emoji: '🎄', name: 'Christmas' },
};

function getEffectsByCategory(category) {
  return Object.entries(EFFECTS).filter(([, e]) => e.category === category);
}

function getAllCategories() {
  const cats = {};
  for (const [key, effect] of Object.entries(EFFECTS)) {
    if (!cats[effect.category]) cats[effect.category] = [];
    cats[effect.category].push({ key, ...effect });
  }
  return cats;
}

async function generatePhotofunia(effectSlug, options = {}) {
  const params = { effect: effectSlug };
  for (const [key, val] of Object.entries(options)) {
    if (val !== undefined && val !== null && val !== '') params[key] = val;
  }

  console.log(`🎨 [PHOTOFUNIA] Generating effect: ${effectSlug}`);
  const res = await axios.get(API_BASE, { params, timeout: 30000, responseType: 'arraybuffer' });

  if (res.headers['content-type']?.includes('image')) {
    return Buffer.from(res.data);
  }

  const text = Buffer.from(res.data).toString('utf-8');
  try {
    const json = JSON.parse(text);
    const imgUrl = json.url || json.image || json.result?.url || json.result?.image || json.data?.url || json.data?.image;
    if (imgUrl) {
      const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(imgRes.data);
    }
  } catch {}

  return Buffer.from(res.data);
}

async function getImageUrl(m, sock) {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;

  const isImage = quoted.imageMessage ||
    quoted.viewOnceMessage?.message?.imageMessage ||
    quoted.viewOnceMessageV2?.message?.imageMessage;

  if (!isImage) return null;

  try {
    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });
    const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });
    const tmpUrl = uploadRes.data?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    console.log(`📤 [PHOTOFUNIA] Uploaded image to: ${tmpUrl}`);
    return tmpUrl;
  } catch (err) {
    console.log(`❌ [PHOTOFUNIA] Image upload failed: ${err.message}`);
    return null;
  }
}

function createPhotofuniaCommand(effectKey) {
  const effectData = EFFECTS[effectKey];
  if (!effectData) throw new Error(`Unknown PhotoFunia effect: ${effectKey}`);

  const cmdName = effectKey.replace(/-/g, '');
  const aliases = [effectKey];
  if (cmdName !== effectKey) aliases.push(cmdName);

  return {
    name: cmdName,
    alias: aliases,
    description: `${effectData.emoji} ${effectData.name} Effect`,
    category: 'photofunia',
    ownerOnly: false,
    usage: effectData.type === 'image'
      ? `${cmdName} (reply to image)`
      : effectData.type === 'text'
        ? `${cmdName} <text>${effectData.textParams ? ' (use | to separate: ' + effectData.textParams.join(', ') + ')' : ''}`
        : `${cmdName} <text> (reply to image)${effectData.textParams ? ' (use | to separate: ' + effectData.textParams.join(', ') + ')' : ''}`,

    async execute(sock, msg, args, PREFIX) {
      const chatId = msg.key.remoteJid;
      const textArgs = args.join(' ');

      if (effectData.type === 'image') {
        const imageUrl = await getImageUrl(msg, sock);
        if (!imageUrl) {
          return await sock.sendMessage(chatId, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name.toUpperCase()}* ⌋\n│\n├─⊷ This effect requires an *image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}${cmdName}\n│\n╰───────────────\n> *WOLFBOT PHOTOFUNIA*`
          }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });
        try {
          const resultBuffer = await generatePhotofunia(effectData.effect, { imageUrl });
          if (!resultBuffer || resultBuffer.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            return await sock.sendMessage(chatId, { text: `❌ Failed to generate ${effectData.name} effect. Try again later.` }, { quoted: msg });
          }
          await sock.sendMessage(chatId, { image: resultBuffer, caption: `${effectData.emoji} *${effectData.name}*\n\n🐺 *Created by WOLFBOT*` }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } catch (error) {
          console.log(`❌ [PHOTOFUNIA] ${cmdName} error:`, error.message);
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          await sock.sendMessage(chatId, { text: `❌ Error generating ${effectData.name}: ${error.message}` }, { quoted: msg });
        }

      } else if (effectData.type === 'text') {
        if (!textArgs) {
          const multiHint = effectData.textParams ? `\n├─⊷ Use | to separate: ${effectData.textParams.join(', ')}` : '';
          return await sock.sendMessage(chatId, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name.toUpperCase()}* ⌋\n│\n├─⊷ *Usage:* ${PREFIX}${cmdName} <text>${multiHint}\n│\n├─⊷ *Example:*\n│  └⊷ ${PREFIX}${cmdName} WolfBot\n│\n╰───────────────\n> *WOLFBOT PHOTOFUNIA*`
          }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });
        try {
          const options = {};
          if (effectData.textParams) {
            const parts = textArgs.split('|').map(t => t.trim());
            effectData.textParams.forEach((param, i) => {
              options[param] = parts[i] || parts[0] || textArgs;
            });
          } else {
            options.text = textArgs;
          }
          const resultBuffer = await generatePhotofunia(effectData.effect, options);
          if (!resultBuffer || resultBuffer.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            return await sock.sendMessage(chatId, { text: `❌ Failed to generate ${effectData.name} effect. Try again later.` }, { quoted: msg });
          }
          await sock.sendMessage(chatId, { image: resultBuffer, caption: `${effectData.emoji} *${effectData.name}*\n📝 Text: ${textArgs}\n\n🐺 *Created by WOLFBOT*` }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } catch (error) {
          console.log(`❌ [PHOTOFUNIA] ${cmdName} error:`, error.message);
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          await sock.sendMessage(chatId, { text: `❌ Error generating ${effectData.name}: ${error.message}` }, { quoted: msg });
        }

      } else if (effectData.type === 'text+image') {
        const imageUrl = await getImageUrl(msg, sock);
        if (!imageUrl) {
          const multiHint = effectData.textParams ? `\n├─⊷ Use | to separate: ${effectData.textParams.join(', ')}` : '';
          return await sock.sendMessage(chatId, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name.toUpperCase()}* ⌋\n│\n├─⊷ This effect requires *text + image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}${cmdName} <your text>${multiHint}\n│\n╰───────────────\n> *WOLFBOT PHOTOFUNIA*`
          }, { quoted: msg });
        }
        if (!textArgs) {
          const multiHint = effectData.textParams ? `\n├─⊷ Use | to separate: ${effectData.textParams.join(', ')}` : '';
          return await sock.sendMessage(chatId, {
            text: `╭─⌈ ${effectData.emoji} *${effectData.name.toUpperCase()}* ⌋\n│\n├─⊷ This effect requires *text + image*\n├─⊷ Reply to an image with:\n│  └⊷ ${PREFIX}${cmdName} <your text>${multiHint}\n│\n╰───────────────\n> *WOLFBOT PHOTOFUNIA*`
          }, { quoted: msg });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });
        try {
          const options = { imageUrl };
          if (effectData.textParams) {
            const parts = textArgs.split('|').map(t => t.trim());
            effectData.textParams.forEach((param, i) => {
              options[param] = parts[i] || parts[0] || textArgs;
            });
          } else {
            options.text = textArgs;
          }
          const resultBuffer = await generatePhotofunia(effectData.effect, options);
          if (!resultBuffer || resultBuffer.length === 0) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
            return await sock.sendMessage(chatId, { text: `❌ Failed to generate ${effectData.name} effect. Try again later.` }, { quoted: msg });
          }
          await sock.sendMessage(chatId, { image: resultBuffer, caption: `${effectData.emoji} *${effectData.name}*\n📝 Text: ${textArgs}\n\n🐺 *Created by WOLFBOT*` }, { quoted: msg });
          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });
        } catch (error) {
          console.log(`❌ [PHOTOFUNIA] ${cmdName} error:`, error.message);
          await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
          await sock.sendMessage(chatId, { text: `❌ Error generating ${effectData.name}: ${error.message}` }, { quoted: msg });
        }
      }
    }
  };
}

export { EFFECTS, CATEGORY_META, generatePhotofunia, getImageUrl, getEffectsByCategory, getAllCategories, createPhotofuniaCommand };
