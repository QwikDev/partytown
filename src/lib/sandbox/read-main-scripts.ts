import { debug, SCRIPT_TYPE, SCRIPT_TYPE_EXEC } from '../utils';
import { getAndSetInstanceId } from './main-instances';
import {
  type InitializeScriptData,
  type InstanceId,
  type MainWindowContext,
  type PartytownWebWorker,
  WorkerMessageType,
} from '../types';
import { mainForwardTrigger } from './main-forward-trigger';
import { logMain, normalizedWinId } from '../log';

export const readNextScript = (worker: PartytownWebWorker, winCtx: MainWindowContext) => {
  let $winId$ = winCtx.$winId$;
  let win = winCtx.$window$;
  let doc = win.document;
  let scriptSelector = `script[type="${SCRIPT_TYPE}"]:not([data-ptid]):not([data-pterror])`;
  let blockingScriptSelector = scriptSelector + `:not([async]):not([defer])`;
  let scriptElm: HTMLScriptElement | null;
  let $instanceId$: InstanceId;
  let scriptData: InitializeScriptData;

  if (doc && doc.body) {
    // check the document and document.body exist because
    // it's possible for an iframe that's been appended
    // to the DOM to not be ready yet
    scriptElm = doc.querySelector<HTMLScriptElement>(blockingScriptSelector);

    if (!scriptElm) {
      // first query for partytown scripts are blocking scripts that
      // do not include async or defer attribute that should run first
      // if no blocking scripts are found
      // query again for all scripts which includes async / defer
      scriptElm = doc.querySelector<HTMLScriptElement>(scriptSelector);
    }

    if (scriptElm) {
      // read the next script found
      scriptElm.dataset.ptid = $instanceId$ = getAndSetInstanceId(scriptElm, $winId$) as any;

      scriptData = {
        $winId$,
        $instanceId$,
      };

      if (scriptElm.src) {
        scriptData.$url$ = scriptElm.src;
        scriptData.$orgUrl$ = scriptElm.dataset.ptsrc || scriptElm.src;
      } else {
        scriptData.$content$ = scriptElm.innerHTML;
      }

      worker.postMessage([WorkerMessageType.InitializeNextScript, scriptData]);
    } else {
      if (!winCtx.$isInitialized$) {
        // finished environment initialization
        winCtx.$isInitialized$ = 1;

        mainForwardTrigger(worker, $winId$, win);

        doc.dispatchEvent(new CustomEvent('pt0'));

        if (debug) {
          const winType = win === win.top ? 'top' : 'iframe';
          logMain(
            `Executed ${winType} window ${normalizedWinId($winId$)} environment scripts in ${(
              performance.now() - winCtx.$startTime$!
            ).toFixed(1)}ms`
          );
        }
      }

      worker.postMessage([WorkerMessageType.InitializedScripts, $winId$]);
    }
  } else {
    // document not ready yet, retry a frame later
    requestAnimationFrame(() => readNextScript(worker, winCtx));
  }
};

export const initializedWorkerScript = (
  worker: PartytownWebWorker,
  winCtx: MainWindowContext,
  instanceId: InstanceId,
  errorMsg: string,
  scriptElm?: HTMLScriptElement | null
) => {
  scriptElm = winCtx.$window$.document.querySelector<HTMLScriptElement>(
    `[data-ptid="${instanceId}"]`
  );

  if (scriptElm) {
    if (errorMsg) {
      scriptElm.dataset.pterror = errorMsg;
    } else {
      scriptElm.type += SCRIPT_TYPE_EXEC;
    }
    delete scriptElm.dataset.ptid;
  }

  readNextScript(worker, winCtx);
};
