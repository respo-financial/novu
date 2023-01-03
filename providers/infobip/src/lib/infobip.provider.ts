import {
  ChannelTypeEnum,
  CheckIntegrationResponseEnum,
  ICheckIntegrationResponse,
  IEmailOptions,
  IEmailProvider,
  ISendMessageSuccessResponse,
  ISmsOptions,
  ISmsProvider,
  ISMSEventBody,
  SmsEventStatusEnum,
} from '@novu/stateless';

import { Infobip, AuthType } from '@infobip-api/sdk';

export class InfobipSmsProvider implements ISmsProvider {
  id = 'infobip';
  channelType = ChannelTypeEnum.SMS as ChannelTypeEnum.SMS;

  private infobipClient;

  constructor(
    private config: {
      baseUrl: string;
      apiKey: string;
      from?: string;
    }
  ) {
    this.infobipClient = new Infobip({
      baseUrl: this.config.baseUrl,
      apiKey: this.config.apiKey,
      authType: AuthType.ApiKey,
    });
  }

  getMessageId(body: any | any[]): string[] {
    if (Array.isArray(body)) {
      return body.map((item) => item.id);
    }

    return [body.id];
  }

  parseEventBody(
    body: any | any[],
    identifier: string
  ): ISMSEventBody | undefined {
    if (Array.isArray(body)) {
      body = body.find((item) => item.MessageSid === identifier);
    }

    if (!body) {
      return undefined;
    }

    const status = this.getStatus(body.MessageStatus);

    if (status === undefined) {
      return undefined;
    }

    return {
      status: SmsEventStatusEnum.ACCEPTED,
      date: body.date,
      externalId: body.id,
      attempts: body.attempt ? parseInt(body.attempt, 10) : 1,
      response: body.response ? body.response : '',
      row: body,
    };
  }

  private getStatus(event: string): SmsEventStatusEnum | undefined {
    switch (event) {
      case 'accepted':
        return SmsEventStatusEnum.ACCEPTED;
      case 'queued':
        return SmsEventStatusEnum.QUEUED;
      case 'sending':
        return SmsEventStatusEnum.SENDING;
      case 'sent':
        return SmsEventStatusEnum.SENT;
      case 'failed':
        return SmsEventStatusEnum.FAILED;
      case 'delivered':
        return SmsEventStatusEnum.DELIVERED;
      case 'undelivered':
        return SmsEventStatusEnum.UNDELIVERED;
    }
  }
  async sendMessage(
    options: ISmsOptions
  ): Promise<ISendMessageSuccessResponse> {
    const infobipResponse = await this.infobipClient.channels.sms.send({
      messages: [
        {
          text: options.content,
          destinations: [
            {
              to: options.to,
            },
          ],
          from: this.config.from || options.from,
          regional: {
            indiaDlt: {
              contentTemplateId: options.overrides?.contentTemplateId,
              principalEntityId: options.overrides?.principalEntityId,
            },
          },
        },
      ],
    });
    const { messageId } = infobipResponse.data.messages.pop();

    return {
      id: messageId,
      date: new Date().toISOString(),
    };
  }
}

export class InfobipEmailProvider implements IEmailProvider {
  id = 'infobip';
  channelType = ChannelTypeEnum.EMAIL as ChannelTypeEnum.EMAIL;

  private infobipClient;

  constructor(
    private config: {
      baseUrl: string;
      apiKey: string;
      from?: string;
    }
  ) {
    this.infobipClient = new Infobip({
      baseUrl: this.config.baseUrl,
      apiKey: this.config.apiKey,
      authType: AuthType.ApiKey,
    });
  }

  async checkIntegration(
    options: IEmailOptions
  ): Promise<ICheckIntegrationResponse> {
    try {
      await this.infobipClient.channels.email.send({
        to: options.to,
        from: this.config.from || options.from,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return {
        success: true,
        message: 'Integrated successfully!',
        code: CheckIntegrationResponseEnum.SUCCESS,
      };
    } catch (error) {
      return {
        success: false,
        message: error?.message,
        code: CheckIntegrationResponseEnum.FAILED,
      };
    }
  }

  async sendMessage(
    options: IEmailOptions
  ): Promise<ISendMessageSuccessResponse> {
    const infobipResponse = await this.infobipClient.channels.email.send({
      to: options.to,
      from: this.config.from || options.from,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    const { messageId } = infobipResponse.data.messages.pop();

    return {
      id: messageId,
      date: new Date().toISOString(),
    };
  }
}
