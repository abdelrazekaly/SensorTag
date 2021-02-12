// @flow

import {put, call} from 'redux-saga/effects';
import {
  Device,
  Service,
  Characteristic,
  Descriptor,
  BleError,
  BleErrorCode,
} from 'react-native-ble-plx';
import {log, logError} from './Reducer';
import base64 from 'react-native-base64'

export type SensorTagTestMetadata = {
  id: string,
  title: string,
  execute: (device: Device) => Generator<any, boolean, any>,
};

export const SensorTagTests: {[string]: SensorTagTestMetadata} = {
  READ_ALL_CHARACTERISTICS: {
    id: 'READ_ALL_CHARACTERISTICS',
    title: 'Read all characteristics',
    execute: readAllCharacteristics,
  },
  READ_TEMPERATURE: {
    id: 'READ_TEMPERATURE',
    title: 'Read temperature',
    execute: readTemperature,
  },
};

function* readAllCharacteristics(device: Device): Generator<*, boolean, *> {
  try {
    const services: Array<Service> = yield call([device, device.services]);
    for (const service of services) {
      yield put(log('Found service: ' + service.uuid));
      const characteristics: Array<Characteristic> = yield call([
        service,
        service.characteristics,
      ]);
      for (const characteristic of characteristics) {
        yield put(log('Found characteristic: ' + characteristic.uuid));

        // if (characteristic.uuid === '19B10001-E8F2-537E-4F6C-D104768A1214')
        //   continue;

        const descriptors: Array<Descriptor> = yield call([
          characteristic,
          characteristic.descriptors,
        ]);

        for (const descriptor of descriptors) {
          yield put(log('* Found descriptor: ' + descriptor.uuid));
          const d: Descriptor = yield call([descriptor, descriptor.read]);
          yield put(log('Descriptor value: ' + (d.value || 'null')));
          // if (d.uuid === '00002902-0000-1000-8000-00805f9b34fb') {
          //   yield put(log('Skipping CCC'));
          //   continue;
          // }
          try {
            yield call([descriptor, descriptor.write], 'MQ==');
          } catch (error) {
            const bleError: BleError = error;
            if (bleError.errorCode === BleErrorCode.DescriptorWriteFailed) {
              yield put(log('Cannot write to: ' + d.uuid));
            } else {
              throw error;
            }
          }
        }

        // byte data = (byte) 0
        yield put(log('Found characteristic: ' + characteristic.uuid));
        if (characteristic.isWritableWithResponse) {
          yield call(
            [characteristic, characteristic.writeWithResponse],
            base64.encode('A'),
          );
          yield put(log('Successfully written value back'));
        }

        if (characteristic.isReadable) {
          yield put(log('Reading value...'));
          var c = yield call([characteristic, characteristic.read]);
          yield put(log('Got base64 value: ' + c.value));
        }
      }
    }
  } catch (error) {
    yield put(logError(error));
    return false;
  }

  return true;
}

function* readTemperature(device: Device): Generator<*, boolean, *> {
  yield put(log('Read temperature'));
  return false;
}
