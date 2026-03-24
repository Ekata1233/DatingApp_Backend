export interface ISexualOption {
  label: string;
}

export interface ISexualOrientation {
  flowType: "dating" | "marriage" | "mature";
  title: string;
  options: ISexualOption[];
}
