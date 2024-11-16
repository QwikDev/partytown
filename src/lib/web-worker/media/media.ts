import {
  CallType,
  type MediaSelf,
  type WebWorkerEnvironment,
  type WorkerConstructor,
  type WorkerWindow,
} from '../../types';
import {
  defineCstr,
  defineCstrName,
  EMPTY_ARRAY,
  MediaSourceKey,
  ReadyStateKey,
  SourceBuffersKey,
  SourceBufferTasksKey,
  TimeRangesKey,
} from './utils';
import {
  callMethod,
  getter,
  setter,
  constructGlobal,
  definePrototypePropertyDescriptor,
  randomId,
  InstanceIdKey,
  WinIdKey,
} from './bridge';

export const initMedia = (
  WorkerBase: WorkerConstructor,
  WorkerEventTargetProxy: WorkerConstructor,
  env: WebWorkerEnvironment,
  win: WorkerWindow
) => {
  win.Audio = defineCstrName(
    'HTMLAudioElement',
    class {
      constructor(src?: string) {
        const audio: HTMLAudioElement = env.$createNode$('audio', randomId()) as any;
        audio.src = src!;
        return audio;
      }
    }
  );

  const WorkerAudioTrack = class extends WorkerBase {
    get enabled() {
      return getter(this, ['enabled']);
    }
    set enabled(value: any) {
      setter(this, ['enabled'], value);
    }

    get id() {
      return getter(this, ['id']);
    }

    get kind() {
      return getter(this, ['kind']);
    }

    get label() {
      return getter(this, ['label']);
    }

    get language() {
      return getter(this, ['language']);
    }

    get sourceBuffer() {
      return new WorkerSourceBuffer(this);
    }
  };

  const WorkerAudioTrackList = class {
    constructor(mediaElm: any) {
      const audioTracks = 'audioTracks';
      const winId = mediaElm[WinIdKey];
      const instanceId = mediaElm[InstanceIdKey];

      const instance = {
        addEventListener(...args: any[]) {
          callMethod(
            mediaElm,
            [audioTracks, 'addEventListener'],
            args,
            CallType.NonBlockingNoSideEffect
          );
        },
        getTrackById(...args: any[]) {
          return callMethod(mediaElm, [audioTracks, 'getTrackById'], args);
        },
        get length(): number {
          return getter(mediaElm, [audioTracks, 'length']);
        },
        removeEventListener(...args: any[]) {
          callMethod(
            mediaElm,
            [audioTracks, 'removeEventListener'],
            args,
            CallType.NonBlockingNoSideEffect
          );
        },
      };

      return new Proxy(instance, {
        get(target: any, propName) {
          if (typeof propName === 'number') {
            return new WorkerAudioTrack(winId, instanceId, [audioTracks, propName]);
          }
          return target[propName];
        },
      }) as any;
    }
  };

  const WorkerSourceBufferList = defineCstr(
    win,
    'SourceBufferList',
    class extends Array {
      [MediaSourceKey]: MediaSource;

      constructor(mediaSource: MediaSource) {
        super();
        this[MediaSourceKey] = mediaSource;
      }

      addEventListener(...args: any[]) {
        callMethod(
          this[MediaSourceKey],
          ['sourceBuffers', 'addEventListener'],
          args,
          CallType.NonBlockingNoSideEffect
        );
      }

      removeEventListener(...args: any[]) {
        callMethod(
          this[MediaSourceKey],
          ['sourceBuffers', 'removeEventListener'],
          args,
          CallType.NonBlockingNoSideEffect
        );
      }
    }
  );

  const WorkerSourceBuffer = defineCstr(
    win,
    'SourceBuffer',
    class extends WorkerEventTargetProxy {
      [MediaSourceKey]: any;
      [SourceBufferTasksKey]: SourceBufferTask[] = [];

      constructor(mediaSource: any) {
        super(mediaSource[WinIdKey], mediaSource[InstanceIdKey], ['sourceBuffers']);
        this[MediaSourceKey] = mediaSource;
      }

      abort() {
        const sbIndex = getSourceBufferIndex(this);
        callMethod(this, [sbIndex, 'appendWindowStart'], EMPTY_ARRAY, CallType.Blocking);
      }

      addEventListener(...args: any[]) {
        const sbIndex = getSourceBufferIndex(this);
        callMethod(this, [sbIndex, 'addEventListener'], args, CallType.NonBlockingNoSideEffect);
      }

      appendBuffer(buf: ArrayBuffer | ArrayBufferView) {
        this[SourceBufferTasksKey].push(['appendBuffer', [buf], buf]);
        drainSourceBufferQueue(this);
      }

      get appendWindowStart() {
        const sbIndex = getSourceBufferIndex(this);
        return getter(this, [sbIndex, 'appendWindowStart']);
      }
      set appendWindowStart(value: number) {
        const sbIndex = getSourceBufferIndex(this);
        setter(this, [sbIndex, 'appendWindowStart'], value);
      }

      get appendWindowEnd() {
        const sbIndex = getSourceBufferIndex(this);
        return getter(this, [sbIndex, 'appendWindowEnd']);
      }
      set appendWindowEnd(value: number) {
        const sbIndex = getSourceBufferIndex(this);
        setter(this, [sbIndex, 'appendWindowEnd'], value);
      }

      get buffered() {
        const mediaSource = this[MediaSourceKey];
        const sbIndex = getSourceBufferIndex(this);
        const timeRanges = new WorkerTimeRanges(mediaSource[WinIdKey], mediaSource[InstanceIdKey], [
          'sourceBuffers',
          sbIndex,
          'buffered',
        ]);
        return timeRanges;
      }

      changeType(mimeType: string) {
        const sbIndex = getSourceBufferIndex(this);
        callMethod(this, [sbIndex, 'changeType'], [mimeType], CallType.NonBlocking);
      }

      get mode() {
        const sbIndex = getSourceBufferIndex(this);
        return getter(this, [sbIndex, 'mode']);
      }
      set mode(value: number) {
        const sbIndex = getSourceBufferIndex(this);
        setter(this, [sbIndex, 'mode'], value);
      }

      remove(start: number, end: number) {
        this[SourceBufferTasksKey].push(['remove', [start, end]]);
        drainSourceBufferQueue(this);
      }

      removeEventListener(...args: any[]) {
        const sbIndex = getSourceBufferIndex(this);
        callMethod(this, [sbIndex, 'removeEventListener'], args, CallType.NonBlockingNoSideEffect);
      }

      get timestampOffset() {
        const sbIndex = getSourceBufferIndex(this);
        return getter(this, [sbIndex, 'timestampOffset']);
      }
      set timestampOffset(value: number) {
        const sbIndex = getSourceBufferIndex(this);
        setter(this, [sbIndex, 'timestampOffset'], value);
      }

      get updating() {
        const sbIndex = getSourceBufferIndex(this);
        return getter(this, [sbIndex, 'updating']);
      }
    }
  );

  const WorkerTimeRanges = defineCstr(
    win,
    'TimeRanges',
    class extends WorkerBase {
      start(...args: any[]) {
        return callMethod(this, ['start'], args);
      }

      end(...args: any[]) {
        return callMethod(this, ['end'], args);
      }

      get length() {
        return getter(this, ['length']);
      }
    }
  );

  const getSourceBufferIndex = (sourceBuffer: typeof WorkerSourceBuffer) => {
    if (sourceBuffer) {
      const mediaSource = sourceBuffer[MediaSourceKey];
      const sourceBufferList: typeof WorkerSourceBufferList = mediaSource[SourceBuffersKey];
      return sourceBufferList.indexOf(sourceBuffer);
    }
    return -1;
  };

  const drainSourceBufferQueue = (sourceBuffer: typeof WorkerSourceBuffer) => {
    if (sourceBuffer[SourceBufferTasksKey].length) {
      if (!sourceBuffer.updating) {
        const task = sourceBuffer[SourceBufferTasksKey].shift();

        if (task) {
          const sbIndex = getSourceBufferIndex(sourceBuffer);
          callMethod(
            sourceBuffer,
            [sbIndex, task[0]],
            task[1],
            CallType.NonBlockingNoSideEffect,
            undefined,
            task[2]
          );
        }
      }
      setTimeout(() => drainSourceBufferQueue(sourceBuffer), 50);
    }
  };

  const HTMLMediaDescriptorMap: PropertyDescriptorMap & ThisType<any> = {
    buffered: {
      get() {
        if (!this[TimeRangesKey]) {
          this[TimeRangesKey] = new WorkerTimeRanges(this[WinIdKey], this[InstanceIdKey], [
            'buffered',
          ]);

          setTimeout(() => {
            this[TimeRangesKey] = undefined;
          }, 5000);
        }
        return this[TimeRangesKey];
      },
    },

    readyState: {
      get() {
        if (this[ReadyStateKey] === 4) {
          return 4;
        }
        if (typeof this[ReadyStateKey] !== 'number') {
          this[ReadyStateKey] = getter(this, ['readyState']);

          setTimeout(() => {
            this[ReadyStateKey] = undefined;
          }, 1000);
        }
        return this[ReadyStateKey];
      },
    },
  };

  defineCstr(
    win,
    'MediaSource',
    class extends WorkerEventTargetProxy {
      [SourceBuffersKey]: typeof WorkerSourceBufferList;

      constructor() {
        super(env.$winId$);
        this[SourceBuffersKey] = new WorkerSourceBufferList(this as any);
        constructGlobal(this, 'MediaSource', EMPTY_ARRAY);
      }

      get activeSourceBuffers() {
        return [];
      }

      addSourceBuffer(mimeType: string) {
        const sourceBuffer = new WorkerSourceBuffer(this);
        this[SourceBuffersKey].push(sourceBuffer);
        callMethod(this, ['addSourceBuffer'], [mimeType]);
        return sourceBuffer;
      }

      clearLiveSeekableRange() {
        callMethod(this, ['clearLiveSeekableRange'], EMPTY_ARRAY, CallType.NonBlocking);
      }

      get duration() {
        return getter(this, ['duration']);
      }
      set duration(value) {
        setter(this, ['duration'], value);
      }

      endOfStream(endOfStreamError?: string) {
        callMethod(this, ['endOfStream'], [endOfStreamError], CallType.NonBlockingNoSideEffect);
      }

      get readyState() {
        return getter(this, ['readyState']);
      }

      removeSourceBuffer(sourceBuffer: SourceBuffer) {
        const index = getSourceBufferIndex(sourceBuffer);
        if (index > -1) {
          this[SourceBuffersKey].splice(index, 1);
          callMethod(this, ['removeSourceBuffer'], [index], CallType.Blocking);
        }
      }

      setLiveSeekableRange(start: number, end: number) {
        callMethod(this, ['setLiveSeekableRange'], [start, end], CallType.NonBlocking);
      }

      get sourceBuffers() {
        return this[SourceBuffersKey];
      }

      static isTypeSupported(mimeType: string) {
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/isTypeSupported
        if (!isStaticTypeSupported.has(mimeType)) {
          const isSupported = callMethod(win, ['MediaSource', 'isTypeSupported'], [mimeType]);
          isStaticTypeSupported.set(mimeType, isSupported);
        }
        return isStaticTypeSupported.get(mimeType);
      }
    }
  );

  // patch URL.createObjectURL() so that the main thread's MediaSource instance is used
  const winURL = (win.URL = defineCstrName('URL', class extends URL {}));

  const hasAudioTracks = 'audioTracks' in (win.HTMLMediaElement.prototype as any);
  if (hasAudioTracks) {
    // not all browsers have audioTracks, only add if it's found
    defineCstr(win, 'AudioTrackList', WorkerAudioTrackList);
    defineCstr(win, 'AudioTrack', WorkerAudioTrack);

    HTMLMediaDescriptorMap.audioTracks = {
      get(this: any) {
        return new WorkerAudioTrackList(this);
      },
    };
  }

  definePrototypePropertyDescriptor(win.HTMLMediaElement, HTMLMediaDescriptorMap);

  winURL.createObjectURL = (obj: any) => callMethod(win, ['URL', 'createObjectURL'], [obj]);
  winURL.revokeObjectURL = (obj: any) => callMethod(win, ['URL', 'revokeObjectURL'], [obj]);
};

const isStaticTypeSupported = new Map<string, boolean>();

type SourceBufferTask = ['appendBuffer', any[], any] | ['remove', any[]];

declare const self: MediaSelf;
