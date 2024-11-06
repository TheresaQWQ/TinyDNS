import type { DNSQuestion } from "./basic";

import { uint8ArrayToDomain } from "./basic";

import { DNSQuestionClass, DNSQuestionType } from "./types/question";

export interface DNSRequest {
  transactionId: number;
  flags: number;
  questions: DNSQuestion[];
}

const parseDNSQuestion = (dataView: DataView, offset: number): DNSQuestion => {
  const name = uint8ArrayToDomain(new Uint8Array(dataView.buffer, offset, dataView.getUint8(offset)));
  const type = DNSQuestionType[dataView.getUint16(offset + 1, false)] as DNSQuestion['type'];
  const rClass = DNSQuestionClass[dataView.getUint16(offset + 3, false)] as DNSQuestion['rClass'];

  return { name, type, rClass };
};

export function parseDNSRequest(data: Uint8Array): DNSRequest {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const transactionId = dataView.getUint16(0, false);
  const flags = dataView.getUint16(2, false);

  const questions: DNSQuestion[] = [];
  const questionCount = dataView.getUint16(4, false);

  for (let i = 0; i < questionCount; i++) {
    const offset = 12 + i * 16;
    questions.push(parseDNSQuestion(dataView, offset));
  }

  return { transactionId, flags, questions };
}
