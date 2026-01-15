import { cachedTreeProps } from './worker-constructors';
import { callMethod, setter, sendToMain } from './worker-proxy';
import {
  CallType,
  NodeName,
  StateProp,
  type WebWorkerEnvironment,
  type WorkerConstructor,
  WorkerMessageType,
  type WorkerNode,
} from '../types';
import {
  commaSplit,
  InstanceDataKey,
  InstanceIdKey,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import {
  defineConstructorName,
  SCRIPT_TYPE,
  SCRIPT_TYPE_EXEC,
  testIfMustLoadScriptOnMainThread,
} from '../utils';
import { getInstanceStateValue } from './worker-state';
import { insertIframe, runScriptContent } from './worker-exec';
import { isScriptJsType } from './worker-script';

export const createNodeCstr = (
  win: any,
  env: WebWorkerEnvironment,
  WorkerBase: WorkerConstructor
) => {
  const config = webWorkerCtx.$config$;

  const WorkerNode = defineConstructorName(
    class extends WorkerBase {
      appendChild(node: WorkerNode) {
        return this.insertBefore(node, null);
      }

      get href() {
        // some scripts are just using node.href and looping up the tree
        // just adding this prop to all nodes to avoid unnecessary main access
        return;
      }
      set href(_: any) {}

      insertBefore(newNode: WorkerNode, referenceNode: Node | null) {
        // ensure the node being added to the window's document
        // is given the same winId as the window it's being added to
        const winId = (newNode[WinIdKey] = this[WinIdKey]);
        const instanceId = newNode[InstanceIdKey];
        const nodeName = newNode[InstanceDataKey];
        const isScript = nodeName === NodeName.Script;
        const isIFrame = nodeName === NodeName.IFrame;

        if (isScript) {
          const scriptContent = getInstanceStateValue<string>(newNode, StateProp.innerHTML);
          const scriptType = getInstanceStateValue<string>(newNode, StateProp.type);

          if (scriptContent) {
            if (isScriptJsType(scriptType)) {
              // @ts-ignore
              const scriptId = newNode.id;
              const loadOnMainThread =
                scriptId && testIfMustLoadScriptOnMainThread(config, scriptId);

              if (loadOnMainThread) {
                setter(newNode, ['type'], 'text/javascript');
              } else {
                const errorMsg = runScriptContent(env, instanceId, scriptContent, winId, '');
                const datasetType = errorMsg ? 'pterror' : 'ptid';
                const datasetValue = errorMsg || instanceId;
                setter(newNode, ['type'], SCRIPT_TYPE + SCRIPT_TYPE_EXEC);
                setter(newNode, ['dataset', datasetType], datasetValue);
              }
            }
            setter(newNode, ['innerHTML'], scriptContent);
          }
        }

        callMethod(this, ['insertBefore'], [newNode, referenceNode], CallType.NonBlocking);

        if (isIFrame) {
          // an iframe element's instanceId is also
          // the winId of its contentWindow
          const src = getInstanceStateValue<string>(newNode, StateProp.src);
          if (src && src.startsWith('javascript:')) {
            const scriptContent = src.split('javascript:')[1];
            runScriptContent(env, instanceId, scriptContent, winId, '');
          }
          insertIframe(instanceId, newNode);
        }
        if (isScript) {
          sendToMain(true);
          webWorkerCtx.$postMessage$([WorkerMessageType.InitializeNextScript, winId]);
        }

        return newNode;
      }

      get nodeName() {
        return this[InstanceDataKey] === '#s' ? '#document-fragment' : this[InstanceDataKey];
      }

      get nodeType() {
        return 3;
      }

      get ownerDocument(): Document {
        return env.$document$;
      }
    },
    'Node'
  );

  cachedTreeProps(
    WorkerNode,
    commaSplit(
      'childNodes,firstChild,isConnected,lastChild,nextSibling,parentElement,parentNode,previousSibling'
    )
  );

  win.Node = WorkerNode;
};
