import { type DNSQuestion, type DNSAnswer, type DNSAuthority, type DNSAdditional, domainToUint8Array } from "./basic";
import { DNSQuestionClass } from "./types/question";
import { DNSQuestionType } from "./types/question";

export interface DNSResponse {
  transactionId: number;
  flags: number;
  questions: DNSQuestion[];
  answers: DNSAnswer[];
  authorities: DNSAuthority[];
  additional: DNSAdditional[];
}

export const encodeDNSResponse = (response: DNSResponse): Uint8Array => {
  const encodeHeader = (response: DNSResponse, buffer: Uint8Array, offset: number) => {
    const header = new DataView(buffer.buffer, offset, 12);
    header.setUint16(0, response.transactionId, false);
    header.setUint16(2, response.flags, false);
    header.setUint16(4, response.questions.length, false);
    header.setUint16(6, response.answers.length, false);
    header.setUint16(8, response.authorities.length, false);
    header.setUint16(10, response.additional.length, false);

    return offset + 12;
  }

  const encodeQuestions = (questions: DNSQuestion[], buffer: Uint8Array, offset: number) => {
    for (const question of questions) {
      const question_offset = offset;
      const question_data = new DataView(buffer.buffer, question_offset, 12);
      question_data.setUint8(0, question.name.length);
      question_data.setUint8(1, DNSQuestionType[question.type]);
      question_data.setUint8(2, DNSQuestionClass[question.rClass]);
    }

    return offset;
  }

  const encodeAnswers = (answers: DNSAnswer[], buffer: Uint8Array, offset: number) => {
    let currentOffset = offset;
    
    for (const answer of answers) {
      // 计算所需的总长度
      const totalLength = answer.name.length + 10 + (answer.data instanceof Uint8Array ? answer.data.length : answer.data.length);
      const answerData = new DataView(buffer.buffer, currentOffset, totalLength);
      
      // 编码名称长度和内容
      for (let i = 0; i < answer.name.length; i++) {
        const uint8Array = domainToUint8Array(answer.name[i]);
        for (let j = 0; j < uint8Array.length; j++) {
          answerData.setUint8(answer.name.length + 1 + j, uint8Array[j]);
        }
      }
      // 编码类型、TTL和数据
      answerData.setUint16(answer.name.length + 1, answer.type, false);
      answerData.setUint32(answer.name.length + 3, answer.ttl, false);
      
      // 编码数据长度和内容
      const dataLength = answer.data instanceof Uint8Array ? answer.data.length : answer.data.length;
      answerData.setUint16(answer.name.length + 7, dataLength, false);
      
      if (answer.data instanceof Uint8Array) {
        for (let i = 0; i < answer.data.length; i++) {
          answerData.setUint8(answer.name.length + 9 + i, answer.data[i]);
        }
      } else {
        for (let i = 0; i < answer.data.length; i++) {
          answerData.setUint8(answer.name.length + 9 + i, answer.data.charCodeAt(i));
        }
      }
      
      currentOffset += totalLength;
    }
    
    return currentOffset;
  }

  const encodeAuthorities = (authorities: DNSAuthority[], buffer: Uint8Array, offset: number) => {
    let currentOffset = offset;
    
    for (const authority of authorities) {
      // 计算所需的总长度
      const totalLength = authority.name.length + 10 + authority.data.length;
      const authorityData = new DataView(buffer.buffer, currentOffset, totalLength);
      
      authorityData.setUint8(0, authority.name.length);
      for (let i = 0; i < authority.name.length; i++) {
        authorityData.setUint8(1 + i, authority.name.charCodeAt(i));
      }
      
      authorityData.setUint16(authority.name.length + 1, authority.type, false);
      authorityData.setUint32(authority.name.length + 3, authority.ttl, false);
      
      authorityData.setUint16(authority.name.length + 7, authority.data.length, false);
      for (let i = 0; i < authority.data.length; i++) {
        authorityData.setUint8(authority.name.length + 9 + i, authority.data.charCodeAt(i));
      }
      
      currentOffset += totalLength;
    }
    
    return currentOffset;
  }

  const encodeAdditional = (additional: DNSAdditional[], buffer: Uint8Array, offset: number) => {
    let currentOffset = offset;
    
    for (const add of additional) {
      // 计算所需的总长度
      const totalLength = add.name.length + 10 + add.data.length;
      const addData = new DataView(buffer.buffer, currentOffset, totalLength);
      
      addData.setUint8(0, add.name.length);
      for (let i = 0; i < add.name.length; i++) {
        addData.setUint8(1 + i, add.name.charCodeAt(i));
      }
      
      addData.setUint16(add.name.length + 1, add.type, false);
      addData.setUint32(add.name.length + 3, add.ttl, false);
      
      addData.setUint16(add.name.length + 7, add.data.length, false);
      for (let i = 0; i < add.data.length; i++) {
        addData.setUint8(add.name.length + 9 + i, add.data.charCodeAt(i));
      }
      
      currentOffset += totalLength;
    }
    
    return currentOffset;
  }

  // 计算总缓冲区大小
  const totalSize = 12 + // 头部固定12字节
    response.questions.reduce((acc, q) => acc + q.name.length + 4, 0) +
    response.answers.reduce((acc, a) => acc + a.name.length + 10 + a.data.length, 0) +
    response.authorities.reduce((acc, auth) => acc + auth.name.length + 10 + auth.data.length, 0) +
    response.additional.reduce((acc, add) => acc + add.name.length + 10 + add.data.length, 0);

  const buffer = new Uint8Array(totalSize);
  
  let offset = encodeHeader(response, buffer, 0);
  offset = encodeQuestions(response.questions, buffer, offset);
  offset = encodeAnswers(response.answers, buffer, offset);
  offset = encodeAuthorities(response.authorities, buffer, offset);
  offset = encodeAdditional(response.additional, buffer, offset);

  return buffer;
}
