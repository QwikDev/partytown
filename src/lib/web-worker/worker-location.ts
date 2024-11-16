import { type LocationUpdateData, LocationUpdateType, type WebWorkerEnvironment } from '../types';

export function forwardLocationChange(
  $winId$: number,
  env: WebWorkerEnvironment,
  data: LocationUpdateData
) {
  const history = env.$window$.history;

  switch (data.type) {
    case LocationUpdateType.PushState: {
      env.$propagateHistoryChange$ = false;
      try {
        history.pushState(data.state, '', data.newUrl);
      } catch (e) {}
      env.$propagateHistoryChange$ = true;
      break;
    }
    case LocationUpdateType.ReplaceState: {
      env.$propagateHistoryChange$ = false;
      try {
        history.replaceState(data.state, '', data.newUrl);
      } catch (e) {}
      env.$propagateHistoryChange$ = true;
      break;
    }
  }
}
