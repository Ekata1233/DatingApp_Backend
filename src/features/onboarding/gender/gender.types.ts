export interface IGenderOption {
    label : string;
}

export interface IGender{
    flowType: "dating" | "marriage" | "mature";
    title : string;
    options : IGenderOption[];
}