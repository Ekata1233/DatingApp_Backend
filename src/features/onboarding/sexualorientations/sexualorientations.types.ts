export interface ISexualOption {
  label: string;
  description: string; // ✅ NEW
}
export interface ISexualOrientation {
  flowType: "dating" | "marriage" | "mature";
  title: string;
  options: ISexualOption[];
}
