import type { DNSQuestionType, DNSQuestionClass } from "./types/question";

export interface DNSQuestion {
  name: string;
  type: keyof typeof DNSQuestionType;
  rClass: keyof typeof DNSQuestionClass;
  length: number;
}

export interface DNSAnswer {
  name: string;
  type: number;
  ttl: number;
  data: string | Uint8Array;
  rClass: number;
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

export interface DNSFlags {
  /** 是否为响应报文 */
  isResponse?: boolean;
  /** 操作码 */
  operationCode?: number;
  /** 是否为权威服务器 */
  isAuthoritative?: boolean;
  /** 是否被截断 */
  isTruncated?: boolean;
  /** 是否递归请求 */
  recursionDesired?: boolean;
  /** 是否递归可用 */
  recursionAvailable?: boolean;
  /** 保留位 */
  z?: boolean;
  /** 是否为认证回答 */
  answerAuthenticated?: boolean;
  /** 是否为非认证数据 */
  nonAuthenticatedData?: boolean;
  /** 响应码 */
  replyCode?: number;
}

export const domainToUint8Array = (domain: string): [Uint8Array, number] => {
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

  const uint8Array = new Uint8Array(result);

  return [uint8Array, uint8Array.length];
}

export const uint8ArrayToDomain = (uint8Array: Uint8Array): [string, number] => {
  const labels = [];
  let length = 0;

  let offset = 0;
  while (true) {
    const labelLength = uint8Array[offset];
    if (labelLength === 0) break;

    length += labelLength + 1;
    
    const label = [];
    for (let i = 0; i < labelLength; i++) {
      label.push(String.fromCharCode(uint8Array[offset + 1 + i]));
    }
    
    labels.push(label.join(''));
    offset += labelLength + 1;
  }

  return [labels.join('.'), length];
}
