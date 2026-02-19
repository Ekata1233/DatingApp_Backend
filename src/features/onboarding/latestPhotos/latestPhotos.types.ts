export interface IPhoto {
  _id?: string;
  image: string;
}

export interface ILatestPhotos {
  title: string;
  description: string;
  photos: IPhoto[];
}
