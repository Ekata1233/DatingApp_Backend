export interface IGenderImage {
  gender: string;
  image: string;
}

export interface IInterestedIn {
  title: string;
  genderImages: IGenderImage[]; // multiple objects
}
