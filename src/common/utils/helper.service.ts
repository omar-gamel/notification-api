import * as path from 'path';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as slug from 'speakingurl';
import * as dateFns from 'date-fns';
import { generate } from 'voucher-code-generator';
import { Injectable } from '@nestjs/common';
import { Timezone } from '../graphql/graphql-response.type';

@Injectable()
export class HelperService {
  public slugify(value: string): string {
    if (value.charAt(value.length - 1) === '-') value = value.slice(0, value.length - 1);
    return `${slug(value, { titleCase: true })}-${
      generate({
        charset: '123456789abcdefghgklmnorstuvwxyz',
        length: 4
      })[0]
    }`.toLowerCase();
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  public updateProvidedFields<T>(model: T, input: object): T {
    Object.keys(input).map(field => (model[field] = input[field]));
    return model;
  }

  getDayMinutesFromTimestamp(timestamp: number) {
    const startOfDay = new Date(timestamp).setUTCHours(0, 0, 0, 0);
    return dateFns.differenceInMinutes(new Date(timestamp), startOfDay);
  }

  setTimestampBasedOnDayMinutes(timestamp: number, requiredMinutes: number) {
    const startOfDay = new Date(timestamp).setUTCHours(0, 0, 0, 0);
    return dateFns.addMinutes(startOfDay, requiredMinutes).getTime();
  }

  upperCaseFirstLetter(str: string) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  public encryptStringWithRsaPublicKey(
    toEncrypt: string,
    relativeOrAbsolutePathToPublicKey: string
  ) {
    const absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
    const publicKey = fs.readFileSync(absolutePath, 'utf8');
    const buffer = Buffer.from(toEncrypt);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  public decryptStringWithRsaPrivateKey(
    toDecrypt: string,
    relativeOrAbsolutePathToPrivateKey: string
  ) {
    const absolutePath = path.resolve(relativeOrAbsolutePathToPrivateKey);
    const privateKey = fs.readFileSync(absolutePath, 'utf8');
    const buffer = Buffer.from(toDecrypt, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  }

  public getTimeBasedOnTimezone(timezoneObj: Timezone, date?: Date | number): Date {
    let timeBasedOnTimezone = new Date(date) || new Date();
    if (timezoneObj.minusSign) {
      timeBasedOnTimezone = dateFns.subHours(timeBasedOnTimezone, timezoneObj.hours);
      timeBasedOnTimezone = dateFns.subMinutes(timeBasedOnTimezone, timezoneObj.minutes);
    } else {
      timeBasedOnTimezone = dateFns.addHours(timeBasedOnTimezone, timezoneObj.hours);
      timeBasedOnTimezone = dateFns.addMinutes(timeBasedOnTimezone, timezoneObj.minutes);
    }
    return timeBasedOnTimezone;
  }

  public trimAllSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  deriveMapFromArray<T>(array: T[], mapFn: (item: T) => any) {
    const map = new Map<any, any>();
    array.forEach(item => {
      map.set(mapFn(item), item);
    });
    return map;
  }

  public getStartOfDayInSpecificTimezone(
    timezoneObj: Timezone = { minusSign: false, hours: 3, minutes: 0 }
  ): number {
    const processTimezoneOffsetInMilliSec = new Date().getTimezoneOffset() * 60 * 1000;
    const clientTimezoneOffsetInMilliSec = timezoneObj.minusSign
      ? (timezoneObj.hours * 60 + timezoneObj.minutes) * 60 * 1000
      : -(timezoneObj.hours * 60 + timezoneObj.minutes) * 60 * 1000;
    const timezonedMidnightInUtc = new Date(
      new Date().getTime() - processTimezoneOffsetInMilliSec
    ).setUTCHours(0, 0, 0, 0);

    return timezonedMidnightInUtc + clientTimezoneOffsetInMilliSec;
  }

  public generateRandomString(length: number) {
    const characters = '0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
