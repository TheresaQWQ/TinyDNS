import type { DNSRequest, DNSResponse, DNSFlags } from "@tinydns/protocol";

export default class DefaultResolver {
  async resolve(request: DNSRequest): Promise<DNSResponse> {
    return {
      questions: request.questions,
      answers: [{
        name: request.questions[0].name,
        type: 1,
        ttl: 3600,
        data: new Uint8Array([1, 1, 1, 1]),
        rClass: 1
      }],
      authorities: [],
      additional: [],
      transactionId: request.transactionId,
      flags: this.encodeFlags({
        isResponse: true,
        replyCode: 0
      }),
    }
  }

  public encodeFlags(flags: DNSFlags): number {
    let flag = 0;
    
    flag |= flags.isResponse ? 0x8000 : 0;  // QR (Query Response) - 1位, 1=响应, 0=查询
    flag |= ((flags.operationCode ?? 0) & 0x0F) << 11;  // OPCODE - 4位, 0=标准查询, 1=反向查询, 2=服务器状态请求
    flag |= flags.isAuthoritative ? 0x0400 : 0;  // AA (Authoritative Answer) - 1位, 1=权威应答
    flag |= flags.isTruncated ? 0x0200 : 0;  // TC (Truncated) - 1位, 1=消息被截断
    flag |= flags.recursionDesired ? 0x0100 : 0;  // RD (Recursion Desired) - 1位, 1=期望递归
    flag |= flags.recursionAvailable ? 0x0080 : 0;  // RA (Recursion Available) - 1位, 1=服务器支持递归
    flag |= flags.answerAuthenticated ? 0x0020 : 0;  // AA (Authenticated Answer) - 1位, DNSSEC相关
    flag |= flags.nonAuthenticatedData ? 0x0010 : 0;  // AD (Non-authenticated Data) - 1位, DNSSEC相关
    flag |= (flags.replyCode ?? 0) & 0x000F;  // RCODE - 4位, 0=无错误, 1=格式错误, 2=服务器失败, 3=名字错误等

    return flag;
  }

  public decodeFlags(flags: number): DNSFlags {
    return {
      isResponse: (flags & 0x8000) > 0,        // QR (Query Response) - 1位, 1=响应, 0=查询
      operationCode: (flags >> 11) & 0x0F,     // OPCODE - 4位, 0=标准查询, 1=反向查询, 2=服务器状态请求
      isAuthoritative: (flags & 0x0400) > 0,   // AA (Authoritative Answer) - 1位, 1=权威应答
      isTruncated: (flags & 0x0200) > 0,       // TC (Truncated) - 1位, 1=消息被截断
      recursionDesired: (flags & 0x0100) > 0,  // RD (Recursion Desired) - 1位, 1=期望递归
      recursionAvailable: (flags & 0x0080) > 0, // RA (Recursion Available) - 1位, 1=服务器支持递归
      answerAuthenticated: (flags & 0x0020) > 0, // AA (Authenticated Answer) - 1位, DNSSEC相关
      nonAuthenticatedData: (flags & 0x0010) > 0, // AD (Non-authenticated Data) - 1位, DNSSEC相关
      replyCode: flags & 0x000F                // RCODE - 4位, 0=无错误, 1=格式错误, 2=服务器失败, 3=名字错误等
    }
  }
}
