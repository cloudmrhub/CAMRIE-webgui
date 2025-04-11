export interface TabModel {
  id: number;
  text: string;
  isSelected: boolean;
}

export interface TabInfo {
  id: number;
  text: string;
  disable?: boolean;
  children: React.ReactElement<{ visible?: boolean }>;}
