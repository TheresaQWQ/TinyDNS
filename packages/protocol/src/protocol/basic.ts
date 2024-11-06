import type { DNSQuestionType, DNSQuestionClass } from "./types/question";

type ItemOf<T> = T[keyof T];

export interface DNSQuestion {
  name: string;
  type: keyof typeof DNSQuestionType;
  rClass: keyof typeof DNSQuestionClass;
}

export interface DNSAnswer {
  name: string;
  type: number;
  ttl: number;
  data: string | Uint8Array;
}

export interface DNSAuthority {
  name: string;
  type: number;
  ttl: number;
  data: string;
}

export interface DNSAdditional {
  name: string;
  type: number;
  ttl: number;
  data: string;
}

export const domainToUint8Array = (domain: string) => {
  const labels = domain.split(".");
  const result: number[] = [];
  
  for (const label of labels) {
    if (label.length > 0) {
      // 添加标签长度
      result.push(label.length);
      
      // 添加标签内容
      for (const char of label) {
        result.push(char.charCodeAt(0));
      }
    }
  }

  // 添加结束标记0
  result.push(0);

  return new Uint8Array(result);
}

export const uint8ArrayToDomain = (uint8Array: Uint8Array) => {
  const labels = [];

  let offset = 0;
  while (true) {
    const labelLength = uint8Array[offset];
    if (labelLength === 0) break;
    
    const label = [];
    for (let i = 0; i < labelLength; i++) {
      label.push(String.fromCharCode(uint8Array[offset + 1 + i]));
    }
    
    labels.push(label.join(''));
    offset += labelLength + 1;
  }

  return labels.join('.');
}
