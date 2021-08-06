export interface Environment {
  /** Indica se siamo in test/prod (true) o meno (false) */
  production: boolean;
  /** URL appeso all'inizio di tutte le chiamate HTTP */
  baseUrl: string;
  /** AWS: regione del deploy */
  awsRegion: string;
  /** AWS: identity pool id usato per accedere alle mappe, è nel formato `${region}:${id}` */
  awsIdentityPoolId: string;
  /** AWS: nome della mappa come indicato nella console  */
  awsMapName: string;
}
