import { JSX } from 'react';

type TArray = string[] | undefined;
type TCheckbox = boolean | undefined;
type TCode = (...args: any[]) => any | undefined;
type TColor = string | undefined;
type TCombobox = string | undefined;
type TComponent = React.ComponentType<any>;
type TFile = string | undefined;
type TInput = string | undefined;
type TJson = string | undefined;
type TMedia = string | undefined;
type TNumber = number | undefined;
type TObject =
  | {
      [key: string]: any;
    }
  | undefined;
type TRichText = JSX.Element | undefined;
type TSelect = string | undefined;
type TStyles =
  | {
      [key: string]: string | undefined;
    }
  | undefined;
type TSvg = JSX.Element | undefined;
type TTextArea = string | undefined;
type Url = string | undefined;
type TAction = (data?: FormData | React.SyntheticEvent) => Promise<any | void>;

export type Controls = {
  Array: TArray;
  Checkbox: TCheckbox;
  Code: TCode;
  Color: TColor;
  Combobox: TCombobox;
  Component: TComponent;
  File: TFile;
  Input: TInput;
  Json: TJson;
  Media: TMedia;
  Number: TNumber;
  Object: TObject;
  RichText: TRichText;
  Select: TSelect;
  Styles: TStyles;
  Svg: TSvg;
  TextArea: TTextArea;
  Url: Url;
  Action: TAction;
};
