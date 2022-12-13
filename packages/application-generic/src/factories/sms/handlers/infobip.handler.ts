import { ChannelTypeEnum } from '@novu/shared';
import { ICredentials } from '@novu/dal';
import { BaseSmsHandler } from './base.handler';
import { InfobipSmsProvider } from '@novu/infobip';

export class InfobipSmsHandler extends BaseSmsHandler {
  constructor() {
    super('infobip', ChannelTypeEnum.SMS);
  }

  buildProvider(credentials: ICredentials) {
    const config: {
      baseUrl: string;
      apiKey: string;
    } = { apiKey: credentials.apiKey, baseUrl: credentials.baseUrl };

    this.provider = new InfobipSmsProvider(config);
  }
}
