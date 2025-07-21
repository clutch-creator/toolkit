export type TParam = {
  name: string;
  value: string;
};

export type TComplexUrl =
  | string
  | {
      url: string;
      params?: TParam[];
      toggleParams?: boolean;
      replaceParams?: boolean;
    };
