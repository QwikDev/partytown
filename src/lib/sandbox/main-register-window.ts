import { debug } from '../utils';
import { logMain, normalizedWinId } from '../log';
import {
  type MainWindow,
  type PartytownWebWorker,
  type WinId,
  WorkerMessageType,
  LocationUpdateType,
} from '../types';
import { winCtxs, windowIds } from './main-constants';
import { readNextScript } from './read-main-scripts';

export const registerWindow = (
  worker: PartytownWebWorker,
  $winId$: WinId,
  $window$: MainWindow
) => {
  if (!windowIds.has($window$)) {
    windowIds.set($window$, $winId$);

    const doc = $window$.document;
    const history = $window$.history;
    const $parentWinId$ = windowIds.get($window$.parent)!;

    let initialised = false;
    const onInitialisedQueue: Function[] = [];
    const onInitialised = (callback: Function) => {
      if (initialised) {
        callback();
      } else {
        onInitialisedQueue.push(callback);
      }
    };

    const sendInitEnvData = () => {
      worker.postMessage([
        WorkerMessageType.InitializeEnvironment,
        {
          $winId$,
          $parentWinId$,
          $url$: doc.baseURI,
          $visibilityState$: doc.visibilityState,
        },
      ]);

      // Timeout to call postpone second after init message
      setTimeout(() => {
        initialised = true;
        onInitialisedQueue.forEach((callback) => {
          callback();
        });
      });
    };

    const pushState = history.pushState.bind(history);
    const replaceState = history.replaceState.bind(history);

    const onLocationChange =
      (type: LocationUpdateType, state: object, newUrl?: string, oldUrl?: string) => () => {
        worker.postMessage([
          WorkerMessageType.LocationUpdate,
          {
            $winId$,
            type,
            state,
            url: doc.baseURI,
            newUrl,
            oldUrl,
          },
        ]);
      };

    history.pushState = (state, _, newUrl) => {
      pushState(state, _, newUrl);
      onInitialised(onLocationChange(LocationUpdateType.PushState, state, newUrl?.toString()));
    };

    history.replaceState = (state, _, newUrl) => {
      replaceState(state, _, newUrl);
      onInitialised(onLocationChange(LocationUpdateType.ReplaceState, state, newUrl?.toString()));
    };

    $window$.addEventListener('popstate', (event) => {
      onInitialised(onLocationChange(LocationUpdateType.PopState, event.state));
    });
    $window$.addEventListener('hashchange', (event) => {
      onInitialised(
        onLocationChange(LocationUpdateType.HashChange, {}, event.newURL, event.oldURL)
      );
    });
    $window$.addEventListener('ptupdate', () => {
      readNextScript(worker, winCtxs[$winId$]!);
    });
    doc.addEventListener('visibilitychange', () =>
      worker.postMessage([WorkerMessageType.DocumentVisibilityState, $winId$, doc.visibilityState])
    );

    winCtxs[$winId$] = {
      $winId$,
      $window$,
    };

    if (debug) {
      winCtxs[$winId$]!.$startTime$ = performance.now();
    }

    if (debug) {
      const winType = $winId$ === $parentWinId$ ? 'top' : 'iframe';
      logMain(`Registered ${winType} window ${normalizedWinId($winId$)}`);
    }

    if (doc.readyState === 'complete') {
      sendInitEnvData();
    } else {
      $window$.addEventListener('load', sendInitEnvData);
    }
  }
};
