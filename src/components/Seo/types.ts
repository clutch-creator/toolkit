import type { Graph, Thing, WithContext } from 'schema-dts';

export interface IPropertyUrl {
  href: string;
  [key: string]: unknown;
}

export type TSeoOgImage = {
  url: string;
  width: number;
  height: number;
  alt?: string;
  type?: string;
};

export type OgType =
  | 'website'
  | 'article'
  | 'profile'
  | 'book'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station';

export type OgDeterminer = 'a' | 'an' | 'the' | '' | 'auto';

export type OgGender = 'male' | 'female' | 'other';

export type TSeoOg = Partial<{
  /* ===== Core =========================================================== */
  title: string;
  description: string;
  type: OgType;
  url: string;
  locale: string; // e.g. en_US
  localeAlternate: string[];
  site_name: string;
  determiner: OgDeterminer;

  /* ===== Images ========================================================= */
  image: string;
  images: TSeoOgImage[];

  /* ===== Audio (generic) =============================================== */
  audio: string;
  audioSecure_url: string;
  audioType: string;

  /* ===== Video – common for every “video.*” type ======================= */
  videoUrl: string;
  videoSecure_url: string;
  videoType: string;
  videoWidth: number;
  videoHeight: number;

  /* Extended movie / episode / … fields */
  videoActor: string;
  videoActorRole: string;
  videoDirector: string;
  videoWriter: string;
  videoDuration: number;
  videoRelease_date: string;
  videoTag: string;
  videoSeries: string;

  /* ===== Article ======================================================== */
  articlePublished_time: string;
  articleModified_time: string;
  articleExpiration_time: string;
  articleAuthor: string;
  articleSection: string;
  articleTag: string;

  /* ===== Profile ======================================================== */
  profileFirst_name: string;
  profileLast_name: string;
  profileUsername: string;
  profileGender: OgGender;

  /* ===== Book =========================================================== */
  bookAuthor: string;
  bookIsbn: string;
  bookRelease_date: string;
  bookTag: string;

  /* ===== Music – shared bits =========================================== */
  musicMusician: string;
  musicRelease_date: string;

  /* Music.song specific */
  musicDuration: number;
  musicAlbum: string;
  musicAlbumDisc: number;
  musicAlbumTrack: number;

  /* Music.album / playlist */
  musicSong: string;
  musicSongDisc: number;
  musicSongTrack: number;

  /* Music.playlist / radio_station */
  musicCreator: string;
}>;

export type TSeoTwitter = Partial<{
  card: string; // The card type (e.g., summary, summary_large_image, player, app)
  site: string; // @username of website
  creator: string; // @username of content creator
  title: string; // Title of content (max 70 characters)
  description: string; // Description of content (max 200 characters)
  image: string; // URL of image to use in the card
  imageAlt: string; // A text description of the image for visually impaired users
  player: string; // HTTPS URL of player iframe (used with player card)
  playerWidth: number; // Width of iframe in pixels (used with player card)
  playerHeight: number; // Height of iframe in pixels (used with player card)
  playerStream: string; // URL to raw video or audio stream (used with player card)
  appNameIphone: string; // Name of your iPhone app (used with app card)
  appIdIphone: string; // Your app ID in the iTunes App Store (used with app card)
  appUrlIphone: string; // Your app’s custom URL scheme for iPhone (used with app card)
  appNameIpad: string; // Name of your iPad app (used with app card)
  appIdIpad: string; // Your app ID in the iTunes App Store for iPad (used with app card)
  appUrlIpad: string; // Your app’s custom URL scheme for iPad (used with app card)
  appNameGoogleplay: string; // Name of your Android app (used with app card)
  appIdGoogleplay: string; // Your app ID in the Google Play Store (used with app card)
  appUrlGoogleplay: string; // Your app’s custom URL scheme for Android (used with app card)
}>;

export type TSeoSchema = WithContext<Thing> | Graph;

export type TRobots = {
  [name: string]: string;
};

export type TSeo = Partial<{
  title: string;
  description: string;
  canonical: IPropertyUrl | string;
  favicon: string;
  og: TSeoOg;
  twitter: TSeoTwitter;
  robots: TRobots;
  schema: TSeoSchema;
}>;
