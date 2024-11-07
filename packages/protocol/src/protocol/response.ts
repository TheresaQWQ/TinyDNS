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
  const encodeHeader = (response: DNSResponse): Uint8Array => {
    if (response.questions.length > 65535) throw new Error("Too many questions in DNS response");
    if (response.answers.length > 65535) throw new Error("Too many answers in DNS response");
    if (response.authorities.length > 65535) throw new Error("Too many authorities in DNS response");
    if (response.additional.length > 65535) throw new Error("Too many additional records in DNS response");

    const buffer = new Uint8Array(12);
    const header = new DataView(buffer.buffer);
    header.setUint16(0, response.transactionId, false);
    header.setUint16(2, response.flags, false);
    header.setUint16(4, response.questions.length, false);
    header.setUint16(6, response.answers.length, false);
    header.setUint16(8, response.authorities.length, false);
    header.setUint16(10, response.additional.length, false);
    return buffer;
  }

  const encodeQuestions = (questions: DNSQuestion[]): Uint8Array => {
    let totalLength = 0;
    for (const question of questions) {
      const [_, domainLength] = domainToUint8Array(question.name);
      totalLength += domainLength + 4;
    }

    const buffer = new Uint8Array(totalLength);
    let currentOffset = 0;

    for (const question of questions) {
      const [domainBytes, domainLength] = domainToUint8Array(question.name);
      const domainDataView = new DataView(buffer.buffer, currentOffset, domainLength + 4);
      
      for (let i = 0; i < domainBytes.length; i++) {
        domainDataView.setUint8(i, domainBytes.at(i) as number);
      }

      domainDataView.setUint16(domainLength, DNSQuestionType[question.type], false);
      domainDataView.setUint16(domainLength + 2, DNSQuestionClass[question.rClass], false);

      currentOffset += domainLength + 4;
    }

    return buffer;
  }

  const encodeAnswers = (answers: DNSAnswer[]): Uint8Array => {
    let totalLength = 0;
    for (const answer of answers) {
      const [_, domainLength] = domainToUint8Array(answer.name);
      totalLength += domainLength + 10 + answer.data.length;
    }

    const buffer = new Uint8Array(totalLength);
    let currentOffset = 0;
    
    for (const answer of answers) {
      const [domainBytes, domainLength] = domainToUint8Array(answer.name);
      const answerData = new DataView(buffer.buffer, currentOffset, domainLength + 10 + answer.data.length);
      
      for (let i = 0; i < domainBytes.length; i++) {
        answerData.setUint8(i, domainBytes.at(i) as number);
      }

      answerData.setUint16(domainLength, answer.type, false);
      answerData.setUint16(domainLength + 2, answer.rClass, false);
      answerData.setUint32(domainLength + 4, answer.ttl, false);
      answerData.setUint16(domainLength + 8, answer.data.length, false);

      if (answer.data instanceof Uint8Array) {
        for (let i = 0; i < answer.data.length; i++) {
          answerData.setUint8(domainLength + 10 + i, answer.data[i]);
        }
      } else {
        for (let i = 0; i < answer.data.length; i++) {
          answerData.setUint8(domainLength + 10 + i, answer.data.charCodeAt(i));
        }
      }
      
      currentOffset += domainLength + 10 + answer.data.length;
    }
    
    return buffer;
  }

  const encodeAuthorities = (authorities: DNSAuthority[]): Uint8Array => {
    let totalLength = 0;
    for (const authority of authorities) {
      const [_, domainLength] = domainToUint8Array(authority.name);
      const [__, dataLength] = domainToUint8Array(authority.data);
      totalLength += domainLength + 10 + dataLength;
    }

    const buffer = new Uint8Array(totalLength);
    let currentOffset = 0;
    
    for (const authority of authorities) {
      const [domainBytes, domainLength] = domainToUint8Array(authority.name);
      const [dataBytes, dataLength] = domainToUint8Array(authority.data);
      const authorityData = new DataView(buffer.buffer, currentOffset, domainLength + 10 + dataLength);
      
      for (let i = 0; i < domainBytes.length; i++) {
        authorityData.setUint8(i, domainBytes[i]);
      }
      
      authorityData.setUint16(domainLength, authority.type, false);
      authorityData.setUint16(domainLength + 2, 1, false); // rClass固定为1 (IN)
      authorityData.setUint32(domainLength + 4, authority.ttl, false);
      authorityData.setUint16(domainLength + 8, dataLength, false);
      
      for (let i = 0; i < dataBytes.length; i++) {
        authorityData.setUint8(domainLength + 10 + i, dataBytes[i]);
      }
      
      currentOffset += domainLength + 10 + dataLength;
    }
    
    return buffer;
  }

  const encodeAdditional = (additional: DNSAdditional[]): Uint8Array => {
    let totalLength = 0;
    for (const add of additional) {
      const [_, domainLength] = domainToUint8Array(add.name);
      const [__, dataLength] = domainToUint8Array(add.data);
      totalLength += domainLength + 10 + dataLength;
    }

    const buffer = new Uint8Array(totalLength);
    let currentOffset = 0;
    
    for (const add of additional) {
      const [domainBytes, domainLength] = domainToUint8Array(add.name);
      const [dataBytes, dataLength] = domainToUint8Array(add.data);
      const addData = new DataView(buffer.buffer, currentOffset, domainLength + 10 + dataLength);
      
      for (let i = 0; i < domainBytes.length; i++) {
        addData.setUint8(i, domainBytes[i]);
      }
      
      addData.setUint16(domainLength, add.type, false);
      addData.setUint16(domainLength + 2, 1, false); // rClass固定为1 (IN)
      addData.setUint32(domainLength + 4, add.ttl, false);
      addData.setUint16(domainLength + 8, dataLength, false);
      
      for (let i = 0; i < dataBytes.length; i++) {
        addData.setUint8(domainLength + 10 + i, dataBytes[i]);
      }
      
      currentOffset += domainLength + 10 + dataLength;
    }
    
    return buffer;
  }
  
  const headerBytes = encodeHeader(response);
  const questionBytes = encodeQuestions(response.questions);
  const answerBytes = encodeAnswers(response.answers);
  const authorityBytes = encodeAuthorities(response.authorities);
  const additionalBytes = encodeAdditional(response.additional);

  const totalLength = headerBytes.length + questionBytes.length + 
                     answerBytes.length + authorityBytes.length + 
                     additionalBytes.length;
  
  const result = new Uint8Array(totalLength);
  let offset = 0;

  result.set(headerBytes, offset);
  offset += headerBytes.length;
  result.set(questionBytes, offset);
  offset += questionBytes.length;
  result.set(answerBytes, offset);
  offset += answerBytes.length;
  result.set(authorityBytes, offset);
  offset += authorityBytes.length;
  result.set(additionalBytes, offset);

  return result;
}
