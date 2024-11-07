import type { DNSQuestion } from "./basic";

import { uint8ArrayToDomain } from "./basic";

import { DNSQuestionClass, DNSQuestionType } from "./types/question";

export interface DNSRequest {
  transactionId: number;
  flags: number;
  questions: DNSQuestion[];
}

const parseDNSQuestion = (dataView: DataView, offset: number): DNSQuestion => {
  const [name, nameLength] = uint8ArrayToDomain(new Uint8Array(dataView.buffer, offset));
  const type = DNSQuestionType[dataView.getUint16(offset + nameLength + 1, false)] as DNSQuestion['type'];
  const rClass = DNSQuestionClass[dataView.getUint16(offset + nameLength + 3, false)] as DNSQuestion['rClass'];

  return { name, type, rClass, length: nameLength + 4 };
};

export function parseDNSRequest(data: Uint8Array): DNSRequest {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const transactionId = dataView.getUint16(0, false);
  const flags = dataView.getUint16(2, false);

  const questions: DNSQuestion[] = [];
  const questionCount = dataView.getUint16(4, false);

  let offset = 12
  for (let i = 0; i < questionCount; i++) {
    const question = parseDNSQuestion(dataView, offset);
    questions.push(question);
    offset += question.length;
  }

  return { transactionId, flags, questions };
}
