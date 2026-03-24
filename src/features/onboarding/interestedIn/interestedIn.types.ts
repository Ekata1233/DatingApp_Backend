export interface IGenderImage {
  gender: string;
  image: string;
}

export interface IInterestedIn {
  flowType: "dating" | "marriage" | "mature";
  title: string;
  genderImages: IGenderImage[]; // multiple objects
}
